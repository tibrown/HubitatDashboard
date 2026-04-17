# Skill: delegate

Use this to process `todo` tasks, determine the active agent roster, and move valid tasks to `scoped`.

---

## Step 1 — Read All Tasks

Read `data.json` for every agent folder under `team/`. Collect every task with `status: "todo"`.
If there are no `todo` tasks, log that in `memory.md` and stop.

---

## Step 2 — Validate Each Task

For each `todo` task, apply these checks in order:

### a. Does the RD exist?
- Read the file path in the task's `rd` field.
- If the file does not exist on disk: **do not scope the task**. Flag it and write a note to `team/orchestrator/memory.md` asking the Orchestrator to create the missing RD.
- If the RD exists but is empty or has placeholder content: treat it as missing. Flag it.

### b. Is the assigned owner the right agent?
Evaluate whether the task actually belongs to the assigned agent using this guide:

| Task type | Correct owner |
|-----------|--------------|
| New DB table, schema change, migration, index design | `dba` |
| API endpoint, service, integration, function app, worker | `backend-dev` |
| UI component, layout, responsive design, accessibility | `frontend-dev` |
| Tech stack decision, ADR, code review, architecture | `architect` |
| Test plan, regression suite, bug report | `qa-tester` |
| Web research, external documentation lookup | `research` |

**If the assignment is wrong:** move the task to the correct agent's `data.json` and remove it from the wrong agent's file. Update the `owner` field. Record the re-assignment in `memory.md` with the reason.

**Consolidation:** If a task assigned to `dba` involves only a trivial config value (no schema DDL), reassign it to `backend-dev`. Document why.

### c. Set priority
- `high`: this task blocks other tasks, or the feature cannot ship without it.
- `medium`: important, not blocking.
- `low`: nice-to-have, can be deferred without blocking the sprint.

Consider dependencies between tasks when setting priority — if Task B cannot start until Task A is done, Task A is at least `high`.

### d. Scope it
- Change `status` from `"todo"` to `"scoped"`.

---

## Step 3 — Build the Active Agent Roster

After all tasks are validated and scoped, determine which agents are **genuinely needed**.

For each potential agent, ask:
- Does this agent have at least one `scoped` task?
- Does the work warrant their specialist skills? (See the roster guidance table in `AGENTS.md`)

Write the Active Agent Roster to `output/roster-<date>.md`:

```markdown
# Active Agent Roster — <date>

## Active Agents (will execute)
- research — ALWAYS active (pre-dev research phase before any coding begins)
- architect — 2 tasks (design decisions needed before backend work)
- dba — 1 task (schema change required)
- backend-dev — 4 tasks
- frontend-dev — 3 tasks
- qa-tester — 3 tasks (always active when user-facing features exist)

## Inactive Agents (skipped this sprint)
- [agent] — SKIPPED: [specific, documented reason]

## Execution Order
research (pre-dev only) → architect → dba → backend-dev → frontend-dev → qa-tester

## Notes
- Task #20003 was reassigned from dba to backend-dev: only a connection string config, no DDL needed.
- Task #40001 priority bumped to high: architect ADR must complete before backend-dev can start #20001.
```

**Research Agent default rule:** Research is listed as **active unless explicitly skipped with a written justification**. The justification must confirm that every library, framework, API, and external service used this sprint is documented in `memory.md` with a date within the last 30 days. If any new package or service is being introduced, Research is always active.

---

## Step 3.5 — File Research Requests to Inbox

Before finishing, file research requests on behalf of every active coding agent.
This ensures the Research Agent has everything it needs before the Orchestrator launches it.

For each active coding agent in the roster (architect, dba, backend-dev, frontend-dev, qa-tester):
1. Read all their `scoped` tasks and linked RD files.
2. Identify every library, framework, API, service, or pattern those tasks will use.
3. For each distinct topic NOT already covered by a report less than 30 days old in `team/research/output/`:
   - Write one request file to `team/research/inbox/` using `../../_skills/skill_declare_research.md` format.
   - Name it: `request-<agent>-<slug>-<YYYY-MM-DD>.md`
   - Fill in: `Requested by`, `Urgency` (match the task priority), `Needed before` (task IDs), the specific question, and context.
4. Multiple agents may request the same topic — file each one. The Research Agent deduplicates.
5. Write a note in `memory.md` listing every request filed and on whose behalf.

---

For tasks that have ordering requirements, add a `notes` entry to the dependent task in `data.json`:
```json
"notes": "Depends on architect task #40001 (ADR must be approved first)."
```

---

## Step 5 — Log Delegation Decisions

Write a summary to `memory.md`:
- How many tasks were scoped vs. flagged.
- Any re-assignments and why.
- Which agents were activated and which were skipped, and why.
- Any tasks that could not be scoped (missing RD, wrong owner that couldn't be resolved).

---

## Re-assignment procedure

To move a task from one agent's `data.json` to another:
1. Copy the full task object to the new agent's `data.json` `backlog` array.
2. Remove it from the old agent's `data.json` `backlog` array.
3. Update the `owner` field in the task to the new agent's name.
4. Log the re-assignment in `memory.md`.

---

## Done

When all tasks are `scoped`, the Active Agent Roster is written, and all research requests are filed to `team/research/inbox/`, the PM's work is complete. The Orchestrator will read the roster and proceed to launch the Research Agent.

Do not chain to any further agents — the Orchestrator is the conductor and handles all subsequent phase launches.

