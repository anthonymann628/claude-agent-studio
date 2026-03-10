# Contributing to Claude Agent Studio

Thanks for your interest in contributing. This guide covers how to add agents, packs, and catalogs, and how to submit code changes.

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Rust](https://www.rust-lang.org/tools/install) (latest stable toolchain)
- [Tauri CLI v2](https://v2.tauri.app/start/prerequisites/)

### Clone and Install

```bash
git clone https://github.com/anthonymann628/claude-agent-studio.git
cd claude-agent-studio
npm install
```

### Development

```bash
npm run tauri:dev     # Desktop app with hot reload
npm run dev           # Frontend only (no Tauri shell)
npm run cli:build     # Rebuild CLI
npm test              # Run test suite (60 tests)
```

### Build for Production

```bash
npm run tauri:build
```

---

## Adding Agents

The most impactful contribution is a well-written agent.

1. Create a `.md` file following the format in [AGENT_SPEC.md](AGENT_SPEC.md)
2. Place it in `catalogs/official/agents/`
3. Add an entry to `catalogs/official/manifest.json` with the agent's `id`, `name`, `category`, `description`, and `file` path
4. Test it locally by running `npm run tauri:dev` and verifying it appears in the catalog
5. Submit a pull request

**What makes a good agent:**

- Clear, focused mission (one job, done well)
- Specific decision rules (not vague guidelines)
- Concrete workflow steps
- Defined output format
- Explicit collaboration boundaries (what this agent does and does not do)
- Tested with actual prompts before submission

---

## Adding Packs

Packs are themed bundles of agents.

1. Choose a coherent theme (e.g. "Mobile Development", "Data Engineering")
2. Select 5-12 agents that work together for that theme
3. Add the pack to `catalogs/official/packs.json`
4. Include a `rationale` explaining why these agents belong together
5. Submit a pull request

See [PACK_SPEC.md](PACK_SPEC.md) for the full specification.

---

## Adding Catalogs

Anyone can create a catalog as a GitHub repository. You do not need to submit a PR to the main repo -- catalogs are decentralized by design.

1. Create a repo with this structure:

```
my-catalog/
  manifest.json
  packs.json        # optional
  agents/
    my-agent.md
```

2. The `manifest.json` lists all agents with their IDs, names, categories, and file paths
3. Share your repo URL -- users add it as a source in Claude Agent Studio

---

## Code Contributions

### Project Structure

| Directory | Description |
|---|---|
| `src/` | React frontend (TypeScript, Zustand, React Router) |
| `src-tauri/` | Rust backend (Tauri 2, file system, HTTP) |
| `cli/` | CLI tool (`agenttoolkitai`) |
| `catalogs/official/` | Official agent catalog (150+ agents, 15 packs) |
| `tests/` | Vitest test suite |

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Run `npm test` to verify tests pass
5. Run `npm run cli:build` to verify the CLI builds
6. Commit with a clear message
7. Open a pull request against `main`

### Branch Naming

```
feat/short-description     # New features
fix/short-description      # Bug fixes
docs/short-description     # Documentation
agents/agent-name          # New agent contributions
packs/pack-name            # New pack contributions
```

### Code Style

- TypeScript for all frontend and CLI code
- Rust for Tauri backend commands
- No unnecessary dependencies -- the CLI has zero runtime deps
- Strict TypeScript (`"strict": true`)
- Functional React components only
- Prefer named exports over default exports
- No `any` types in TypeScript
- Follow `rustfmt` formatting for Rust

---

## Reporting Issues

**Bug reports** should include: steps to reproduce, expected vs actual behavior, platform/version, and screenshots or logs if applicable.

**Feature requests** should include: the problem you're solving, your proposed approach, and whether you're willing to implement it.

---

## Questions?

Open an issue on GitHub. We're happy to help.
