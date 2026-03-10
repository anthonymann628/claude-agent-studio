# Claude Agent Studio

**The open-source operating system for Claude Code agents.**

```bash
npx agenttoolkitai init
```

Point it at any repo. It scans your codebase, detects your stack, and installs the right Claude Code agents -- automatically.

---

## What This Does

Claude Agent Studio helps developers **discover, install, and manage** specialized Claude Code agents.

Instead of writing agent prompts from scratch, you get a catalog of 150+ production-ready agents that understand your project.

**Core capabilities:**

- **Repo scanning** -- detects your languages, frameworks, infrastructure, and domain
- **Agent recommendations** -- suggests the best agents for your specific stack
- **Agent packs** -- install curated groups of specialists in one click
- **Generated agents** -- creates custom agents when the catalog doesn't have one
- **Decentralized catalogs** -- load agents from official, community, or private sources
- **Context injection** -- every agent automatically understands your project

---

## See It In Action

```bash
npx agenttoolkitai scan
```

```
Scanning project...

Detected: TypeScript, React, Next.js, Prisma, Stripe, Docker

Recommended agents:
  0.95  React Specialist         frontend
  0.93  Next.js Developer        frontend
  0.91  API Architect            backend
  0.89  Database Architect       data
  0.87  TypeScript Expert        engineering
  0.85  DevOps Engineer          devops
  0.82  Testing Strategist       testing
```

```bash
npx agenttoolkitai install react-specialist
```

Agents are installed to `.claude/agents/` as markdown files. They work immediately with Claude Code.

---

## Why This Exists

Claude Code becomes dramatically more powerful when specialized agents are available. A generic Claude session is good. A Claude session with a React Specialist, a Database Architect, and a Security Auditor available as agents is transformative.

The problem: managing those agents manually is tedious. You have to write them, keep them updated, figure out which ones you need, and make sure they understand your project.

Claude Agent Studio solves this with:

- **An agent catalog** -- 150+ agents across 13 categories, ready to install
- **A pack system** -- themed bundles like "Full-Stack Engineer" or "Security Fortress"
- **Repo-aware recommendations** -- scans your project and tells you exactly which agents to install
- **Context injection** -- agents receive filtered context about your stack, so their advice is grounded in your actual codebase

---

## Features

### Repo Scanner

Analyzes your codebase to detect languages, frameworks, infrastructure, data layer, AI stack, integrations, and workflow signals. Supports Node.js, Python, Rust, Go, and more.

### Agent Recommendations

Uses scan results to rank agents by relevance. A Next.js + Prisma project gets different recommendations than a FastAPI + Redis project.

### Agent Packs

15 curated bundles: Full-Stack Engineer, Frontend Excellence, DevOps Pipeline, Security Fortress, Data Platform, AI Builder, Product Suite, Startup Launchpad, Growth Engine, Content Studio, Social Media Command, Email Marketing, Business Operations, Code Quality, and SaaS Founder.

### Generated Agents

When the scanner detects a gap -- technology your project uses but no matching agent exists -- it can generate a draft specialist on the fly.

### Catalog Ecosystem

Catalogs are just GitHub repos with a `manifest.json` and markdown agent files. The official catalog ships with 150+ agents. Anyone can create and share their own.

### Context Injection

Agents automatically receive project context -- your frameworks, infrastructure, domain, and team conventions -- so they give advice specific to your setup, not generic boilerplate.

---

## Quick Start

### CLI (fastest)

```bash
npx agenttoolkitai init
npx agenttoolkitai scan
npx agenttoolkitai recommend
npx agenttoolkitai install <agent-id>
npx agenttoolkitai doctor
```

No install required. Runs directly via `npx`.

### Desktop App

```bash
git clone https://github.com/anthonymann628/claude-agent-studio.git
cd claude-agent-studio
npm install
npm run tauri:dev
```

Requires [Node.js 18+](https://nodejs.org/), [Rust](https://www.rust-lang.org/tools/install), and [Tauri CLI v2](https://v2.tauri.app/start/prerequisites/).

---

## The Catalog

The official agent catalog lives at:

**[github.com/anthonymann628/claude-agent-catalog](https://github.com/anthonymann628/claude-agent-catalog)**

Every agent is a markdown file with YAML frontmatter:

```markdown
---
name: React Specialist
version: "1.0.0"
category: frontend
model: claude-opus-4-6
tools: Read, Write, Edit, Bash, Grep, Glob
description: Expert in React patterns, hooks, and component architecture
---

# MISSION

You are a React expert who designs and builds high-quality
React applications using modern patterns...
```

Catalogs are decentralized. Anyone can host one on GitHub and share it as a source.

See [AGENT_SPEC.md](AGENT_SPEC.md) for the full agent format and [PACK_SPEC.md](PACK_SPEC.md) for pack structure.

---

## Create Your Own Agents

**In the app:** Open the Agent Editor, fill in the metadata, write the body, and save.

**Manually:** Create a `.md` file with YAML frontmatter (`name` and `version` required), write the agent body, and place it in your agents directory.

**Publish to a catalog:** Add your agent to a GitHub repo with a `manifest.json`, and anyone can install it.

See [AGENT_SPEC.md](AGENT_SPEC.md) for field definitions and conventions.

---

## Contributing

We welcome contributions -- new agents, new packs, bug fixes, and features.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started.

---

## License

[MIT](LICENSE)
