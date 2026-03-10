#!/usr/bin/env node

// cli/src/commands/init.ts
import * as fs2 from "node:fs";
import * as path2 from "node:path";

// cli/src/catalog.ts
import * as fs from "node:fs";
import * as path from "node:path";
var DEFAULT_CATALOG_URL = "https://raw.githubusercontent.com/anthonymann628/claude-agent-catalog/main";
async function fetchManifest(catalogUrl = DEFAULT_CATALOG_URL) {
  const url = `${catalogUrl.replace(/\/$/, "")}/manifest.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch manifest: ${resp.status} ${resp.statusText}`);
  return resp.json();
}
async function fetchPacks(catalogUrl = DEFAULT_CATALOG_URL) {
  const url = `${catalogUrl.replace(/\/$/, "")}/packs.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch packs: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  return Array.isArray(data) ? data : data.packs ?? [];
}
async function fetchAgentContent(catalogUrl, agentFile) {
  const url = `${catalogUrl.replace(/\/$/, "")}/${agentFile.replace(/^\//, "")}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch agent: ${resp.status} ${resp.statusText}`);
  return resp.text();
}
function getAgentsDir() {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".claude-agent-studio", "agents");
}
function getAppDataDir() {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".claude-agent-studio");
}
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// cli/src/commands/init.ts
var BANNER = `
    _                    _     _____           _ _    _ _
   / \\   __ _  ___ _ __ | |_  |_   _|__   ___ | | | _(_) |_
  / _ \\ / _\` |/ _ \\ '_ \\| __|   | |/ _ \\ / _ \\| | |/ / | __|
 / ___ \\ (_| |  __/ | | | |_    | | (_) | (_) | |   <| | |_
/_/   \\_\\__, |\\___|_| |_|\\__|   |_|\\___/ \\___/|_|_|\\_\\_|\\__|
        |___/                              \x1B[36mfor Claude\x1B[0m
`;
async function initCommand() {
  console.log(BANNER);
  console.log("  Initializing...\n");
  const appDir = getAppDataDir();
  const agentsDir = getAgentsDir();
  ensureDir(appDir);
  ensureDir(agentsDir);
  const sourcesPath = path2.join(appDir, "sources.json");
  if (!fs2.existsSync(sourcesPath)) {
    const defaultSources = [
      {
        id: "official",
        name: "Official Catalog",
        kind: "official",
        manifestUrl: DEFAULT_CATALOG_URL,
        localPath: "catalogs/official",
        enabled: true
      }
    ];
    fs2.writeFileSync(sourcesPath, JSON.stringify(defaultSources, null, 2));
    console.log("  \u2713 Created sources.json");
  } else {
    console.log("  \u2713 sources.json already exists");
  }
  const registryPath = path2.join(appDir, "install-registry.json");
  if (!fs2.existsSync(registryPath)) {
    fs2.writeFileSync(registryPath, JSON.stringify({ version: "1.0.0", records: [] }, null, 2));
    console.log("  \u2713 Created install-registry.json");
  } else {
    console.log("  \u2713 install-registry.json already exists");
  }
  console.log(`  \u2713 Agents directory: ${agentsDir}`);
  console.log("\n  Initialization complete.\n");
  console.log("  Next steps:");
  console.log("    agenttoolkitai scan         Scan a project for signals");
  console.log("    agenttoolkitai recommend    Get agent recommendations");
  console.log("    agenttoolkitai install      Install agents from catalog");
  console.log("    agenttoolkitai doctor       Check system health");
  console.log("");
}

// cli/src/commands/scan.ts
import * as path4 from "node:path";

