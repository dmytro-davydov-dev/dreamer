# AGENTS.md — Agentic Workflow Rules for DREAMER

This file defines **global rules** for all AI agents operating in this repository.
These rules apply to planning, coding, reviewing, refactoring, and documentation work.

---

## 1. Source of Truth (Mandatory)

Agents MUST treat the following as authoritative:

### Primary documentation
`/documentation/**`
- DESIGN_TOKENS.md
- design-tokens.json
- FIGMA_SETUP.md
- MVP.md
- TECH_IMPLEMENTATION.md
- UX_FLOW.md
- dreamer_jira.csv

### Rules
- Always scan `/documentation` **before** proposing solutions or writing code.
- If code behavior conflicts with documentation, **flag it explicitly**.
- Prefer updating documentation if behavior has intentionally changed.
- When making decisions, reference the relevant document(s).

---

## 2. External Knowledge Policy (Context7 MCP)

For **any external library, framework, tool, or platform** (e.g. React, Vite, Firebase, Playwright, VS Code APIs):

- Do NOT rely on memory or assumptions.
- Always fetch up-to-date, version-correct documentation via **Context7 MCP**.
- Explicitly invoke the tool when needed (e.g. “use context7”).

This ensures:
- No outdated APIs
- No hallucinated options
- Correct configuration for current releases

---

## 3. Implementation Standards

### Code quality
- TypeScript-first, no `any`
- Prefer explicit types and domain models (`/src/domain`)
- Keep data access isolated (`/src/data`)
- Follow existing architectural boundaries

### Changes
- Small, reviewable steps
- Avoid unrelated refactors
- Explain *why* a change exists, not just *what* changed

---

## 4. Documentation Alignment

When implementing or modifying features:
- Verify alignment with `MVP.md` scope
- Follow UX constraints from `UX_FLOW.md`
- Use tokens strictly as defined in `DESIGN_TOKENS.md` / `design-tokens.json`
- Respect Figma conventions in `FIGMA_SETUP.md`

If something is unclear:
- Ask for clarification
- Or propose a documented assumption

---

## 5. Expected Agent Behavior

Agents should:
1. Read relevant documentation
2. Identify constraints and invariants
3. Fetch external docs via Context7 if needed
4. Propose a plan
5. Implement or review with minimal churn
6. Call out risks, edge cases, and follow-ups

Agents should NOT:
- Guess APIs
- Ignore documentation
- Introduce architectural drift
- Over-engineer beyond MVP scope

---

## 6. Conflict Resolution

If multiple sources disagree:
1. `/documentation/**` wins over code
2. Explicit user instruction wins over everything
3. External docs are advisory, not authoritative

Always surface conflicts instead of silently choosing.

---
