#!/usr/bin/env node
// Live probe for the Stream Desk tester agent.
// Connects to the running Tauri app (WebView2 via CDP) and executes a JSON scenario:
// interact (click/fill/drag/press...), assert (expect) and observe (ariaSnapshot/screenshot).
// Output: one compact JSON report on stdout. Exit codes: 0 = all passed, 1 = assertion/step failed, 2 = setup error.
//
// Usage:
//   node probe.mjs scenarios/<file>.json [--target cdp|vite] [--port 9222] [--continue]
//
// Token economy: prefer `snapshot` (text) over `screenshot` (image). Snapshots are truncated.

import { chromium } from "playwright-core";
import { readFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "out");
const DEV_URL = "http://localhost:1420";
const GLOBAL_TIMEOUT_MS = 90_000;
const STEP_TIMEOUT_MS = 5_000;
const SNAPSHOT_MAX_CHARS = 3_000;
const MAX_SCREENSHOTS = 4;
const MAX_CONSOLE_ENTRIES = 10;

function parseArgs(argv) {
  const args = { file: null, target: "cdp", port: 9222, continueOnFail: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") args.target = argv[++i];
    else if (a === "--port") args.port = Number(argv[++i]);
    else if (a === "--continue") args.continueOnFail = true;
    else if (!args.file) args.file = a;
  }
  return args;
}

function truncate(text, max = SNAPSHOT_MAX_CHARS) {
  if (typeof text !== "string") text = JSON.stringify(text);
  return text.length > max ? `${text.slice(0, max)}\n…[truncado ${text.length - max} chars]` : text;
}

function emit(report, code) {
  process.stdout.write(`${JSON.stringify(report, null, 1)}\n`);
  process.exit(code);
}

async function connect(target, port) {
  if (target === "vite") {
    // Layout-only mode: no Tauri IPC available (invoke will fail). Uses the installed Edge.
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(DEV_URL, { waitUntil: "domcontentloaded" });
    return { browser, page, close: () => browser.close() };
  }
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 10_000 });
  const pages = browser.contexts().flatMap((c) => c.pages());
  const page =
    pages.find((p) => /localhost:1420|tauri\.localhost/.test(p.url())) ?? pages[0];
  if (!page) throw new Error("CDP conectado, mas nenhuma página do app foi encontrada.");
  // Do not close the real app window: only drop the CDP connection.
  return { browser, page, close: () => browser.close().catch(() => {}) };
}

async function runStep(page, step, ctx) {
  const timeout = step.timeout ?? STEP_TIMEOUT_MS;
  const loc = step.selector ? page.locator(step.selector).first() : null;
  switch (step.do) {
    case "reload":
      await page.reload({ waitUntil: "domcontentloaded" });
      return null;
    case "click":
      await loc.click({ timeout, button: step.button ?? "left", clickCount: step.clicks ?? 1 });
      return null;
    case "dblclick":
      await loc.dblclick({ timeout });
      return null;
    case "hover":
      await loc.hover({ timeout });
      return null;
    case "fill":
      await loc.fill(String(step.value ?? ""), { timeout });
      return null;
    case "type":
      await loc.pressSequentially(String(step.value ?? ""), { timeout, delay: 20 });
      return null;
    case "press":
      if (loc) await loc.press(step.key, { timeout });
      else await page.keyboard.press(step.key);
      return null;
    case "select":
      await loc.selectOption(step.value, { timeout });
      return null;
    case "scroll":
      if (loc) await loc.scrollIntoViewIfNeeded({ timeout });
      else await page.mouse.wheel(step.dx ?? 0, step.dy ?? 400);
      return null;
    case "drag": {
      // Manual mouse drag with intermediate moves: works with @hello-pangea/dnd and pointer-based sliders.
      const from = page.locator(step.from).first();
      const fromBox = await from.boundingBox({ timeout });
      if (!fromBox) throw new Error(`drag: origem não visível (${step.from})`);
      let toX;
      let toY;
      if (step.to) {
        const toBox = await page.locator(step.to).first().boundingBox({ timeout });
        if (!toBox) throw new Error(`drag: destino não visível (${step.to})`);
        toX = toBox.x + toBox.width / 2;
        toY = toBox.y + toBox.height / 2;
      } else {
        toX = fromBox.x + fromBox.width / 2 + (step.dx ?? 0);
        toY = fromBox.y + fromBox.height / 2 + (step.dy ?? 0);
      }
      const sx = fromBox.x + fromBox.width / 2;
      const sy = fromBox.y + fromBox.height / 2;
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.mouse.move(sx + 5, sy + 5, { steps: 3 });
      await page.mouse.move(toX, toY, { steps: step.steps ?? 15 });
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(250);
      return null;
    }
    case "wait":
      await page.waitForTimeout(Math.min(step.ms ?? 300, 5_000));
      return null;
    case "waitFor":
      await loc.waitFor({ state: step.state ?? "visible", timeout });
      return null;
    case "expect":
      return expectStep(page, loc, step, timeout);
    case "snapshot": {
      const target = step.selector ? loc : page.locator("body");
      const snap = await target.ariaSnapshot({ timeout });
      return { snapshot: truncate(snap, step.maxChars ?? SNAPSHOT_MAX_CHARS) };
    }
    case "screenshot": {
      if (ctx.screenshots.length >= MAX_SCREENSHOTS) {
        return { skipped: `limite de ${MAX_SCREENSHOTS} screenshots por execução atingido` };
      }
      const file = join(OUT_DIR, `${ctx.runId}-${step.name ?? `step${ctx.index}`}.png`);
      if (loc) await loc.screenshot({ path: file, timeout });
      else await page.screenshot({ path: file, fullPage: false });
      ctx.screenshots.push(file);
      return { screenshot: file };
    }
    case "eval": {
      const value = await page.evaluate(step.js);
      return { value: truncate(value, 1_000) };
    }
    default:
      throw new Error(`Passo desconhecido: "${step.do}"`);
  }
}

