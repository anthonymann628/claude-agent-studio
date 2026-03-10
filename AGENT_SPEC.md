# Agent Specification

Every agent in Claude Agent Studio is a markdown file with YAML frontmatter. This document defines the format.

---

## File Format

```markdown
---
name: Agent Name
version: "1.0.0"
author: Your Name
category: engineering
model: claude-opus-4-6
tools: Read, Write, Edit, Bash, Grep, Glob
description: One-line description of what this agent does
source: official
status: published
---

# MISSION

What this agent does and why it exists.

# CORE RESPONSIBILITIES

- Responsibility 1
- Responsibility 2
- Responsibility 3

# WORKFLOW

1. Step one
2. Step two
3. Step three

# DECISION RULES

- Rule 1
- Rule 2

# COLLABORATION

- Works with: Agent A, Agent B
- Delegates to: Agent C (for specific tasks)

# OUTPUT FORMAT

How the agent should structure its responses.

# ROLE

The persona and seniority level.

# BEHAVIOR

- Behavioral guideline 1
- Behavioral guideline 2

# QUALITY BAR

- Quality requirement 1
- Quality requirement 2
```

---

## Frontmatter Fields

### Required

| Field | Type | Description |
|---|---|---|
| `name` | string | Human-readable agent name |
| `version` | string | Semantic version (e.g. `"1.0.0"`) |

### Optional

| Field | Type | Description |
|---|---|---|
| `author` | string | Creator name or organization |
| `category` | string | Agent category (see below) |
| `model` | string | Recommended Claude model ID |
| `tools` | string | Comma-separated list of Claude Code tools the agent uses |
| `description` | string | One-line summary |
| `source` | string | Origin catalog (`official`, `community`, etc.) |
| `status` | string | `published`, `draft`, or `deprecated` |
| `generated_from` | string | How the agent was created (e.g. `catalog-generation`) |

### Categories

| Category | Description |
|---|---|
| `engineering` | General software engineering |
| `frontend` | UI, React, CSS, accessibility |
| `backend` | APIs, architecture, databases |
| `devops` | Docker, CI/CD, cloud, monitoring |
| `security` | Auditing, auth, compliance, threat modeling |
| `data` | Databases, pipelines, analytics, visualization |
| `ai-llm` | Prompts, LLM apps, embeddings, evaluation |
| `product` | Product management, UX, research |
| `marketing` | Growth, SEO, ads, analytics |
| `copywriting` | Sales copy, ads, landing pages |
| `email` | Email campaigns, deliverability |
| `social-media` | Platform strategy, content |
| `startup` | Strategy, fundraising, operations |
| `business` | Operations, finance, hiring |

---

## Body Sections

The body is free-form markdown. The following sections are conventions used across the official catalog:

| Section | Purpose |
|---|---|
| `MISSION` | What the agent does (1-2 paragraphs) |
| `CORE RESPONSIBILITIES` | Bullet list of primary tasks |
| `WORKFLOW` | Numbered steps the agent follows |
| `DECISION RULES` | Opinionated guidelines and trade-off preferences |
| `COLLABORATION` | Which other agents this one works with |
| `OUTPUT FORMAT` | How responses should be structured |
| `ROLE` | Persona description and seniority level |
| `BEHAVIOR` | Behavioral guidelines |
| `QUALITY BAR` | Minimum quality requirements for output |

Not all sections are required. Use the ones that make sense for your agent.

---

## Naming Conventions

- **File name:** lowercase, hyphenated (e.g. `react-specialist.md`)
- **Agent ID:** matches the file name without extension (e.g. `react-specialist`)
- **Name field:** title case (e.g. `React Specialist`)

---

## Example

Minimal agent:

```markdown
---
name: Code Reviewer
version: "1.0.0"
---

# MISSION

You review code for correctness, readability, and maintainability.

# CORE RESPONSIBILITIES

- Identify bugs and logic errors
- Suggest clearer naming and structure
- Flag security concerns
```

Full agent: see any file in `catalogs/official/agents/` for a complete example.
