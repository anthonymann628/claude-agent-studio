import * as fs from "node:fs";
import * as path from "node:path";

export type CatalogManifest = {
  name: string;
  version: string;
  agents: CatalogAgentEntry[];
};

export type CatalogAgentEntry = {
  id: string;
  name: string;
  category?: string;
  model?: string;
  description?: string;
  file: string;
};

export type Pack = {
  id: string;
  name: string;
  version: string;
  description: string;
  agents: string[];
  rationale?: string;
};

export const DEFAULT_CATALOG_URL = "https://raw.githubusercontent.com/anthonymann628/claude-agent-catalog/main";

export async function fetchManifest(catalogUrl: string = DEFAULT_CATALOG_URL): Promise<CatalogManifest> {
  const url = `${catalogUrl.replace(/\/$/, "")}/manifest.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch manifest: ${resp.status} ${resp.statusText}`);
  return resp.json() as Promise<CatalogManifest>;
}

export async function fetchPacks(catalogUrl: string = DEFAULT_CATALOG_URL): Promise<Pack[]> {
  const url = `${catalogUrl.replace(/\/$/, "")}/packs.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch packs: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  // Handle both { packs: [...] } and [...] formats
  return Array.isArray(data) ? data : (data as any).packs ?? [];
}

export async function fetchAgentContent(catalogUrl: string, agentFile: string): Promise<string> {
  const url = `${catalogUrl.replace(/\/$/, "")}/${agentFile.replace(/^\//, "")}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch agent: ${resp.status} ${resp.statusText}`);
  return resp.text();
}

export function getAgentsDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".claude-agent-studio", "agents");
}

export function getAppDataDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".claude-agent-studio");
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load local manifest.json if available (fallback for offline)
export function loadLocalManifest(localPath: string): CatalogManifest | null {
  try {
    const manifestPath = path.resolve(localPath, "manifest.json");
    if (!fs.existsSync(manifestPath)) return null;
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}

export function loadLocalPacks(localPath: string): Pack[] {
  try {
    const packsPath = path.resolve(localPath, "packs.json");
    if (!fs.existsSync(packsPath)) return [];
    const data = JSON.parse(fs.readFileSync(packsPath, "utf-8"));
    return Array.isArray(data) ? data : data.packs ?? [];
  } catch {
    return [];
  }
}
