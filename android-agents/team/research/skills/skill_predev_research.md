# Skill: predev_research

Use this to run the **pre-development research phase** — processing all inbox requests from active agents before any coding begins.

This is the primary mode of the Research Agent in the `/start` flow. It runs after PM delegation, before any agent writes a single line of code.

---

## Step 1 — Collect All Inbox Requests

1. Read all files in `team/research/inbox/`.
2. Group requests by urgency: `high` first, then `medium`, then `low`.
3. Within the same urgency level, order by `Needed before` task priority (align with PM roster).
4. List all topics before starting any searching — get the full picture first.

If the inbox is empty, check whether active agents forgot to file requests:
- Read each active agent's scoped tasks and their RDs.
- Identify any technology, library, or API that is not already documented in `memory.md` or a recent report in `output/`.
- If you find gaps, write the research request yourself on behalf of that agent and process it.

---

## Step 2 — Deduplicate

Before searching, scan for overlapping questions:
- If two agents asked about the same library at the same version, merge into one research task.
- If one question is a subset of another, answer the broader question and cite it for both agents.
- Note any merged requests in `memory.md` to avoid re-doing work.

---

## Step 3 — Register Research Tasks on Dashboard

Before launching any sub-agents, write one task entry per unique research topic into `team/research/data.json` (backlog array) with status `in_progress`. This makes the research work visible on the kanban board immediately.

For each topic, add:
```json
{
  "id": <unique integer — use current Unix timestamp in ms + topic index, e.g., 1711550000000>,
  "title": "Research: <topic>",
  "notes": "Pre-dev research for <agent(s)>. Needed for tasks: <task IDs>.",
  "owner": "research",
  "priority": "<high|medium|low — match inbox urgency>",
  "rd": "",
  "status": "in_progress",
  "depends_on": []
}
```

Read `team/research/data.json`, append the new entries to the `backlog` array, and write the file before proceeding. Store the IDs so you can update them at the end.

---

## Step 4 — Research Each Topic (Parallel)

For each unique research topic (after deduplication), launch **one background sub-agent** in parallel:

```
Research topic: <topic>
Requested by: <agent(s)>
Needed for tasks: <task IDs>
Agent path: <agentsPath>

1. Use skill_search.md to find current, authoritative documentation (official docs, changelogs, release notes).
2. Confirm the exact stable version the project will use. Read the relevant RDs or project.json for context.
3. Write a report to team/research/output/predev-<slug>-<YYYY-MM-DD>.md using skill_report.md.
   Include: exact version, install/import command, specific API patterns, gotchas or breaking changes, sources with dates.
```

Launch **all topic sub-agents simultaneously**. Do not wait for one to finish before starting the next.
Wait for **all** sub-agents to complete before moving to Step 4.

---

## Step 5 — Write Reports

For each topic, write a report to `team/research/output/` using `skill_report.md`.

**Naming convention for pre-dev reports:**
```
team/research/output/predev-<slug>-<YYYY-MM-DD>.md
```
Example: `predev-express5-migration-2026-03-25.md`

The report should be **actionable and specific** to the asking agent's task. Include:
- The exact version/release to use
- Install/import command
- The specific API pattern the agent needs (not a general tutorial)
- Any gotchas, deprecations, or breaking changes relevant to the task
- Sources with dates

---

## Step 6 — Deliver Findings to Each Agent

For each agent that filed a request (or for whom you proactively researched), write a handoff note to their `memory.md`:

```markdown
## Research Delivered: <topic> — YYYY-MM-DD

**Report:** team/research/output/predev-<slug>-<date>.md
**For tasks:** #XXXXX, #XXXXX
**Summary:** <2 sentences — lead with the action the agent should take>
**Key finding:** <most important thing from the report, in one sentence>
**Action:** <what the agent should do with this before starting their tasks>
```

Example:
```markdown
## Research Delivered: Express 5 Migration — 2026-03-25

**Report:** team/research/output/predev-express5-migration-2026-03-25.md
**For tasks:** #20001, #20002
**Summary:** Express 5.0.1 is stable as of Jan 2025. The main breaking change is that `res.json()` no longer accepts non-object primitives.
**Key finding:** Route handlers must now return a Promise or use `next(err)` — no more silent async errors.
**Action:** Use `npm install express@5` and update all async route handlers to use the new error-propagation pattern before writing any endpoint code.
```

---

## Step 7 — Mark Requests Handled

For each processed inbox file:
- Rename it from `request-<slug>-<date>.md` to `done-request-<slug>-<date>.md`, OR
- Delete it and rely on the report in `output/` as the record.

---

## Step 8 — Mark Dashboard Tasks as Review

For each task ID registered in Step 3, update its status from `in_progress` to `review` in `team/research/data.json`. Read the file fresh, change only the `status` field of each affected task, and write it back.

---

## Step 9 — Write a Pre-dev Research Summary

Write a summary to your own `memory.md`:

```markdown
## Pre-dev Research Complete — YYYY-MM-DD

Topics researched:
- Express 5 migration (for backend-dev tasks #20001, #20002)
- React Query v5 API changes (for frontend-dev tasks #30001, #30003)
- Playwright 1.44 new features (for qa-tester tasks #50001, #50002)

Merged: backend-dev and frontend-dev both asked about TypeScript 5.4 — single report written.
Skipped: architect asked about JWT best practices — existing report from 2026-03-01 is still current.

All active agents have been notified. Development may begin.
```

Write the same one-liner to each active agent's `memory.md`:
```
Research pre-flight complete. All reports are in team/research/output/. Check your memory.md for handoff notes before starting any task.
```

---

## Quality checklist

- [ ] Every active agent's inbox requests processed (or proactively filed and processed)
- [ ] Overlapping requests deduplicated
- [ ] Every report cites current official documentation with version numbers
- [ ] Every report includes the exact install/import command where applicable
- [ ] Handoff note written to every requesting agent's `memory.md`
- [ ] All inbox files marked done
- [ ] Summary written to research `memory.md`
- [ ] All research tasks in `data.json` updated to `review` status
