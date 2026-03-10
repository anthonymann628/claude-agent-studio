# Pack Specification

Packs are curated bundles of agents designed to work together for a specific role or workflow. They are defined in `packs.json`.

---

## File Format

Packs are stored in a `packs.json` file at the root of a catalog directory, alongside `manifest.json`.

```json
{
  "packs": [
    {
      "id": "full-stack-engineer",
      "name": "Full-Stack Engineer",
      "version": "1.0.0",
      "description": "Complete engineering toolkit for full-stack development",
      "rationale": "Covers the full development lifecycle from architecture to deployment.",
      "agents": [
        "backend-architect",
        "api-designer",
        "database-engineer",
        "react-specialist",
        "typescript-expert",
        "code-reviewer",
        "testing-strategist",
        "debugging-specialist",
        "git-workflow-advisor",
        "performance-optimizer"
      ]
    }
  ]
}
```

The file may also be a bare JSON array (without the `"packs"` wrapper). Both formats are supported.

---

## Fields

### Required

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique pack identifier (lowercase, hyphenated) |
| `name` | string | Human-readable pack name |
| `version` | string | Semantic version |
| `description` | string | One-line description |
| `agents` | string[] | Array of agent IDs included in the pack |

### Optional

| Field | Type | Description |
|---|---|---|
| `rationale` | string | Explanation of why these agents belong together |

---

## Agent References

The `agents` array contains agent IDs, not file paths. Each ID must correspond to an agent listed in the catalog's `manifest.json`.

When a user installs a pack, the system resolves each agent ID to its file path via the manifest and installs all of them.

---

## Design Guidelines

**Size:** 5-12 agents per pack. Fewer than 5 feels incomplete. More than 12 becomes unfocused.

**Coherence:** Every agent in the pack should clearly relate to the theme. If you have to explain why an agent belongs, it probably doesn't.

**Coverage:** A good pack covers the major aspects of its domain. A "DevOps Pipeline" pack should include containerization, CI/CD, cloud infrastructure, monitoring, and incident response -- not just Docker.

**No overlap required:** Agents in a pack don't need to reference each other. They just need to be useful together for the same type of work.

---

## Export Format

Packs can be exported as standalone JSON files for sharing. The export format adds metadata:

```json
{
  "id": "full-stack-engineer",
  "name": "Full-Stack Engineer",
  "version": "1.0.0",
  "description": "Complete engineering toolkit for full-stack development",
  "rationale": "Covers the full development lifecycle.",
  "agents": ["backend-architect", "api-designer", "database-engineer"],
  "exportedAt": "2025-01-15T12:00:00Z"
}
```

Exported packs can be imported into any Claude Agent Studio installation via the desktop app.

---

## Official Packs

The official catalog ships with 15 packs:

| Pack | Agents | Focus |
|---|---|---|
| Full-Stack Engineer | 10 | End-to-end development |
| Frontend Excellence | 10 | React, CSS, accessibility, performance |
| DevOps Pipeline | 10 | Docker, K8s, CI/CD, cloud, monitoring |
| Security Fortress | 12 | AppSec, infrastructure, compliance |
| Data Platform | 10 | Databases, pipelines, analytics |
| AI Builder | 10 | LLM apps, prompts, evaluation |
| Product Suite | 10 | PM, UX, research, analytics |
| Startup Launchpad | 10 | Strategy, fundraising, operations |
| Growth Engine | 10 | Marketing, SEO, ads, analytics |
| Content Studio | 10 | Copywriting, content strategy |
| Social Media Command | 10 | Platform strategy, content |
| Email Marketing | 10 | Campaigns, deliverability |
| Business Operations | 10 | Finance, hiring, ops |
| Code Quality | 10 | Reviews, testing, refactoring |
| SaaS Founder | 10 | End-to-end SaaS building |