// cli/src/scanner/collector.ts
import * as fs3 from "node:fs";
import * as path3 from "node:path";
var DEFAULT_EXCLUDES = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "target",
  "__pycache__",
  ".next",
  ".venv",
  "venv",
  ".tox",
  ".mypy_cache",
  ".pytest_cache",
  "coverage",
  ".turbo",
  ".vercel",
  ".output",
  ".nuxt",
  ".svelte-kit",
  "vendor",
  "Pods",
  ".gradle",
  ".idea",
  ".vscode"
]);
var SIGNIFICANT_FOLDERS = /* @__PURE__ */ new Set([
  "src",
  "lib",
  "api",
  "app",
  "components",
  "pages",
  "routes",
  "services",
  "models",
  "prisma",
  "migrations",
  "scripts",
  "test",
  "tests",
  "__tests__",
  "spec",
  "e2e",
  "cypress",
  "playwright",
  "storybook",
  ".storybook",
  "docker",
  "k8s",
  "kubernetes",
  "terraform",
  ".github",
  ".circleci",
  "deploy",
  "infra",
  "packages",
  "apps",
  "modules",
  "plugins",
  "hooks",
  "middleware",
  "controllers",
  "views",
  "templates",
  "public",
  "static",
  "assets"
]);
var MAX_READ_BYTES = 2e3;
var CONFIG_FILES_EXACT = /* @__PURE__ */ new Set([
  // Container
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".dockerignore",
  // CI/CD
  "Jenkinsfile",
  ".gitlab-ci.yml",
  ".travis.yml",
  "bitbucket-pipelines.yml",
  // Deploy
  "vercel.json",
  "netlify.toml",
  "fly.toml",
  "railway.json",
  "render.yaml",
  "Procfile",
  // TS/JS
  "tsconfig.json",
  "jsconfig.json",
  // Framework
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "nuxt.config.ts",
  "nuxt.config.js",
  "vite.config.ts",
  "vite.config.js",
  "svelte.config.js",
  "astro.config.mjs",
  "remix.config.js",
  "angular.json",
  // Monorepo
  "lerna.json",
  "nx.json",
  "turbo.json",
  "pnpm-workspace.yaml",
  "rush.json",
  // API docs
  "openapi.yaml",
  "openapi.yml",
  "openapi.json",
  "swagger.yaml",
  "swagger.yml",
  "swagger.json",
  // Linting (exact)
  "biome.json",
  ".editorconfig",
  // Env files
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.staging",
  ".env.test",
  // Dependency manifests (also treated as configs)
  "pom.xml",
  "build.gradle",
  "build.gradle.kts"
]);
var CONFIG_PREFIXES = [
  "jest.config",
  "vitest.config",
  "playwright.config",
  "cypress.config",
  ".mocharc",
  ".eslintrc",
  "eslint.config",
  ".prettierrc"
];
var DEP_FILES = /* @__PURE__ */ new Set([
  "package.json",
  "Cargo.toml",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "Gemfile",
  "composer.json",
  "pubspec.yaml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts"
]);
function safeReadFile(filePath, maxBytes = MAX_READ_BYTES) {
  try {
    const fd = fs3.openSync(filePath, "r");
    const buf = Buffer.alloc(maxBytes);
    const bytesRead = fs3.readSync(fd, buf, 0, maxBytes, 0);
    fs3.closeSync(fd);
    return buf.subarray(0, bytesRead).toString("utf-8");
  } catch {
    return null;
  }
}
function safeReadFileAll(filePath) {
  try {
    return fs3.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function parsePackageJson(content, deps) {
  try {
    const pkg = JSON.parse(content);
    const sections = [pkg.dependencies, pkg.devDependencies];
    for (const section of sections) {
      if (section && typeof section === "object") {
        for (const [name, version] of Object.entries(section)) {
          if (typeof version === "string") {
            deps.set(name, version);
          }
        }
      }
    }
  } catch {
  }
}
function parseCargoToml(content, deps) {
  const lines = content.split("\n");
  let inDeps = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\[dependencies\]$/i.test(trimmed) || /^\[dev-dependencies\]$/i.test(trimmed) || /^\[build-dependencies\]$/i.test(trimmed)) {
      inDeps = true;
      continue;
    }
    if (trimmed.startsWith("[")) {
      inDeps = false;
      continue;
    }
    if (!inDeps || !trimmed || trimmed.startsWith("#")) continue;
    const simpleMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/);
    if (simpleMatch) {
      deps.set(simpleMatch[1], simpleMatch[2]);
      continue;
    }
    const tableMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*\{.*version\s*=\s*"([^"]+)"/);
    if (tableMatch) {
      deps.set(tableMatch[1], tableMatch[2]);
    }
  }
}
function parseRequirementsTxt(content, deps) {
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
    const m = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*([=!<>~]+)\s*([^\s;#,]+)/);
    if (m) {
      deps.set(m[1], `${m[2]}${m[3]}`);
    } else {
      const bare = trimmed.match(/^([a-zA-Z0-9_.-]+)/);
      if (bare) {
        deps.set(bare[1], "*");
      }
    }
  }
}
function parsePyprojectToml(content, deps) {
  const lines = content.split("\n");
  let inDeps = false;
  let bracketDepth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\[project\]/.test(trimmed)) {
      continue;
    }
    if (trimmed === "[project.dependencies]") {
      inDeps = true;
      continue;
    }
    if (inDeps && trimmed.startsWith("[") && !trimmed.startsWith('["')) {
      inDeps = false;
      continue;
    }
    if (/^dependencies\s*=\s*\[/.test(trimmed)) {
      inDeps = true;
      bracketDepth = 1;
      const items = trimmed.match(/"([^"]+)"/g);
      if (items) {
        for (const item of items) {
          parsePyDep(item.replace(/"/g, ""), deps);
        }
      }
      if (trimmed.includes("]")) {
        inDeps = false;
        bracketDepth = 0;
      }
      continue;
    }
    if (!inDeps) continue;
    if (trimmed === "]") {
      inDeps = false;
      continue;
    }
    const m = trimmed.match(/"([^"]+)"/);
    if (m) {
      parsePyDep(m[1], deps);
    }
  }
}
function parsePyDep(spec, deps) {
  const m = spec.match(/^([a-zA-Z0-9_.-]+)\s*([=!<>~]+.+)?/);
  if (m) {
    deps.set(m[1], m[2]?.trim() ?? "*");
  }
}
function parseGoMod(content, deps) {
  const lines = content.split("\n");
  let inRequire = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("require (")) {
      inRequire = true;
      continue;
    }
    if (trimmed === "require(") {
      inRequire = true;
      continue;
    }
    if (inRequire && trimmed === ")") {
      inRequire = false;
      continue;
    }
    const singleMatch = trimmed.match(/^require\s+(\S+)\s+(\S+)/);
    if (singleMatch) {
      deps.set(singleMatch[1], singleMatch[2]);
      continue;
    }
    if (inRequire) {
      const m = trimmed.match(/^(\S+)\s+(\S+)/);
      if (m && !m[1].startsWith("//")) {
        deps.set(m[1], m[2]);
      }
    }
  }
}
function parseGemfile(content, deps) {
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("gem ")) continue;
    const m = trimmed.match(/gem\s+["']([^"']+)["'](?:\s*,\s*["']([^"']+)["'])?/);
    if (m) {
      deps.set(m[1], m[2] ?? "*");
    }
  }
}
function parseComposerJson(content, deps) {
  try {
    const pkg = JSON.parse(content);
    const sections = [pkg.require, pkg["require-dev"]];
    for (const section of sections) {
      if (section && typeof section === "object") {
        for (const [name, version] of Object.entries(section)) {
          if (typeof version === "string" && name !== "php") {
            deps.set(name, version);
          }
        }
      }
    }
  } catch {
  }
}
function parsePubspecYaml(content, deps) {
  const lines = content.split("\n");
  let inDeps = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "dependencies:" || trimmed === "dev_dependencies:") {
      inDeps = true;
      continue;
    }
    if (!line.startsWith(" ") && !line.startsWith("	") && trimmed.endsWith(":") && inDeps) {
      inDeps = false;
      continue;
    }
    if (!inDeps) continue;
    const m = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*\^?([^\s#]+)/);
    if (m && m[2] !== "{") {
      deps.set(m[1], m[2]);
    }
  }
}
function parseEnvFile(content) {
  const vars = [];
  const lines = content.split("\n").slice(0, 50);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m) {
      vars.push(m[1]);
    }
  }
  return vars;
}
function isConfigFile(filename) {
  if (CONFIG_FILES_EXACT.has(filename)) return true;
  for (const prefix of CONFIG_PREFIXES) {
    if (filename.startsWith(prefix)) return true;
  }
  if (filename.startsWith(".env.")) return true;
  return false;
}
function isTerraformFile(filename) {
  return filename.endsWith(".tf");
}
function collectSignals(rootPath, maxDepth = 5) {
  const files = [];
  const dependencies = /* @__PURE__ */ new Map();
  const configsSet = /* @__PURE__ */ new Set();
  const envVarsSet = /* @__PURE__ */ new Set();
  let readmeText = "";
  const folderPatternsSet = /* @__PURE__ */ new Set();
  function walk(dirPath, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs3.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const name = entry.name;
      const fullPath = path3.join(dirPath, name);
      const relPath = path3.relative(rootPath, fullPath);
      if (entry.isDirectory()) {
        if (DEFAULT_EXCLUDES.has(name)) continue;
        if (SIGNIFICANT_FOLDERS.has(name)) {
          folderPatternsSet.add(name);
        }
        if (relPath === ".github/workflows" || relPath === path3.join(".github", "workflows")) {
          configsSet.add(".github/workflows");
        }
        if (relPath === ".circleci") {
          configsSet.add(".circleci");
        }
        if (relPath === "prisma") {
          configsSet.add("prisma");
        }
        walk(fullPath, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      files.push(relPath);
      if (isConfigFile(name)) {
        configsSet.add(name);
      }
      if (isTerraformFile(name)) {
        configsSet.add("*.tf");
      }
      if (depth === 0 && !readmeText && (name.toLowerCase() === "readme.md" || name.toLowerCase() === "readme")) {
        const content = safeReadFile(fullPath, 5e3);
        if (content) {
          readmeText = content;
        }
      }
      if (name.startsWith(".env")) {
        const content = safeReadFile(fullPath);
        if (content) {
          for (const v of parseEnvFile(content)) {
            envVarsSet.add(v);
          }
        }
      }
      if (DEP_FILES.has(name)) {
        if (name === "pom.xml" || name === "build.gradle" || name === "build.gradle.kts") {
          configsSet.add(name);
          continue;
        }
        const content = safeReadFileAll(fullPath);
        if (!content) continue;
        switch (name) {
          case "package.json":
            parsePackageJson(content, dependencies);
            break;
          case "Cargo.toml":
            parseCargoToml(content, dependencies);
            break;
          case "requirements.txt":
            parseRequirementsTxt(content, dependencies);
            break;
          case "pyproject.toml":
            parsePyprojectToml(content, dependencies);
            break;
          case "go.mod":
            parseGoMod(content, dependencies);
            break;
          case "Gemfile":
            parseGemfile(content, dependencies);
            break;
          case "composer.json":
            parseComposerJson(content, dependencies);
            break;
          case "pubspec.yaml":
            parsePubspecYaml(content, dependencies);
            break;
        }
      }
    }
  }
  const resolvedRoot = path3.resolve(rootPath);
  try {
    const stat = fs3.statSync(resolvedRoot);
    if (!stat.isDirectory()) {
      return { files, dependencies, configs: [], envVars: [], readmeText, folderPatterns: [] };
    }
  } catch {
    return { files, dependencies, configs: [], envVars: [], readmeText, folderPatterns: [] };
  }
  walk(resolvedRoot, 0);
  const workflowsDir = path3.join(resolvedRoot, ".github", "workflows");
  try {
    if (fs3.statSync(workflowsDir).isDirectory()) {
      configsSet.add(".github/workflows");
    }
  } catch {
  }
  return {
    files,
    dependencies,
    configs: Array.from(configsSet).sort(),
    envVars: Array.from(envVarsSet).sort(),
    readmeText,
    folderPatterns: Array.from(folderPatternsSet).sort()
  };
}

// cli/src/scanner/detectors.ts
function hasDep(signals, ...names) {
  for (const [depName] of signals.dependencies) {
    for (const name of names) {
      if (name.endsWith("*")) {
        const prefix = name.slice(0, -1);
        if (depName.startsWith(prefix)) {
          return { found: true, matchedDep: depName };
        }
      } else if (depName === name) {
        return { found: true, matchedDep: depName };
      }
    }
  }
  return { found: false, matchedDep: null };
}
function hasDepMatching(signals, pattern) {
  for (const [depName] of signals.dependencies) {
    if (pattern.test(depName)) {
      return { found: true, matchedDep: depName };
    }
  }
  return { found: false, matchedDep: null };
}
function hasConfig(signals, ...names) {
  for (const cfg of signals.configs) {
    for (const name of names) {
      if (name.endsWith("*")) {
        const prefix = name.slice(0, -1);
        if (cfg.startsWith(prefix)) {
          return { found: true, matchedConfig: cfg };
        }
      } else if (cfg === name) {
        return { found: true, matchedConfig: cfg };
      }
    }
  }
  return { found: false, matchedConfig: null };
}
function hasFilePath(signals, substring) {
  for (const f of signals.files) {
    if (f.includes(substring)) {
      return { found: true, matchedFile: f };
    }
  }
  return { found: false, matchedFile: null };
}
function hasFolderPattern(signals, pattern) {
  return signals.folderPatterns.some(
    (fp) => fp === pattern || fp.startsWith(pattern + "/")
  );
}
function countByExtension(signals, ...extensions) {
  const samples = [];
  let count = 0;
  const extSet = new Set(extensions.map((e) => `.${e}`));
  for (const f of signals.files) {
    const dotIdx = f.lastIndexOf(".");
    if (dotIdx >= 0) {
      const ext = f.slice(dotIdx);
      if (extSet.has(ext)) {
        count++;
        if (samples.length < 3) {
          samples.push(f);
        }
      }
    }
  }
  return { count, samples };
}
function detectLanguages(signals) {
  const items = [];
  const evidence = [];
  const languageRules = [
    {
      id: "typescript",
      label: "TypeScript",
      extensions: ["ts", "tsx"],
      weight: 0.95,
      extraCheck: () => hasConfig(signals, "tsconfig.json").found || hasDep(signals, "typescript").found
    },
    {
      id: "javascript",
      label: "JavaScript",
      extensions: ["js", "jsx"],
      weight: 0.9,
      extraCheck: () => hasConfig(signals, "package.json").found && !hasDep(signals, "typescript").found
    },
    {
      id: "python",
      label: "Python",
      extensions: ["py"],
      weight: 0.9,
      extraCheck: () => hasConfig(signals, "requirements.txt", "Pipfile", "pyproject.toml").found
    },
    {
      id: "rust",
      label: "Rust",
      extensions: ["rs"],
      weight: 0.9,
      extraCheck: () => hasConfig(signals, "Cargo.toml").found
    },
    {
      id: "go",
      label: "Go",
      extensions: ["go"],
      weight: 0.9,
      extraCheck: () => hasConfig(signals, "go.mod").found
    },
    {
      id: "ruby",
      label: "Ruby",
      extensions: ["rb"],
      weight: 0.85,
      extraCheck: () => hasConfig(signals, "Gemfile").found
    },
    {
      id: "java",
      label: "Java",
      extensions: ["java"],
      weight: 0.85,
      extraCheck: () => hasConfig(signals, "pom.xml", "build.gradle").found
    },
    {
      id: "kotlin",
      label: "Kotlin",
      extensions: ["kt"],
      weight: 0.8,
      extraCheck: () => hasConfig(signals, "build.gradle.kts").found
    },
    {
      id: "php",
      label: "PHP",
      extensions: ["php"],
      weight: 0.85,
      extraCheck: () => hasConfig(signals, "composer.json").found
    },
    {
      id: "swift",
      label: "Swift",
      extensions: ["swift"],
      weight: 0.8
    },
    {
      id: "dart",
      label: "Dart",
      extensions: ["dart"],
      weight: 0.85,
      extraCheck: () => hasConfig(signals, "pubspec.yaml").found
    },
    {
      id: "css",
      label: "CSS",
      extensions: ["css", "scss", "less"],
      weight: 0.6
    },
    {
      id: "html",
      label: "HTML",
      extensions: ["html"],
      weight: 0.5
    }
  ];
  for (const rule of languageRules) {
    const { count, samples } = countByExtension(signals, ...rule.extensions);
    const hasExtra = rule.extraCheck ? rule.extraCheck() : false;
    if (count > 0 || hasExtra) {
      const fileConfidence = count > 0 ? Math.min(1, count / 10) : 0;
      const confidence = count > 0 ? fileConfidence * rule.weight : hasExtra ? 0.5 * rule.weight : 0;
      items.push({
        id: rule.id,
        label: rule.label,
        confidence: Math.round(confidence * 100) / 100,
        source: samples
      });
      for (const sample of samples) {
        evidence.push({
          signal: `${rule.id} file detected`,
          file: sample,
          type: "file",
          weight: rule.weight
        });
      }
    }
  }
  return { items, evidence };
}
function detectFrameworks(signals) {
  const items = [];
  const evidence = [];
  const frameworkRules = [
    {
      id: "nextjs",
      label: "Next.js",
      weight: 0.95,
      depNames: ["next"],
      configNames: ["next.config.*"]
    },
    {
      id: "nuxt",
      label: "Nuxt",
      weight: 0.95,
      depNames: ["nuxt"],
      depPattern: /^@nuxt\/.*/,
      configNames: ["nuxt.config.*"]
    },
    { id: "react", label: "React", weight: 0.95, depNames: ["react"] },
    { id: "vue", label: "Vue.js", weight: 0.9, depNames: ["vue"] },
    {
      id: "angular",
      label: "Angular",
      weight: 0.9,
      depNames: ["@angular/core"]
    },
    {
      id: "svelte",
      label: "Svelte",
      weight: 0.9,
      depNames: ["svelte"],
      configNames: ["svelte.config.js"]
    },
    { id: "astro", label: "Astro", weight: 0.9, depNames: ["astro"] },
    {
      id: "remix",
      label: "Remix",
      weight: 0.9,
      depNames: ["@remix-run/*"]
    },
    { id: "express", label: "Express", weight: 0.9, depNames: ["express"] },
    { id: "fastapi", label: "FastAPI", weight: 0.9, depNames: ["fastapi"] },
    {
      id: "django",
      label: "Django",
      weight: 0.9,
      depNames: ["django", "Django"]
    },
    {
      id: "flask",
      label: "Flask",
      weight: 0.85,
      depNames: ["flask", "Flask"]
    },
    {
      id: "rails",
      label: "Rails",
      weight: 0.9,
      depNames: ["rails"],
      filePathCheck: "config/routes.rb"
    },
    {
      id: "spring",
      label: "Spring",
      weight: 0.9,
      depNames: ["spring-boot", "spring-web"]
    },
    {
      id: "tauri",
      label: "Tauri",
      weight: 0.9,
      depNames: ["@tauri-apps/api", "tauri"]
    },
    {
      id: "electron",
      label: "Electron",
      weight: 0.9,
      depNames: ["electron"]
    },
    {
      id: "react-native",
      label: "React Native",
      weight: 0.9,
      depNames: ["react-native"]
    },
    { id: "flutter", label: "Flutter", weight: 0.9, depNames: ["flutter"] },
    { id: "hono", label: "Hono", weight: 0.85, depNames: ["hono"] },
    {
      id: "nestjs",
      label: "NestJS",
      weight: 0.9,
      depNames: ["@nestjs/core"]
    },
    {
      id: "trpc",
      label: "tRPC",
      weight: 0.85,
      depNames: ["@trpc/server"]
    }
  ];
  for (const rule of frameworkRules) {
    let detected = false;
    const sources = [];
    if (rule.depNames) {
      const { found, matchedDep } = hasDep(signals, ...rule.depNames);
      if (found) {
        detected = true;
        sources.push(`dep:${matchedDep}`);
        evidence.push({
          signal: `${rule.label} dependency found`,
          file: matchedDep,
          type: "dependency",
          weight: rule.weight
        });
      }
    }
    if (rule.depPattern) {
      const { found, matchedDep } = hasDepMatching(signals, rule.depPattern);
      if (found) {
        detected = true;
        sources.push(`dep:${matchedDep}`);
        evidence.push({
          signal: `${rule.label} dependency pattern matched`,
          file: matchedDep,
          type: "dependency",
          weight: rule.weight
        });
      }
    }
    if (rule.configNames) {
      const { found, matchedConfig } = hasConfig(
        signals,
        ...rule.configNames
      );
      if (found) {
        detected = true;
        sources.push(`config:${matchedConfig}`);
        evidence.push({
          signal: `${rule.label} config found`,
          file: matchedConfig,
          type: "config",
          weight: rule.weight
        });
      }
    }
    if (rule.filePathCheck) {
      const { found, matchedFile } = hasFilePath(
        signals,
        rule.filePathCheck
      );
      if (found) {
        detected = true;
        sources.push(`file:${matchedFile}`);
        evidence.push({
          signal: `${rule.label} file pattern found`,
          file: matchedFile,
          type: "path",
          weight: rule.weight
        });
      }
    }
    if (detected) {
      items.push({
        id: rule.id,
        label: rule.label,
        confidence: rule.weight,
        source: sources
      });
    }
  }
  return { items, evidence };
}
function detectInfrastructure(signals) {
  const items = [];
  const evidence = [];
  function addItem(id, label, weight, source, evidenceType) {
    items.push({
      id,
      label,
      confidence: weight,
      source: [source]
    });
    evidence.push({
      signal: `${label} detected`,
      file: source,
      type: evidenceType,
      weight
    });
  }
  const configRules = [
    {
      id: "docker",
      label: "Docker",
      weight: 0.95,
      configs: ["Dockerfile"]
    },
    {
      id: "docker-compose",
      label: "Docker Compose",
      weight: 0.9,
      configs: ["docker-compose.yml", "docker-compose.yaml"]
    },
    {
      id: "gitlab-ci",
      label: "GitLab CI",
      weight: 0.85,
      configs: [".gitlab-ci.yml"]
    },
    {
      id: "jenkins",
      label: "Jenkins",
      weight: 0.8,
      configs: ["Jenkinsfile"]
    },
    {
      id: "vercel",
      label: "Vercel",
      weight: 0.85,
      configs: ["vercel.json"]
    },
    {
      id: "netlify",
      label: "Netlify",
      weight: 0.85,
      configs: ["netlify.toml"]
    },
    { id: "fly", label: "Fly.io", weight: 0.8, configs: ["fly.toml"] },
    {
      id: "railway",
      label: "Railway",
      weight: 0.8,
      configs: ["railway.json"]
    }
  ];
  for (const rule of configRules) {
    const { found, matchedConfig } = hasConfig(signals, ...rule.configs);
    if (found) {
      addItem(rule.id, rule.label, rule.weight, matchedConfig, "config");
    }
  }
  if (hasConfig(signals, "*.tf").found) {
    addItem("terraform", "Terraform", 0.95, "*.tf", "file");
  }
  if (hasFolderPattern(signals, "k8s") || hasFolderPattern(signals, "kubernetes")) {
    addItem("kubernetes", "Kubernetes", 0.9, "k8s/", "path");
  }
  {
    const { found, matchedFile } = hasFilePath(
      signals,
      ".github/workflows/"
    );
    if (found) {
      addItem(
        "github-actions",
        "GitHub Actions",
        0.9,
        matchedFile,
        "path"
      );
    }
  }
  if (hasFolderPattern(signals, ".circleci")) {
    addItem("circleci", "CircleCI", 0.85, ".circleci/", "path");
  }
  {
    const depCheck = hasDep(signals, "wrangler");
    const cfgCheck = hasConfig(signals, "wrangler.toml");
    if (depCheck.found) {
      addItem("cloudflare", "Cloudflare", 0.8, depCheck.matchedDep, "dependency");
    } else if (cfgCheck.found) {
      addItem("cloudflare", "Cloudflare", 0.8, cfgCheck.matchedConfig, "config");
    }
  }
  const cloudRules = [
    {
      id: "aws",
      label: "AWS",
      weight: 0.85,
      depNames: ["aws-sdk", "@aws-sdk/*", "boto3"]
    },
    {
      id: "gcp",
      label: "Google Cloud",
      weight: 0.8,
      depNames: ["@google-cloud/*", "google-cloud-*"]
    },
    {
      id: "azure",
      label: "Azure",
      weight: 0.8,
      depNames: ["@azure/*", "azure-*"]
    }
  ];
  for (const rule of cloudRules) {
    const { found, matchedDep } = hasDep(signals, ...rule.depNames);
    if (found) {
      addItem(rule.id, rule.label, rule.weight, matchedDep, "dependency");
    }
  }
  return { items, evidence };
}
function detectDataLayer(signals) {
  const items = [];
  const evidence = [];
  const dataRules = [
    {
      id: "postgresql",
      label: "PostgreSQL",
      weight: 0.9,
      depNames: ["pg", "postgres", "psycopg2", "asyncpg", "sqlx"]
    },
    {
      id: "mysql",
      label: "MySQL",
      weight: 0.9,
      depNames: ["mysql", "mysql2", "mysqlclient", "pymysql"]
    },
    {
      id: "mongodb",
      label: "MongoDB",
      weight: 0.9,
      depNames: ["mongodb", "mongoose", "pymongo", "motor"]
    },
    {
      id: "redis",
      label: "Redis",
      weight: 0.85,
      depNames: ["redis", "ioredis", "aioredis"]
    },
    {
      id: "sqlite",
      label: "SQLite",
      weight: 0.8,
      depNames: ["sqlite3", "better-sqlite3", "rusqlite"]
    },
    {
      id: "prisma",
      label: "Prisma",
      weight: 0.9,
      depNames: ["prisma", "@prisma/client"],
      folderCheck: "prisma"
    },
    {
      id: "drizzle",
      label: "Drizzle",
      weight: 0.85,
      depNames: ["drizzle-orm"]
    },
    {
      id: "typeorm",
      label: "TypeORM",
      weight: 0.85,
      depNames: ["typeorm"]
    },
    {
      id: "sequelize",
      label: "Sequelize",
      weight: 0.85,
      depNames: ["sequelize"]
    },
    {
      id: "supabase",
      label: "Supabase",
      weight: 0.9,
      depNames: ["@supabase/supabase-js"]
    },
    {
      id: "firebase",
      label: "Firebase",
      weight: 0.85,
      depNames: ["firebase", "firebase-admin", "@firebase/*"]
    },
    {
      id: "dynamodb",
      label: "DynamoDB",
      weight: 0.8,
      depNames: ["@aws-sdk/client-dynamodb"]
    },
    {
      id: "elasticsearch",
      label: "Elasticsearch",
      weight: 0.8,
      depNames: ["@elastic/elasticsearch", "elasticsearch-py"]
    },
    {
      id: "sqlalchemy",
      label: "SQLAlchemy",
      weight: 0.85,
      depNames: ["sqlalchemy", "SQLAlchemy"]
    }
  ];
  for (const rule of dataRules) {
    let detected = false;
    const sources = [];
    const { found, matchedDep } = hasDep(signals, ...rule.depNames);
    if (found) {
      detected = true;
      sources.push(`dep:${matchedDep}`);
      evidence.push({
        signal: `${rule.label} dependency found`,
        file: matchedDep,
        type: "dependency",
        weight: rule.weight
      });
    }
    if (rule.folderCheck && hasFolderPattern(signals, rule.folderCheck)) {
      detected = true;
      sources.push(`folder:${rule.folderCheck}`);
      evidence.push({
        signal: `${rule.label} folder found`,
        file: rule.folderCheck,
        type: "path",
        weight: rule.weight
      });
    }
    if (detected) {
      items.push({
        id: rule.id,
        label: rule.label,
        confidence: rule.weight,
        source: sources
      });
    }
  }
  return { items, evidence };
}
function detectIntegrations(signals) {
  const items = [];
  const evidence = [];
  const integrationRules = [
    {
      id: "stripe",
      label: "Stripe",
      weight: 0.9,
      depNames: ["stripe", "@stripe/*"]
    },
    {
      id: "auth0",
      label: "Auth0",
      weight: 0.85,
      depNames: ["auth0", "@auth0/*"]
    },
    { id: "clerk", label: "Clerk", weight: 0.85, depNames: ["@clerk/*"] },
    {
      id: "sendgrid",
      label: "SendGrid",
      weight: 0.8,
      depNames: ["@sendgrid/mail"]
    },
    { id: "twilio", label: "Twilio", weight: 0.8, depNames: ["twilio"] },
    { id: "resend", label: "Resend", weight: 0.8, depNames: ["resend"] },
    {
      id: "sentry",
      label: "Sentry",
      weight: 0.85,
      depNames: ["@sentry/*", "sentry-sdk"]
    },
    {
      id: "datadog",
      label: "Datadog",
      weight: 0.8,
      depNames: ["dd-trace", "datadog"]
    },
    {
      id: "segment",
      label: "Segment",
      weight: 0.8,
      depNames: ["analytics-node", "@segment/*"]
    },
    {
      id: "launchdarkly",
      label: "LaunchDarkly",
      weight: 0.8,
      depNames: ["launchdarkly-*", "@launchdarkly/*"]
    },
    {
      id: "algolia",
      label: "Algolia",
      weight: 0.8,
      depNames: ["algoliasearch"]
    },
    {
      id: "cloudflare-workers",
      label: "Cloudflare Workers",
      weight: 0.8,
      depNames: ["@cloudflare/workers-*", "wrangler"]
    },
    {
      id: "s3",
      label: "Amazon S3",
      weight: 0.8,
      depNames: ["@aws-sdk/client-s3", "boto3"]
    },
    {
      id: "graphql",
      label: "GraphQL",
      weight: 0.85,
      depNames: ["graphql", "@apollo/*", "type-graphql", "nexus"]
    }
  ];
  for (const rule of integrationRules) {
    const { found, matchedDep } = hasDep(signals, ...rule.depNames);
    if (found) {
      items.push({
        id: rule.id,
        label: rule.label,
        confidence: rule.weight,
        source: [`dep:${matchedDep}`]
      });
      evidence.push({
        signal: `${rule.label} dependency found`,
        file: matchedDep,
        type: "dependency",
        weight: rule.weight
      });
    }
  }
  return { items, evidence };
}
function detectAiStack(signals) {
  const items = [];
  const evidence = [];
  const aiRules = [
    { id: "openai", label: "OpenAI", weight: 0.95, depNames: ["openai"] },
    {
      id: "anthropic",
      label: "Anthropic",
      weight: 0.95,
      depNames: ["@anthropic-ai/sdk", "anthropic"]
    },
    {
      id: "langchain",
      label: "LangChain",
      weight: 0.9,
      depNames: ["langchain", "@langchain/*"]
    },
    {
      id: "llamaindex",
      label: "LlamaIndex",
      weight: 0.9,
      depNames: ["llama-index", "llamaindex"]
    },
    {
      id: "pinecone",
      label: "Pinecone",
      weight: 0.9,
      depNames: ["@pinecone-database/pinecone", "pinecone-client"]
    },
    {
      id: "chromadb",
      label: "ChromaDB",
      weight: 0.85,
      depNames: ["chromadb"]
    },
    {
      id: "weaviate",
      label: "Weaviate",
      weight: 0.85,
      depNames: ["weaviate-client", "weaviate-ts-client"]
    },
    {
      id: "huggingface",
      label: "Hugging Face",
      weight: 0.85,
      depNames: ["@huggingface/*", "transformers"]
    },
    {
      id: "vercel-ai",
      label: "Vercel AI SDK",
      weight: 0.85,
      depNames: ["ai"],
      requiresAlsoDep: "next"
    },
    {
      id: "replicate",
      label: "Replicate",
      weight: 0.8,
      depNames: ["replicate"]
    },
    {
      id: "cohere",
      label: "Cohere",
      weight: 0.8,
      depNames: ["cohere-ai", "cohere"]
    },
    {
      id: "onnx",
      label: "ONNX Runtime",
      weight: 0.8,
      depNames: ["onnxruntime-*", "@onnxruntime/*"]
    },
    {
      id: "tensorflow",
      label: "TensorFlow",
      weight: 0.85,
      depNames: ["tensorflow", "@tensorflow/*"]
    },
    {
      id: "pytorch",
      label: "PyTorch",
      weight: 0.85,
      depNames: ["torch", "pytorch"]
    }
  ];
  for (const rule of aiRules) {
    if (rule.requiresAlsoDep && !hasDep(signals, rule.requiresAlsoDep).found) {
      continue;
    }
    const { found, matchedDep } = hasDep(signals, ...rule.depNames);
    if (found) {
      items.push({
        id: rule.id,
        label: rule.label,
        confidence: rule.weight,
        source: [`dep:${matchedDep}`]
      });
      evidence.push({
        signal: `${rule.label} dependency found`,
        file: matchedDep,
        type: "dependency",
        weight: rule.weight
      });
    }
  }
  return { items, evidence };
}
function detectWorkflowSignals(signals) {
  const items = [];
  const evidence = [];
  function addItem(id, label, weight, source, evidenceType) {
    items.push({
      id,
      label,
      confidence: weight,
      source: [source]
    });
    evidence.push({
      signal: `${label} detected`,
      file: source,
      type: evidenceType,
      weight
    });
  }
  {
    const cfgCheck = hasConfig(signals, "jest.config.*", "vitest.config.*");
    const folderCheck = hasFolderPattern(signals, "test") || hasFolderPattern(signals, "tests");
    if (cfgCheck.found) {
      addItem("testing", "Testing", 0.85, cfgCheck.matchedConfig, "config");
    } else if (folderCheck) {
      addItem("testing", "Testing", 0.85, "test/", "path");
    }
  }
  {
    const cfgCheck = hasConfig(
      signals,
      "playwright.config.*",
      "cypress.config.*"
    );
    const folderCheck = hasFolderPattern(signals, "e2e") || hasFolderPattern(signals, "cypress") || hasFolderPattern(signals, "playwright");
    if (cfgCheck.found) {
      addItem(
        "e2e-testing",
        "E2E Testing",
        0.8,
        cfgCheck.matchedConfig,
        "config"
      );
    } else if (folderCheck) {
      addItem("e2e-testing", "E2E Testing", 0.8, "e2e/", "path");
    }
  }
  {
    const folderCheck = hasFolderPattern(signals, ".storybook");
    const depCheck = hasDep(signals, "@storybook/*");
    if (folderCheck) {
      addItem("storybook", "Storybook", 0.85, ".storybook/", "path");
    } else if (depCheck.found) {
      addItem(
        "storybook",
        "Storybook",
        0.85,
        depCheck.matchedDep,
        "dependency"
      );
    }
  }
  {
    const cfgCheck = hasConfig(
      signals,
      ".eslintrc.*",
      "eslint.config.*",
      "biome.json"
    );
    if (cfgCheck.found) {
      addItem("linting", "Linting", 0.7, cfgCheck.matchedConfig, "config");
    }
  }
  {
    const cfgCheck = hasConfig(signals, ".prettierrc*", "biome.json");
    if (cfgCheck.found) {
      addItem(
        "formatting",
        "Formatting",
        0.6,
        cfgCheck.matchedConfig,
        "config"
      );
    }
  }
  {
    const cfgCheck = hasConfig(
      signals,
      "lerna.json",
      "nx.json",
      "turbo.json",
      "pnpm-workspace.yaml",
      "rush.json"
    );
    if (cfgCheck.found) {
      addItem(
        "monorepo",
        "Monorepo",
        0.9,
        cfgCheck.matchedConfig,
        "config"
      );
    }
  }
  {
    const cfgCheck = hasConfig(signals, "openapi.*", "swagger.*");
    if (cfgCheck.found) {
      addItem(
        "api-docs",
        "API Documentation",
        0.8,
        cfgCheck.matchedConfig,
        "config"
      );
    }
  }
  if (hasFolderPattern(signals, ".devcontainer")) {
    addItem(
      "dev-containers",
      "Dev Containers",
      0.7,
      ".devcontainer/",
      "path"
    );
  }
  {
    const folderCheck = hasFolderPattern(signals, ".husky");
    const depCheck = hasDep(signals, "husky");
    if (folderCheck) {
      addItem("pre-commit", "Pre-commit Hooks", 0.7, ".husky/", "path");
    } else if (depCheck.found) {
      addItem(
        "pre-commit",
        "Pre-commit Hooks",
        0.7,
        depCheck.matchedDep,
        "dependency"
      );
    }
  }
  {
    const cfgCheck = hasConfig(signals, "renovate.json");
    const fileCheck = hasFilePath(signals, ".github/dependabot.yml");
    if (cfgCheck.found) {
      addItem(
        "dep-management",
        "Dependency Management",
        0.7,
        cfgCheck.matchedConfig,
        "config"
      );
    } else if (fileCheck.found) {
      addItem(
        "dep-management",
        "Dependency Management",
        0.7,
        fileCheck.matchedFile,
        "file"
      );
    }
  }
  return { items, evidence };
}

// cli/src/scanner/classifiers.ts
var FRONTEND_FRAMEWORKS = /* @__PURE__ */ new Set([
  "react",
  "vue",
  "angular",
  "svelte",
  "nextjs",
  "nuxt"
]);
var BACKEND_FRAMEWORKS = /* @__PURE__ */ new Set([
  "express",
  "fastapi",
  "django",
  "flask",
  "rails",
  "nestjs",
  "spring"
]);
function hasSignal(signals, id) {
  return signals.some((s) => s.id === id);
}
function hasAnySignal(signals, ids) {
  return signals.some((s) => ids.has(s.id));
}
function matchesPath(files, pattern) {
  return files.some((f) => f.includes(pattern));
}
function classifyProjectType(languages, frameworks, infrastructure, workflowSignals, files) {
  const items = [];
  const evidence = [];
  const hasFrontend = hasAnySignal(frameworks, FRONTEND_FRAMEWORKS);
  const hasBackend = hasAnySignal(frameworks, BACKEND_FRAMEWORKS);
  if (hasFrontend && hasBackend) {
    items.push({ id: "fullstack", label: "Full Stack", confidence: 0.9, source: [] });
    evidence.push({ signal: "fullstack", file: "frontend+backend", type: "config", weight: 0.9 });
  }
  if (hasFrontend && !hasBackend) {
    items.push({ id: "web-app", label: "Web App", confidence: 0.85, source: [] });
    evidence.push({ signal: "web-app", file: "frontend-only", type: "config", weight: 0.85 });
  }
  if (hasBackend && !hasFrontend) {
    items.push({ id: "api", label: "API", confidence: 0.85, source: [] });
    evidence.push({ signal: "api", file: "backend-only", type: "config", weight: 0.85 });
  }
  if (hasSignal(frameworks, "react-native") || hasSignal(frameworks, "flutter")) {
    items.push({ id: "mobile-app", label: "Mobile App", confidence: 0.9, source: [] });
    evidence.push({ signal: "mobile-app", file: "mobile-framework", type: "config", weight: 0.9 });
  }
  if (hasSignal(frameworks, "tauri") || hasSignal(frameworks, "electron")) {
    items.push({ id: "desktop-app", label: "Desktop App", confidence: 0.9, source: [] });
    evidence.push({ signal: "desktop-app", file: "desktop-framework", type: "config", weight: 0.9 });
  }
  if (hasSignal(workflowSignals, "monorepo")) {
    items.push({ id: "monorepo", label: "Monorepo", confidence: 0.95, source: [] });
    evidence.push({ signal: "monorepo", file: "monorepo-signal", type: "config", weight: 0.95 });
  }
  const hasMLFramework = hasSignal(frameworks, "tensorflow") || hasSignal(frameworks, "pytorch");
  const hasPythonJupyter = hasSignal(languages, "python") && files.some((f) => f.endsWith(".ipynb"));
  if (hasMLFramework || hasPythonJupyter) {
    items.push({ id: "ml-project", label: "ML Project", confidence: 0.85, source: [] });
    evidence.push({ signal: "ml-project", file: "ml-signals", type: "config", weight: 0.85 });
  }
  if (hasSignal(infrastructure, "terraform") || hasSignal(infrastructure, "kubernetes")) {
    items.push({ id: "infrastructure", label: "Infrastructure", confidence: 0.85, source: [] });
    evidence.push({ signal: "infrastructure", file: "iac-tool", type: "config", weight: 0.85 });
  }
  const hasCliPaths = matchesPath(files, "bin/") || matchesPath(files, "src/cli") || matchesPath(files, "src/main");
  if (hasCliPaths && !hasFrontend && !hasBackend) {
    items.push({ id: "cli", label: "CLI", confidence: 0.7, source: [] });
    evidence.push({ signal: "cli", file: "cli-paths", type: "path", weight: 0.7 });
  }
  const hasLibPaths = matchesPath(files, "lib/") || matchesPath(files, "src/lib");
  if (hasLibPaths && !hasFrontend && !hasBackend && !items.some((i) => i.id === "api")) {
    items.push({ id: "library", label: "Library", confidence: 0.7, source: [] });
    evidence.push({ signal: "library", file: "lib-paths", type: "path", weight: 0.7 });
  }
  if (items.length === 0) {
    items.push({ id: "unknown", label: "Unknown", confidence: 0.3, source: [] });
    evidence.push({ signal: "unknown", file: "no-match", type: "config", weight: 0.3 });
  }
  return { items, evidence };
}
var DOMAIN_RULES = [
  { id: "ecommerce", label: "Ecommerce", keywords: ["cart", "checkout", "product", "shop"], confidence: 0.8, requiresIntegration: "stripe" },
  { id: "saas", label: "SaaS", keywords: ["subscription", "tenant", "billing"], confidence: 0.75, requiresAuth: true, requiresDatabase: true },
  { id: "fintech", label: "Fintech", keywords: ["payment", "transaction", "banking", "finance"], confidence: 0.7, requiresIntegration: "stripe" },
  { id: "healthcare", label: "Healthcare", keywords: ["patient", "health", "medical", "clinical"], confidence: 0.7 },
  { id: "education", label: "Education", keywords: ["course", "student", "learn", "education"], confidence: 0.7 },
  { id: "social", label: "Social", keywords: ["feed", "post", "follow", "social", "chat"], confidence: 0.7 },
  { id: "marketplace", label: "Marketplace", keywords: ["listing", "marketplace", "seller", "buyer"], confidence: 0.7 },
  { id: "devtool", label: "Developer Tool", keywords: ["developer", "sdk", "api", "cli", "plugin"], confidence: 0.7 },
  { id: "content", label: "Content/CMS", keywords: ["content", "cms", "blog", "article", "editor"], confidence: 0.7 },
  { id: "analytics", label: "Analytics", keywords: ["analytics", "dashboard", "metrics", "tracking"], confidence: 0.7 }
];
var AUTH_PROVIDERS = /* @__PURE__ */ new Set(["auth0", "clerk"]);
function wordBoundaryMatch(text, word) {
  const pattern = new RegExp(`\\b${word}\\b`, "i");
  return pattern.test(text);
}
function classifyDomain(frameworks, dataLayer, integrations, aiStack, readmeText) {
  const items = [];
  const evidence = [];
  const hasAuth = integrations.some((i) => AUTH_PROVIDERS.has(i.id));
  const hasDatabase = dataLayer.length > 0;
  for (const rule of DOMAIN_RULES) {
    if (rule.requiresIntegration && !hasSignal(integrations, rule.requiresIntegration)) continue;
    if (rule.requiresAuth && !hasAuth) continue;
    if (rule.requiresDatabase && !hasDatabase) continue;
    const matchedKeywords = rule.keywords.filter((kw) => wordBoundaryMatch(readmeText, kw));
    if (matchedKeywords.length === 0) continue;
    items.push({ id: rule.id, label: rule.label, confidence: rule.confidence, source: [] });
    evidence.push({
      signal: rule.id,
      file: `readme-keywords: ${matchedKeywords.join(", ")}`,
      type: "readme",
      weight: rule.confidence
    });
  }
  return { items, evidence };
}

// cli/src/scanner/scoring.ts
function sortAndFilter(items, minConfidence = 0.3) {
  return items.filter((item) => item.confidence >= minConfidence).sort((a, b) => b.confidence - a.confidence);
}

// cli/src/scanner/index.ts
function scanProject(rootPath, maxDepth = 5) {
  const start = Date.now();
  const signals = collectSignals(rootPath, maxDepth);
  const allEvidence = [];
  const lang = detectLanguages(signals);
  const fw = detectFrameworks(signals);
  const infra = detectInfrastructure(signals);
  const data = detectDataLayer(signals);
  const integ = detectIntegrations(signals);
  const ai = detectAiStack(signals);
  const workflow = detectWorkflowSignals(signals);
  allEvidence.push(...lang.evidence, ...fw.evidence, ...infra.evidence, ...data.evidence, ...integ.evidence, ...ai.evidence, ...workflow.evidence);
  const projType = classifyProjectType(lang.items, fw.items, infra.items, workflow.items, signals.files);
  const domain = classifyDomain(fw.items, data.items, integ.items, ai.items, signals.readmeText);
  allEvidence.push(...projType.evidence, ...domain.evidence);
  return {
    projectTypes: sortAndFilter(projType.items),
    languages: sortAndFilter(lang.items),
    frameworks: sortAndFilter(fw.items),
    infrastructure: sortAndFilter(infra.items),
    dataLayer: sortAndFilter(data.items),
    integrations: sortAndFilter(integ.items),
    aiStack: sortAndFilter(ai.items),
    workflowSignals: sortAndFilter(workflow.items),
    domainSignals: sortAndFilter(domain.items),
    evidence: allEvidence,
    scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
    scanDurationMs: Date.now() - start,
    rootPath,
    fileCount: signals.files.length
  };
}

// cli/src/commands/scan.ts
async function scanCommand(targetPath) {
  const rootPath = path4.resolve(targetPath || ".");
  console.log(`
  Scanning: ${rootPath}
`);
  const profile = scanProject(rootPath);
  console.log(`  Scan completed in ${profile.scanDurationMs}ms`);
  console.log(`  Files analyzed: ${profile.fileCount}
`);
  const sections = [
    ["Languages", profile.languages],
    ["Frameworks", profile.frameworks],
    ["Infrastructure", profile.infrastructure],
    ["Data Layer", profile.dataLayer],
    ["Integrations", profile.integrations],
    ["AI Stack", profile.aiStack],
    ["Workflow", profile.workflowSignals],
    ["Project Type", profile.projectTypes],
    ["Domain", profile.domainSignals]
  ];
  for (const [title, items] of sections) {
    if (items.length === 0) continue;
    console.log(`  ${title}:`);
    for (const item of items) {
      const conf = Math.round(item.confidence * 100);
      const bar = "\u2588".repeat(Math.round(conf / 5)) + "\u2591".repeat(20 - Math.round(conf / 5));
      console.log(`    ${item.label.padEnd(22)} ${bar} ${conf}%`);
    }
    console.log("");
  }
  const outputPath = path4.join(rootPath, ".agenttoolkit-profile.json");
  const fs7 = await import("node:fs");
  fs7.writeFileSync(outputPath, JSON.stringify(profile, null, 2));
  console.log(`  Profile saved to: ${outputPath}
`);
}

// cli/src/commands/recommend.ts
import * as path6 from "node:path";
import * as fs5 from "node:fs";
import * as readline from "node:readline";

// cli/src/commands/install.ts
import * as fs4 from "node:fs";
import * as path5 from "node:path";
async function installAgentByEntry(entry) {
  const content = await fetchAgentContent(DEFAULT_CATALOG_URL, entry.file);
  const agentsDir = getAgentsDir();
  ensureDir(agentsDir);
  const filename = path5.basename(entry.file);
  const destPath = path5.join(agentsDir, filename);
  fs4.writeFileSync(destPath, content);
  const appDir = getAppDataDir();
  const registryPath = path5.join(appDir, "install-registry.json");
  let registry = { version: "1.0.0", records: [] };
  try {
    if (fs4.existsSync(registryPath)) {
      registry = JSON.parse(fs4.readFileSync(registryPath, "utf-8"));
    }
  } catch {
  }
  registry.records = registry.records.filter((r) => r.agentId !== entry.id);
  let version = "unknown";
  const versionMatch = content.match(/^version:\s*["']?(.+?)["']?\s*$/m);
  if (versionMatch) version = versionMatch[1];
  registry.records.push({
    agentId: entry.id,
    version,
    sourceId: "official",
    installedAt: (/* @__PURE__ */ new Date()).toISOString(),
    filePath: destPath,
    originalFile: entry.file
  });
  fs4.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}
async function installCommand(agentId) {
  if (!agentId) {
    console.error("\n  Usage: agenttoolkitai install <agent-id>\n");
    process.exit(1);
  }
  console.log(`
  Installing agent: ${agentId}
`);
  let manifest;
  try {
    manifest = await fetchManifest();
  } catch (err) {
    console.error(`  Failed to fetch catalog: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
  const entry = manifest.agents.find((a) => a.id === agentId);
  if (!entry) {
    console.error(`  Agent "${agentId}" not found in catalog.`);
    console.error(`  Available agents: ${manifest.agents.length}`);
    console.error(`  Try: agenttoolkitai recommend
`);
    process.exit(1);
  }
  try {
    await installAgentByEntry(entry);
  } catch (err) {
    console.error(`  Failed to install agent: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
  console.log(`  \u2713 Installed: ${entry.name}`);
  console.log(`  \u2713 Category: ${entry.category || "general"}
`);
}

// src/features/scan/recommendation/engine.ts
var RECOMMENDATION_RULES = [
  // Languages
  {
    signalId: "typescript",
    signalCategory: "languages",
    agentIds: ["typescript-expert"],
    agentCategories: ["engineering"],
    weight: 0.9,
    reason: "TypeScript detected in your project"
  },
  {
    signalId: "python",
    signalCategory: "languages",
    agentIds: ["python-data-scientist"],
    agentCategories: ["data"],
    weight: 0.8,
    reason: "Python detected in your project"
  },
  {
    signalId: "rust",
    signalCategory: "languages",
    agentCategories: ["engineering"],
    weight: 0.7,
    reason: "Rust detected in your project"
  },
  // Frameworks
  {
    signalId: "react",
    signalCategory: "frameworks",
    agentIds: [
      "react-specialist",
      "ui-component-builder",
      "state-management-advisor",
      "frontend-testing-engineer"
    ],
    weight: 0.95,
    reason: "React framework detected"
  },
  {
    signalId: "nextjs",
    signalCategory: "frameworks",
    agentIds: ["nextjs-developer", "web-performance-analyst", "seo-strategist"],
    weight: 0.95,
    reason: "Next.js framework detected"
  },
  {
    signalId: "express",
    signalCategory: "frameworks",
    agentIds: ["backend-architect", "api-designer"],
    weight: 0.9,
    reason: "Express.js backend detected"
  },
  {
    signalId: "fastapi",
    signalCategory: "frameworks",
    agentIds: ["backend-architect", "api-designer"],
    weight: 0.9,
    reason: "FastAPI backend detected"
  },
  {
    signalId: "django",
    signalCategory: "frameworks",
    agentIds: ["backend-architect"],
    weight: 0.9,
    reason: "Django framework detected"
  },
  {
    signalId: "vue",
    signalCategory: "frameworks",
    agentIds: ["css-architect", "ui-component-builder"],
    weight: 0.85,
    reason: "Vue.js framework detected"
  },
  {
    signalId: "nestjs",
    signalCategory: "frameworks",
    agentIds: ["backend-architect", "api-designer", "microservices-designer"],
    weight: 0.9,
    reason: "NestJS framework detected"
  },
  // Infrastructure
  {
    signalId: "docker",
    signalCategory: "infrastructure",
    agentIds: ["docker-specialist", "platform-engineer"],
    weight: 0.9,
    reason: "Docker usage detected"
  },
  {
    signalId: "kubernetes",
    signalCategory: "infrastructure",
    agentIds: ["kubernetes-engineer", "platform-engineer", "monitoring-engineer"],
    weight: 0.95,
    reason: "Kubernetes infrastructure detected"
  },
  {
    signalId: "terraform",
    signalCategory: "infrastructure",
    agentIds: ["terraform-engineer", "cloud-cost-optimizer"],
    weight: 0.95,
    reason: "Terraform IaC detected"
  },
  {
    signalId: "aws",
    signalCategory: "infrastructure",
    agentIds: [
      "aws-solutions-architect",
      "cloud-cost-optimizer",
      "cloud-security-engineer"
    ],
    weight: 0.9,
    reason: "AWS services detected"
  },
  {
    signalId: "github-actions",
    signalCategory: "infrastructure",
    agentIds: ["ci-cd-architect", "release-manager"],
    weight: 0.85,
    reason: "GitHub Actions CI/CD detected"
  },
  {
    signalId: "vercel",
    signalCategory: "infrastructure",
    agentIds: ["web-performance-analyst"],
    weight: 0.8,
    reason: "Vercel deployment detected"
  },
  // Data layer
  {
    signalId: "postgresql",
    signalCategory: "dataLayer",
    agentIds: ["database-engineer", "sql-expert", "data-modeling-specialist"],
    weight: 0.9,
    reason: "PostgreSQL database detected"
  },
  {
    signalId: "mongodb",
    signalCategory: "dataLayer",
    agentIds: ["database-engineer", "data-modeling-specialist"],
    weight: 0.9,
    reason: "MongoDB database detected"
  },
  {
    signalId: "redis",
    signalCategory: "dataLayer",
    agentIds: ["database-engineer", "performance-optimizer"],
    weight: 0.8,
    reason: "Redis cache detected"
  },
  {
    signalId: "prisma",
    signalCategory: "dataLayer",
    agentIds: ["database-engineer", "data-modeling-specialist"],
    weight: 0.85,
    reason: "Prisma ORM detected"
  },
  {
    signalId: "supabase",
    signalCategory: "dataLayer",
    agentIds: ["database-engineer", "auth-architect"],
    weight: 0.85,
    reason: "Supabase detected"
  },
  {
    signalId: "firebase",
    signalCategory: "dataLayer",
    agentIds: ["database-engineer"],
    weight: 0.8,
    reason: "Firebase detected"
  },
  // AI stack
  {
    signalId: "openai",
    signalCategory: "aiStack",
    agentIds: [
      "llm-application-architect",
      "prompt-engineer",
      "ai-cost-optimizer",
      "evaluation-specialist"
    ],
    weight: 0.95,
    reason: "OpenAI integration detected"
  },
  {
    signalId: "anthropic",
    signalCategory: "aiStack",
    agentIds: [
      "llm-application-architect",
      "prompt-engineer",
      "ai-safety-reviewer",
      "ai-cost-optimizer"
    ],
    weight: 0.95,
    reason: "Anthropic/Claude integration detected"
  },
  {
    signalId: "langchain",
    signalCategory: "aiStack",
    agentIds: [
      "llm-application-architect",
      "ai-agent-builder",
      "knowledge-base-architect"
    ],
    weight: 0.9,
    reason: "LangChain framework detected"
  },
  {
    signalId: "pinecone",
    signalCategory: "aiStack",
    agentIds: ["embedding-specialist", "knowledge-base-architect"],
    weight: 0.9,
    reason: "Pinecone vector DB detected"
  },
  {
    signalId: "chromadb",
    signalCategory: "aiStack",
    agentIds: ["embedding-specialist", "knowledge-base-architect"],
    weight: 0.85,
    reason: "ChromaDB vector DB detected"
  },
  // Integrations
  {
    signalId: "stripe",
    signalCategory: "integrations",
    agentIds: ["backend-architect", "api-designer"],
    weight: 0.85,
    reason: "Stripe payment integration detected"
  },
  {
    signalId: "auth0",
    signalCategory: "integrations",
    agentIds: ["auth-architect", "api-security-specialist"],
    weight: 0.9,
    reason: "Auth0 authentication detected"
  },
  {
    signalId: "clerk",
    signalCategory: "integrations",
    agentIds: ["auth-architect"],
    weight: 0.85,
    reason: "Clerk authentication detected"
  },
  {
    signalId: "sentry",
    signalCategory: "integrations",
    agentIds: ["monitoring-engineer", "incident-response-coordinator"],
    weight: 0.8,
    reason: "Sentry error tracking detected"
  },
  {
    signalId: "graphql",
    signalCategory: "integrations",
    agentIds: ["api-designer", "backend-architect"],
    weight: 0.85,
    reason: "GraphQL API detected"
  },
  // Workflow signals
  {
    signalId: "testing",
    signalCategory: "workflowSignals",
    agentIds: ["testing-strategist", "frontend-testing-engineer"],
    weight: 0.85,
    reason: "Test infrastructure detected"
  },
  {
    signalId: "e2e-testing",
    signalCategory: "workflowSignals",
    agentIds: ["testing-strategist", "frontend-testing-engineer"],
    weight: 0.8,
    reason: "E2E testing detected"
  },
  {
    signalId: "monorepo",
    signalCategory: "workflowSignals",
    agentIds: ["monorepo-architect", "ci-cd-architect"],
    weight: 0.9,
    reason: "Monorepo structure detected"
  },
  {
    signalId: "storybook",
    signalCategory: "workflowSignals",
    agentIds: ["design-system-architect", "ui-component-builder"],
    weight: 0.85,
    reason: "Storybook detected"
  },
  // Domain signals
  {
    signalId: "ecommerce",
    signalCategory: "domainSignals",
    agentIds: ["product-manager", "conversion-rate-optimizer", "seo-strategist"],
    weight: 0.85,
    reason: "Ecommerce domain detected"
  },
  {
    signalId: "saas",
    signalCategory: "domainSignals",
    agentIds: [
      "product-manager",
      "pricing-strategist",
      "onboarding-designer",
      "growth-product-manager"
    ],
    weight: 0.9,
    reason: "SaaS domain detected"
  },
  // Universal
  {
    signalId: "any-code",
    signalCategory: "projectTypes",
    agentIds: [
      "code-reviewer",
      "debugging-specialist",
      "documentation-writer",
      "git-workflow-advisor"
    ],
    weight: 0.5,
    reason: "Core engineering best practices"
  },
  // Security
  {
    signalId: "web-app",
    signalCategory: "projectTypes",
    agentIds: ["security-auditor", "auth-architect"],
    weight: 0.7,
    reason: "Web application security"
  },
  {
    signalId: "api",
    signalCategory: "projectTypes",
    agentIds: ["api-security-specialist", "api-designer"],
    weight: 0.75,
    reason: "API security and design"
  }
];
function getSignalsFromProfile(profile, category) {
  return profile[category] ?? [];
}
function findSignal(profile, rule) {
  const items = getSignalsFromProfile(profile, rule.signalCategory);
  return items.find((item) => item.id === rule.signalId);
}
function generateRecommendations(profile, manifest, packs) {
  const agentById = new Map(manifest.agents.map((a) => [a.id, a]));
  const accumulator = /* @__PURE__ */ new Map();
  function ensureAgent(id) {
    if (!accumulator.has(id)) {
      accumulator.set(id, { scores: [], reasons: [], signals: [] });
    }
    return accumulator.get(id);
  }
  const hasAnyCode = profile.languages.length > 0 || profile.frameworks.length > 0;
  for (const rule of RECOMMENDATION_RULES) {
    let matchedSignal;
    if (rule.signalId === "any-code") {
      if (!hasAnyCode) continue;
      matchedSignal = { id: "any-code", label: "Code Project", confidence: 1, source: [] };
    } else {
      matchedSignal = findSignal(profile, rule);
      if (!matchedSignal) continue;
    }
    const score = rule.weight * matchedSignal.confidence;
    if (rule.agentIds) {
      for (const agentId of rule.agentIds) {
        const acc = ensureAgent(agentId);
        acc.scores.push(score);
        if (!acc.reasons.includes(rule.reason)) acc.reasons.push(rule.reason);
        if (!acc.signals.includes(rule.signalId)) acc.signals.push(rule.signalId);
      }
    }
    if (rule.agentCategories) {
      for (const cat of rule.agentCategories) {
        const categoryAgents = manifest.agents.filter((a) => a.category === cat);
        for (const agent of categoryAgents) {
          const acc = ensureAgent(agent.id);
          acc.scores.push(score);
          if (!acc.reasons.includes(rule.reason)) acc.reasons.push(rule.reason);
          if (!acc.signals.includes(rule.signalId)) acc.signals.push(rule.signalId);
        }
      }
    }
  }
  const agentRecs = [];
  for (const [agentId, acc] of accumulator.entries()) {
    if (acc.scores.length === 0) continue;
    const maxScore = Math.max(...acc.scores);
    const bonusMatches = acc.scores.length - 1;
    const finalScore = Math.min(0.98, maxScore + 0.1 * bonusMatches);
    const entry = agentById.get(agentId);
    if (!entry) continue;
    agentRecs.push({
      agentId,
      agentName: entry.name,
      category: entry.category ?? "general",
      relevanceScore: Math.round(finalScore * 100) / 100,
      reasons: acc.reasons,
      matchedSignals: acc.signals
    });
  }
  agentRecs.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return a.agentId.localeCompare(b.agentId);
  });
  const topAgents = agentRecs.slice(0, 20);
  const agentScoreMap = new Map(topAgents.map((a) => [a.agentId, a.relevanceScore]));
  const packRecs = [];
  for (const pack of packs) {
    const matched = pack.agents.filter((id) => agentScoreMap.has(id));
    const coverage = matched.length / pack.agents.length;
    if (coverage < 0.3) continue;
    const avgRelevance = matched.reduce((sum, id) => sum + (agentScoreMap.get(id) ?? 0), 0) / matched.length;
    const relevanceScore = Math.round(avgRelevance * coverage * 100) / 100;
    const reasons = [];
    for (const agentId of matched) {
      const rec = topAgents.find((a) => a.agentId === agentId);
      if (rec) {
        for (const r of rec.reasons) {
          if (!reasons.includes(r)) reasons.push(r);
        }
      }
    }
    packRecs.push({
      packId: pack.id,
      packName: pack.name,
      relevanceScore,
      coverage: Math.round(coverage * 100) / 100,
      reasons: reasons.slice(0, 3),
      matchedAgents: matched
    });
  }
  packRecs.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return a.packId.localeCompare(b.packId);
  });
  const gaps = [];
  const recommendedIds = new Set(topAgents.map((a) => a.agentId));
  const securityAgents = ["security-auditor", "auth-architect", "api-security-specialist", "cloud-security-engineer"];
  const hasSecuritySignal = profile.integrations.some((i) => ["auth0", "clerk"].includes(i.id)) || profile.infrastructure.some((i) => ["aws", "kubernetes"].includes(i.id)) || profile.projectTypes.some((p) => ["web-app", "api"].includes(p.id));
  const hasSecurityAgent = securityAgents.some((id) => recommendedIds.has(id));
  if (hasSecuritySignal && !hasSecurityAgent) {
    gaps.push({
      category: "Security",
      gap: "Your project has authentication, cloud, or API surface area but no security agent is recommended. Consider adding security-focused agents.",
      severity: "high",
      suggestedAgents: ["security-auditor", "auth-architect", "api-security-specialist"]
    });
  }
  const testingAgents = ["testing-strategist", "frontend-testing-engineer"];
  const hasTestingSignal = profile.workflowSignals.some(
    (w) => ["testing", "e2e-testing"].includes(w.id)
  );
  const hasTestingAgent = testingAgents.some((id) => recommendedIds.has(id));
  if (hasTestingSignal && !hasTestingAgent) {
    gaps.push({
      category: "Testing",
      gap: "Test infrastructure was detected but no testing agent is in the recommendations. Strengthen test coverage with dedicated agents.",
      severity: "medium",
      suggestedAgents: testingAgents
    });
  }
  const devopsAgents = ["docker-specialist", "kubernetes-engineer", "ci-cd-architect", "terraform-engineer", "platform-engineer"];
  const hasInfraSignal = profile.infrastructure.length > 0;
  const hasDevopsAgent = devopsAgents.some((id) => recommendedIds.has(id));
  if (hasInfraSignal && !hasDevopsAgent) {
    gaps.push({
      category: "DevOps",
      gap: "Infrastructure tooling detected but no DevOps agent recommended. Consider adding agents to manage your deployment pipeline.",
      severity: "medium",
      suggestedAgents: ["docker-specialist", "ci-cd-architect", "platform-engineer"]
    });
  }
  const dataAgents = ["database-engineer", "sql-expert", "data-modeling-specialist"];
  const hasDataSignal = profile.dataLayer.length > 0;
  const hasDataAgent = dataAgents.some((id) => recommendedIds.has(id));
  if (hasDataSignal && !hasDataAgent) {
    gaps.push({
      category: "Data",
      gap: "A data layer (database, cache, ORM) was detected but no data engineering agent is recommended. Add database agents to improve data quality.",
      severity: "low",
      suggestedAgents: dataAgents
    });
  }
  return { agents: topAgents, packs: packRecs, gaps };
}

// cli/src/commands/recommend.ts
async function recommendCommand(targetPath) {
  const rootPath = path6.resolve(targetPath || ".");
  console.log(`
  Scanning: ${rootPath}
`);
  const profile = scanProject(rootPath);
  console.log(`  Scan completed in ${profile.scanDurationMs}ms
`);
  console.log("  Fetching catalog...");
  let manifest, packs;
  try {
    [manifest, packs] = await Promise.all([fetchManifest(), fetchPacks()]);
    console.log(`  Catalog loaded: ${manifest.agents.length} agents, ${packs.length} packs
`);
  } catch (err) {
    console.error(`  Failed to fetch catalog: ${err instanceof Error ? err.message : err}`);
    console.error("  Run 'agenttoolkitai doctor' to check connectivity.\n");
    process.exit(1);
  }
  const result = generateRecommendations(profile, manifest, packs);
  if (result.agents.length > 0) {
    console.log("  Recommended Agents:");
    console.log("  " + "\u2500".repeat(60));
    for (const agent of result.agents.slice(0, 15)) {
      const score = Math.round(agent.relevanceScore * 100);
      console.log(`    ${agent.agentName.padEnd(30)} ${score}%  [${agent.category}]`);
      console.log(`      ${agent.reasons[0]}`);
    }
    console.log("");
  }
  if (result.packs.length > 0) {
    console.log("  Recommended Packs:");
    console.log("  " + "\u2500".repeat(60));
    for (const pack of result.packs.slice(0, 5)) {
      const score = Math.round(pack.relevanceScore * 100);
      const cov = Math.round(pack.coverage * 100);
      console.log(`    ${pack.packName.padEnd(30)} ${score}%  (${cov}% coverage)`);
      console.log(`      Agents: ${pack.matchedAgents.slice(0, 3).join(", ")}${pack.matchedAgents.length > 3 ? "..." : ""}`);
    }
    console.log("");
  }
  if (result.gaps.length > 0) {
    console.log("  Gap Analysis:");
    console.log("  " + "\u2500".repeat(60));
    for (const gap of result.gaps) {
      const severity = gap.severity === "high" ? "!!" : gap.severity === "medium" ? " !" : "  ";
      console.log(`    ${severity} [${gap.category}] ${gap.gap}`);
    }
    console.log("");
  }
  const outputPath = path6.join(rootPath, ".agenttoolkit-recommendations.json");
  fs5.writeFileSync(outputPath, JSON.stringify({ profile, recommendations: result }, null, 2));
  console.log(`  Full results saved to: ${outputPath}
`);
  const allAgents = result.agents;
  if (allAgents.length === 0) return;
  const answer = await promptYesNo(`  Install all ${allAgents.length} recommended agents now? (Y/n) `);
  if (!answer) {
    console.log("\n  Skipped. You can install agents individually:\n");
    for (const a of allAgents) {
      console.log(`    agenttoolkitai install ${a.agentId}`);
    }
    console.log("");
    return;
  }
  console.log("");
  let installed = 0;
  for (const rec of allAgents) {
    const entry = manifest.agents.find((a) => a.id === rec.agentId);
    if (!entry) {
      console.log(`  \u2717 ${rec.agentName} \u2014 not found in catalog`);
      continue;
    }
    try {
      await installAgentByEntry(entry);
      console.log(`  \u2713 ${rec.agentName}`);
      installed++;
    } catch (err) {
      console.log(`  \u2717 ${rec.agentName} \u2014 ${err instanceof Error ? err.message : "failed"}`);
    }
  }
  console.log(`
  Installed ${installed}/${allAgents.length} agents.
`);
}
function promptYesNo(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve5) => {
    rl.question(question, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      resolve5(trimmed === "" || trimmed === "y" || trimmed === "yes");
    });
  });
}

