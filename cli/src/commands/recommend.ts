import * as path from "node:path";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { scanProject } from "../scanner/index";
import { fetchManifest, fetchPacks } from "../catalog";
import { installAgentByEntry } from "./install";

// We inline the recommendation logic here since the CLI is bundled separately
// from the frontend. This mirrors the engine in src/features/scan/recommendation/engine.ts

type AgentRecommendation = {
  agentId: string;
  agentName: string;
  category: string;
  relevanceScore: number;
  reasons: string[];
  matchedSignals: string[];
};

type PackRecommendation = {
  packId: string;
  packName: string;
  relevanceScore: number;
  coverage: number;
  reasons: string[];
  matchedAgents: string[];
};

// Import the actual engine from the project source tree
// esbuild will resolve and bundle this
import { generateRecommendations } from "../../../src/features/scan/recommendation/engine";

export async function recommendCommand(targetPath?: string): Promise<void> {
  const rootPath = path.resolve(targetPath || ".");

  console.log(`\n  Scanning: ${rootPath}\n`);
  const profile = scanProject(rootPath);
  console.log(`  Scan completed in ${profile.scanDurationMs}ms\n`);

  console.log("  Fetching catalog...");
  let manifest, packs;
  try {
    [manifest, packs] = await Promise.all([fetchManifest(), fetchPacks()]);
    console.log(`  Catalog loaded: ${manifest.agents.length} agents, ${packs.length} packs\n`);
  } catch (err) {
    console.error(`  Failed to fetch catalog: ${err instanceof Error ? err.message : err}`);
    console.error("  Run 'agenttoolkitai doctor' to check connectivity.\n");
    process.exit(1);
  }

  const result = generateRecommendations(profile, manifest, packs);

  // Display agent recommendations
  if (result.agents.length > 0) {
    console.log("  Recommended Agents:");
    console.log("  " + "─".repeat(60));
    for (const agent of result.agents.slice(0, 15)) {
      const score = Math.round(agent.relevanceScore * 100);
      console.log(`    ${agent.agentName.padEnd(30)} ${score}%  [${agent.category}]`);
      console.log(`      ${agent.reasons[0]}`);
    }
    console.log("");
  }

  // Display pack recommendations
  if (result.packs.length > 0) {
    console.log("  Recommended Packs:");
    console.log("  " + "─".repeat(60));
    for (const pack of result.packs.slice(0, 5)) {
      const score = Math.round(pack.relevanceScore * 100);
      const cov = Math.round(pack.coverage * 100);
      console.log(`    ${pack.packName.padEnd(30)} ${score}%  (${cov}% coverage)`);
      console.log(`      Agents: ${pack.matchedAgents.slice(0, 3).join(", ")}${pack.matchedAgents.length > 3 ? "..." : ""}`);
    }
    console.log("");
  }

  // Display gaps
  if (result.gaps.length > 0) {
    console.log("  Gap Analysis:");
    console.log("  " + "─".repeat(60));
    for (const gap of result.gaps) {
      const severity = gap.severity === "high" ? "!!" : gap.severity === "medium" ? " !" : "  ";
      console.log(`    ${severity} [${gap.category}] ${gap.gap}`);
    }
    console.log("");
  }

  // Save recommendation to file
  const outputPath = path.join(rootPath, ".agenttoolkit-recommendations.json");
  fs.writeFileSync(outputPath, JSON.stringify({ profile, recommendations: result }, null, 2));
  console.log(`  Full results saved to: ${outputPath}\n`);

  // Prompt to install top recommended agents
  const topAgents = result.agents.slice(0, 5);
  if (topAgents.length === 0) return;

  const answer = await promptYesNo(`  Install the top ${topAgents.length} recommended agents now? (Y/n) `);
  if (!answer) {
    console.log("\n  Skipped. You can install agents individually:\n");
    for (const a of topAgents) {
      console.log(`    agenttoolkitai install ${a.agentId}`);
    }
    console.log("");
    return;
  }

  console.log("");
  let installed = 0;
  for (const rec of topAgents) {
    const entry = manifest.agents.find(a => a.id === rec.agentId);
    if (!entry) {
      console.log(`  ✗ ${rec.agentName} — not found in catalog`);
      continue;
    }
    try {
      await installAgentByEntry(entry);
      console.log(`  ✓ ${rec.agentName}`);
      installed++;
    } catch (err) {
      console.log(`  ✗ ${rec.agentName} — ${err instanceof Error ? err.message : "failed"}`);
    }
  }
  console.log(`\n  Installed ${installed}/${topAgents.length} agents.\n`);
}

function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      resolve(trimmed === "" || trimmed === "y" || trimmed === "yes");
    });
  });
}
