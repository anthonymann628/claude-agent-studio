import * as fs from "node:fs";
import * as path from "node:path";
import { fetchManifest, fetchAgentContent, getAgentsDir, getAppDataDir, ensureDir, DEFAULT_CATALOG_URL } from "../catalog";

export async function installCommand(agentId: string): Promise<void> {
  if (!agentId) {
    console.error("\n  Usage: agenttoolkitai install <agent-id>\n");
    process.exit(1);
  }

  console.log(`\n  Installing agent: ${agentId}\n`);

  // Fetch manifest to find the agent
  let manifest;
  try {
    manifest = await fetchManifest();
  } catch (err) {
    console.error(`  Failed to fetch catalog: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const entry = manifest.agents.find(a => a.id === agentId);
  if (!entry) {
    console.error(`  Agent "${agentId}" not found in catalog.`);
    console.error(`  Available agents: ${manifest.agents.length}`);
    console.error(`  Try: agenttoolkitai recommend\n`);
    process.exit(1);
  }

  // Fetch agent content
  let content;
  try {
    content = await fetchAgentContent(DEFAULT_CATALOG_URL, entry.file);
  } catch (err) {
    console.error(`  Failed to download agent: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  // Write to agents directory
  const agentsDir = getAgentsDir();
  ensureDir(agentsDir);

  const filename = path.basename(entry.file);
  const destPath = path.join(agentsDir, filename);
  fs.writeFileSync(destPath, content);

  // Update install registry
  const appDir = getAppDataDir();
  const registryPath = path.join(appDir, "install-registry.json");
  let registry = { version: "1.0.0", records: [] as any[] };
  try {
    if (fs.existsSync(registryPath)) {
      registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
    }
  } catch {}

  // Remove existing record for this agent
  registry.records = registry.records.filter((r: any) => r.agentId !== agentId);

  // Parse version from frontmatter
  let version = "unknown";
  const versionMatch = content.match(/^version:\s*["']?(.+?)["']?\s*$/m);
  if (versionMatch) version = versionMatch[1];

  registry.records.push({
    agentId,
    version,
    sourceId: "official",
    installedAt: new Date().toISOString(),
    filePath: destPath,
    originalFile: entry.file,
  });

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

  console.log(`  ✓ Installed: ${entry.name}`);
  console.log(`  ✓ Version: ${version}`);
  console.log(`  ✓ File: ${destPath}`);
  console.log(`  ✓ Category: ${entry.category || "general"}\n`);
}