// cli/src/commands/doctor.ts
import * as fs6 from "node:fs";
import * as path7 from "node:path";
async function doctorCommand() {
  console.log("\n  agenttoolkitai doctor \u2014 System Health Check\n");
  const checks = [];
  const appDir = getAppDataDir();
  if (fs6.existsSync(appDir)) {
    checks.push({ name: "App data directory", status: "pass", message: appDir });
  } else {
    checks.push({ name: "App data directory", status: "fail", message: `Missing: ${appDir}. Run 'agenttoolkitai init'.` });
  }
  const agentsDir = getAgentsDir();
  if (fs6.existsSync(agentsDir)) {
    const agents = fs6.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
    checks.push({ name: "Agents directory", status: "pass", message: `${agents.length} agent(s) installed` });
  } else {
    checks.push({ name: "Agents directory", status: "warn", message: `Missing: ${agentsDir}. Run 'agenttoolkitai init'.` });
  }
  const sourcesPath = path7.join(appDir, "sources.json");
  if (fs6.existsSync(sourcesPath)) {
    try {
      const sources = JSON.parse(fs6.readFileSync(sourcesPath, "utf-8"));
      checks.push({ name: "Sources config", status: "pass", message: `${sources.length} source(s) configured` });
    } catch {
      checks.push({ name: "Sources config", status: "fail", message: "sources.json is malformed" });
    }
  } else {
    checks.push({ name: "Sources config", status: "warn", message: "Not found. Run 'agenttoolkitai init'." });
  }
  const registryPath = path7.join(appDir, "install-registry.json");
  if (fs6.existsSync(registryPath)) {
    try {
      const registry = JSON.parse(fs6.readFileSync(registryPath, "utf-8"));
      checks.push({ name: "Install registry", status: "pass", message: `${registry.records?.length ?? 0} record(s)` });
    } catch {
      checks.push({ name: "Install registry", status: "fail", message: "install-registry.json is malformed" });
    }
  } else {
    checks.push({ name: "Install registry", status: "warn", message: "Not found. Run 'agenttoolkitai init'." });
  }
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1), 10);
  if (major >= 18) {
    checks.push({ name: "Node.js version", status: "pass", message: nodeVersion });
  } else {
    checks.push({ name: "Node.js version", status: "fail", message: `${nodeVersion} \u2014 Node 18+ required` });
  }
  try {
    const manifest = await fetchManifest();
    checks.push({ name: "Catalog connectivity", status: "pass", message: `${manifest.agents.length} agents available` });
  } catch (err) {
    checks.push({ name: "Catalog connectivity", status: "fail", message: `Cannot reach catalog: ${err instanceof Error ? err.message : err}` });
  }
  const statusIcon = { pass: "\u2713", fail: "\u2717", warn: "!" };
  const statusColor = { pass: "\x1B[32m", fail: "\x1B[31m", warn: "\x1B[33m" };
  const reset = "\x1B[0m";
  for (const check of checks) {
    const icon = statusIcon[check.status];
    const color = statusColor[check.status];
    console.log(`  ${color}${icon}${reset} ${check.name.padEnd(22)} ${check.message}`);
  }
  const failures = checks.filter((c) => c.status === "fail").length;
  const warnings = checks.filter((c) => c.status === "warn").length;
  console.log("");
  if (failures > 0) {
    console.log(`  ${failures} issue(s) found. Fix them and re-run doctor.
`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`  ${warnings} warning(s). Run 'agenttoolkitai init' to resolve.
`);
  } else {
    console.log("  All checks passed.\n");
  }
}

