# Skill: declare_research

Use this **before starting any task** to declare what you need the Research Agent to look up.
Every active agent runs this skill during the pre-development research phase (Phase 2.5 of skill_start.md).

This skill is about *declaring* — not waiting. You write your requests to the inbox, then the Research Agent processes them all in one pass while you finish prep work.

---

## When to run this

Run this immediately after your tasks are scoped and before you write any code:
1. Read all your `scoped` tasks.
2. For each task, identify what you don't know with confidence.
3. Write one research request per knowledge gap to `team/research/inbox/`.

---

## What warrants a research request

**Always request research for:**
- Any library or framework you will use — confirm the current version, install command, and any breaking changes since the last time it was used.
- Any external API or service you will integrate with — confirm the current auth method and endpoint structure.
- Any pattern you are about to implement (auth, caching, queuing) — confirm current best practice.
- Any tool mentioned in the RD but not already documented in `memory.md`.

**Do NOT request research for:**
- Something already researched this sprint (check `team/research/output/` for existing reports).
- Something fully documented in `memory.md` with a date within the last 30 days.
- General language syntax you already know (don't ask "how do for loops work in JS").

---

## How to write a research request

Create one file per topic in `team/research/inbox/`:

**Filename:** `request-<your-agent>-<slug>-<YYYY-MM-DD>.md`

Example: `request-backend-dev-express5-migration-2026-03-25.md`

**Content:**
```markdown
# Research Request: <Topic>

**Requested by:** <your-agent-name>
**Date:** YYYY-MM-DD
**Urgency:** high | medium | low
**Needed before:** <task ID(s) that depend on this answer>

## Question
<Single, specific, answerable question>

## Context
<Why you need this. What task depends on it. 1-3 sentences.>

## Preferred format
<What would be most useful: install command + code example, comparison table, migration steps, etc.>
```

**Example:**
```markdown
# Research Request: Express 5 Migration Breaking Changes

**Requested by:** backend-dev
**Date:** 2026-03-25
**Urgency:** high
**Needed before:** #20001, #20002

## Question
What are the breaking changes between Express 4 and Express 5, and what is the current stable release version?

## Context
The project RD specifies Express 5. I need to confirm the current stable version and any breaking API changes before I start building endpoints so I don't implement deprecated patterns.

## Preferred format
Bullet list of breaking changes with before/after code examples where applicable. Include current stable version number and npm install command.
```

---

## After writing requests

1. Write a note in your own `memory.md`:
   ```
   ## Pre-dev Research Declared — YYYY-MM-DD
   Waiting for Research Agent to process inbox before starting task work.
   Requests filed:
   - request-<slug>-<date>.md — <topic>
   ```
2. Continue reading RDs and doing prep work while you wait.
3. Do not start implementation until the Research Agent's handoff note appears in your `memory.md`.

---

## What comes back

The Research Agent will write:
- A full report to `team/research/output/research-<slug>-<date>.md`
- A handoff note to your `memory.md` with a 2-sentence summary and action recommendation

Read the handoff note first, then the full report if you need depth.
