# Skill: sprint_planning

Use this to organize a sprint from the `scoped` backlog, using the Active Agent Roster produced by `/delegate`.

---

## Step 1 — Read the Active Agent Roster

Read the most recent `output/roster-<date>.md`. This tells you:
- Which agents are active this sprint.
- The execution order.
- Any dependency notes between tasks.

Do not include inactive agents in the sprint plan, even if they have scoped tasks (they should not after `/delegate`).

---

## Step 2 — Build the Sprint Plan

For each active agent:
1. Read their `data.json` — collect all `scoped` tasks.
2. Sort by priority: `high` → `medium` → `low`.
3. Apply WIP limit: flag any agent with more than **3 tasks** as overloaded. Recommend deferring low-priority tasks to the next sprint.
4. Note any inter-agent dependencies (from task `notes` fields).

Write the sprint plan to `output/sprint-<N>.md`:

```markdown
# Sprint <N> Plan
**Date:** 2026-03-25
**Active agents:** architect, backend-dev, frontend-dev, qa-tester
**Inactive agents:** dba (no schema work), research (tech stack known)

## Execution Order
architect → backend-dev → frontend-dev → qa-tester

---

## architect (2 tasks)
- [high]   #40001 — Design auth strategy ADR
- [medium] #40002 — Review backend service layer structure

## backend-dev (3 tasks)
- [high]   #20001 — Build login endpoint *(depends on #40001)*
- [medium] #20002 — Implement token refresh
- [medium] #20003 — Add SendGrid email integration

## frontend-dev (2 tasks)
- [medium] #30001 — Build login form component
- [low]    #30002 — Add loading skeleton states

## qa-tester (3 tasks)
- [high]   #50001 — Write test plan for auth flows
- [medium] #50002 — Playwright E2E: login happy path
- [medium] #50003 — Playwright E2E: invalid credentials

---

## Flags
- #20001 cannot start until #40001 is approved (dependency noted in task).
- backend-dev has 3 tasks — at WIP limit. No more tasks this sprint.
```

---

## Step 3 — Notify Each Active Agent

Write a brief handoff note to each active agent's `memory.md`:

```
## Sprint <N> — Tasks assigned to you
- [high] #40001 — Design auth strategy ADR
- [medium] #40002 — Review backend service layer structure
Execute in priority order. Read each task's RD before starting.
```

---

## What to watch for

- **Tasks with no RD** — do not include in sprint. Flag for Orchestrator.
- **Tasks blocked by another incomplete task** — note the dependency explicitly. The blocked task cannot start until its dependency is `review` or `archived`.
- **Agents at or over WIP limit (>3 tasks)** — defer lowest-priority tasks to next sprint.
- **Tasks that belong to an inactive agent** — these should not exist after `/delegate`. If found, re-run `/delegate` to clean up.