// cli/src/index.ts
var VERSION = "0.1.0";
function printHelp() {
  console.log(`
  agenttoolkitai v${VERSION} \u2014 Claude Agent Studio CLI

  Usage:
    agenttoolkitai <command> [options]

  Commands:
    init                Initialize local agent environment
    scan [path]         Scan a project directory for signals
    recommend [path]    Scan and recommend agents for a project
    install <agent-id>  Install an agent from the catalog
    doctor              Check system health and connectivity

  Options:
    --help, -h          Show this help message
    --version, -v       Show version number

  Examples:
    agenttoolkitai init
    agenttoolkitai scan ./my-project
    agenttoolkitai recommend
    agenttoolkitai install react-specialist
    agenttoolkitai doctor
`);
}
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }
  if (command === "--version" || command === "-v") {
    console.log(VERSION);
    return;
  }
  switch (command) {
    case "init":
      await initCommand();
      break;
    case "scan":
      await scanCommand(args[1]);
      break;
    case "recommend":
      await recommendCommand(args[1]);
      break;
    case "install":
      if (!args[1]) {
        console.error("\n  Usage: agenttoolkitai install <agent-id>\n");
        process.exit(1);
      }
      await installCommand(args[1]);
      break;
    case "doctor":
      await doctorCommand();
      break;
    default:
      console.error(`
  Unknown command: ${command}
`);
      printHelp();
      process.exit(1);
  }
}
main().catch((err) => {
  console.error(`
  Error: ${err instanceof Error ? err.message : err}
`);
  process.exit(1);
});