async function expectStep(page, loc, step, timeout) {
  const failures = [];
  if (step.count !== undefined) {
    const n = await page.locator(step.selector).count();
    if (n !== step.count) failures.push(`count esperado ${step.count}, obtido ${n}`);
  }
  if (step.visible !== undefined) {
    let visible = false;
    try {
      await loc.waitFor({ state: step.visible ? "visible" : "hidden", timeout });
      visible = step.visible;
    } catch {
      visible = !step.visible;
    }
    if (visible !== step.visible) failures.push(`visible esperado ${step.visible}`);
  }
  if (step.text !== undefined) {
    const actual = ((await loc.innerText({ timeout })) ?? "").trim();
    if (!actual.includes(step.text)) failures.push(`texto deveria conter "${step.text}", obtido "${truncate(actual, 200)}"`);
  }
  if (step.notText !== undefined) {
    const actual = ((await loc.innerText({ timeout })) ?? "").trim();
    if (actual.includes(step.notText)) failures.push(`texto não deveria conter "${step.notText}"`);
  }
  if (step.css) {
    for (const [prop, expected] of Object.entries(step.css)) {
      const actual = await loc.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p).trim(), prop);
      if (actual !== expected) failures.push(`css ${prop} esperado "${expected}", obtido "${actual}"`);
    }
  }
  if (step.attr) {
    for (const [name, expected] of Object.entries(step.attr)) {
      const actual = await loc.getAttribute(name, { timeout });
      if (actual !== expected) failures.push(`attr ${name} esperado "${expected}", obtido "${actual}"`);
    }
  }
  if (step.js) {
    const ok = await page.evaluate(step.js);
    if (!ok) failures.push(`condição JS falsa: ${truncate(step.js, 200)}`);
  }
  if (failures.length) throw new Error(failures.join("; "));
  return { assert: "ok" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) emit({ status: "SETUP_ERROR", error: "Informe o arquivo do cenário: node probe.mjs scenarios/x.json" }, 2);

  let scenario;
  try {
    scenario = JSON.parse(await readFile(resolve(process.cwd(), args.file), "utf8"));
  } catch (e) {
    emit({ status: "SETUP_ERROR", error: `Cenário inválido: ${e.message}` }, 2);
  }
  await mkdir(OUT_DIR, { recursive: true });

  const watchdog = setTimeout(() => {
    emit({ status: "TIMEOUT", error: `Execução excedeu ${GLOBAL_TIMEOUT_MS / 1000}s` }, 1);
  }, GLOBAL_TIMEOUT_MS);

  let session;
  try {
    session = await connect(args.target, args.port);
  } catch (e) {
    clearTimeout(watchdog);
    emit({
      status: "SETUP_ERROR",
      error: `Não foi possível conectar (${args.target}): ${e.message.split("\n")[0]}`,
      hint: "Rode .\\tools\\live-test\\start-app.ps1 antes (modo cdp).",
    }, 2);
  }

  const { page } = session;
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && consoleErrors.length < MAX_CONSOLE_ENTRIES) consoleErrors.push(truncate(m.text(), 300));
  });
  page.on("pageerror", (err) => {
    if (consoleErrors.length < MAX_CONSOLE_ENTRIES) consoleErrors.push(`pageerror: ${truncate(err.message, 300)}`);
  });

  const ctx = { runId: `${scenario.name ?? "run"}-${Date.now()}`, screenshots: [], index: 0 };
  const results = [];
  let failed = false;

  for (const [i, step] of (scenario.steps ?? []).entries()) {
    ctx.index = i;
    const label = step.label ?? `${step.do} ${step.selector ?? step.from ?? step.key ?? ""}`.trim();
    try {
      const data = await runStep(page, step, ctx);
      results.push({ i, step: label, ok: true, ...(data ?? {}) });
    } catch (e) {
      failed = true;
      const entry = { i, step: label, ok: false, error: truncate(e.message.split("\n")[0], 400) };
      // Automatic evidence on failure: text snapshot (cheap) + one screenshot.
      try {
        entry.snapshotOnFail = truncate(await page.locator("body").ariaSnapshot({ timeout: 3_000 }), 2_000);
      } catch { /* ignore */ }
      if (ctx.screenshots.length < MAX_SCREENSHOTS) {
        const file = join(OUT_DIR, `${ctx.runId}-fail-step${i}.png`);
        try {
          await page.screenshot({ path: file });
          ctx.screenshots.push(file);
          entry.screenshot = file;
        } catch { /* ignore */ }
      }
      results.push(entry);
      if (!args.continueOnFail && !scenario.continueOnFail) break;
    }
  }

  clearTimeout(watchdog);
  await session.close();
  emit({
    scenario: scenario.name ?? args.file,
    target: args.target,
    status: failed ? "FAIL" : "PASS",
    passed: results.filter((r) => r.ok).length,
    total: (scenario.steps ?? []).length,
    results,
    consoleErrors,
    screenshots: ctx.screenshots,
  }, failed ? 1 : 0);
}

main().catch((e) => emit({ status: "SETUP_ERROR", error: e.message }, 2));

