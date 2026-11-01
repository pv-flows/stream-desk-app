import { z } from "zod";

export const backupButtonSchema = z
  .object({
    id: z.number().optional().default(0),
    label: z.string().min(1, "O rótulo do botão não pode ser vazio"),
    action_name: z.string().optional(),
    actionName: z.string().optional(),
    color: z.string().optional().default("#6366f1"),
    icon: z.string().optional().default("zap"),
    page_index: z.number().optional(),
    pageIndex: z.number().optional(),
    position: z.number().optional().default(0),
  })
  .transform((btn) => ({
    id: btn.id ?? 0,
    label: btn.label,
    action_name: btn.action_name ?? btn.actionName ?? "open_app:calc",
    color: btn.color || "#6366f1",
    icon: btn.icon || "zap",
    page_index: btn.page_index ?? btn.pageIndex ?? 1,
    position: btn.position ?? 0,
  }));

export const backupPageSchema = z.object({
  id: z.number().optional().default(0),
  name: z.string().min(1, "O nome da página não pode ser vazio"),
});

export const backupWindowRuleSchema = z
  .object({
    id: z.number().optional().default(0),
    process_name: z.string().optional(),
    processName: z.string().optional(),
    page_index: z.number().optional(),
    pageIndex: z.number().optional(),
    enabled: z.boolean().optional().default(true),
  })
  .transform((r) => ({
    id: r.id ?? 0,
    process_name: r.process_name ?? r.processName ?? "",
    page_index: r.page_index ?? r.pageIndex ?? 1,
    enabled: r.enabled ?? true,
  }));

export const backupAppearanceSchema = z.object({
  theme: z.string().optional().default("escuro"),
  accent_color: z.string().optional().default("purple"),
  grid_columns: z.number().optional().default(3),
  vibration_enabled: z.boolean().optional().default(true),
  icon_style: z.enum(["linha", "preenchido"]).optional().default("linha"),
});

export const backupPayloadSchema = z
  .object({
    version: z.string().optional(),
    exportedAt: z.string().optional(),
    theme: z.string().optional(),
    appearance: backupAppearanceSchema.optional(),
    pages: z.array(backupPageSchema).min(1, "O backup precisa conter pelo menos 1 página"),
    buttons: z.array(backupButtonSchema).default([]),
    windowRules: z.array(backupWindowRuleSchema).optional(),
    window_rules: z.array(backupWindowRuleSchema).optional(),
  })
  .transform((p) => ({
    version: p.version,
    exportedAt: p.exportedAt,
    theme: p.theme,
    appearance: p.appearance,
    pages: p.pages,
    buttons: p.buttons,
    windowRules: p.windowRules ?? p.window_rules ?? [],
  }));

export type BackupPayload = z.infer<typeof backupPayloadSchema>;
