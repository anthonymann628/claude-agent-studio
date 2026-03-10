import * as fs from "node:fs";
import * as path from "node:path";
import { getAgentsDir, getAppDataDir, ensureDir, DEFAULT_CATALOG_URL } from "../catalog";

export async function initCommand(): Promise<void> {
  console.log("\n  agenttoolkitai — Claude Agent Studio CLI\n");
  console.log("  Initializing...\n");

  const appDir = getAppDataDir();
  const agentsDir = getAgentsDir();

  ensureDir(appDir);
  ensureDir(agentsDir);

  // Create default sources.json if not present
  const sourcesPath = path.join(appDir, "sources.json");
  if (!fs.existsSync(sourcesPath)) {
    const defaultSources = [
      {
        id: "official",
        name: "Official Catalog",
        kind: "official",
        manifestUrl: DEFAULT_CATALOG_URL,
        localPath: "catalogs/official",
        enabled: true,
      },
    ];
    fs.writeFileSync(sourcesPath, JSON.stringify(defaultSources, null, 2));
    console.log("  ✓ Created sources.json");
  } else {
    console.log("  ✓ sources.json already exists");
  }

  // Create install registry if not present
  const registryPath = path.join(appDir, "install-registry.json");
  if (!fs.existsSync(registryPath)) {
    fs.writeFileSync(registryPath, JSON.stringify({ version: "1.0.0", records: [] }, null, 2));
    console.log("  ✓ Created install-registry.json");
  } else {
    console.log("  ✓ install-registry.json already exists");
  }

  console.log(`  ✓ Agents directory: ${agentsDir}`);
  console.log("\n  Initialization complete.\n");
  console.log("  Next steps:");
  console.log("    agenttoolkitai scan         Scan a project for signals");
  console.log("    agenttoolkitai recommend    Get agent recommendations");
  console.log("    agenttoolkitai install      Install agents from catalog");
  console.log("    agenttoolkitai doctor       Check system health");
  console.log("");
}
