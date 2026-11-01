export interface DiscoveredServer {
  app: string;
  name: string;
  version: string;
  ip: string;
  ws_url: string;
}

export async function checkServerAtIp(ip: string, timeoutMs: number = 800): Promise<DiscoveredServer | null> {
  const cleanIp = ip.trim();
  if (!cleanIp) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`http://${cleanIp}:8080/discovery`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.ok) {
      const data: DiscoveredServer = await res.json();
      if (data && data.app === 'streamdesk' && data.ws_url) {
        return data;
      }
    }
  } catch {
    // Falha silenciosa para hosts não alcançáveis durante a varredura
  }
  return null;
}

export async function scanSubnetForServer(
  baseSubnet: string = '192.168.1',
  onProgress?: (checked: number, total: number) => void
): Promise<DiscoveredServer | null> {
  // Gera lista com prioridade para IPs comuns (.1, .2, .15, .100, .101, etc.)
  const priorityHosts = [15, 2, 3, 4, 5, 10, 20, 50, 100, 101, 102, 110, 120, 150, 200];
  const allHosts = Array.from({ length: 254 }, (_, i) => i + 1);
  const remaining = allHosts.filter((h) => !priorityHosts.includes(h));
  const candidateHosts = [...priorityHosts, ...remaining];

  const batchSize = 16;
  let checkedCount = 0;

  for (let i = 0; i < candidateHosts.length; i += batchSize) {
    const batch = candidateHosts.slice(i, i + batchSize);
    const promises = batch.map((host) => checkServerAtIp(`${baseSubnet}.${host}`, 900));

    const results = await Promise.all(promises);
    checkedCount += batch.length;
    onProgress?.(checkedCount, candidateHosts.length);

    for (const found of results) {
      if (found) {
        return found;
      }
    }
  }

  return null;
}
