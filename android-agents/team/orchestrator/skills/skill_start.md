# Skill: start

Use this to orient to the project, understand the request, and create all required tasks and RDs.

---

## Phase 0 — Orient to the Project

1. Read `project.json` in this folder. It tells you:
   - `projectPath` — where the actual codebase lives (read and write code here)
   - `agentsPath` — this folder (task backlogs, RDs, memory)
   - `name` — the project name
2. If `project.json` does not exist, ask the user for the project code path, then write `project.json`.
3. If the `projectPath` folder has existing code, read it now to understand what is already built.
   This prevents re-creating work that already exists.

**→ Proceed to Phase 1.**

---

## Phase 1 — Raava (Orchestrator): Understand & Create Tasks

> **⛔ HARD STOP:** Before writing a single task, confirm: have I read the prohibition in `team/orchestrator/AGENTS.md`?
> The Orchestrator reads `projectPath` to understand what exists. It writes **nothing** there — not a file,
> not a line, not a comment. All changes go through tasks → PM → specialist agents → QA.
> If the temptation arises to "just fix it here" — stop. Create a task.

1. Read `team/orchestrator/AGENTS.md` and act as the Orchestrator.
2. Read the project description fully. Ask **all** clarifying questions now, in one pass.
   Do not proceed until scope is clear.
3. Identify every agent who will be needed. Not all agents need tasks on every project.
4. Break the project into the smallest independently testable tasks using `skill_epic_breakdown.md`.
   - For existing projects: only create tasks for what is NEW or CHANGED. Do not duplicate existing work.
5. Write a first-draft RD for every task in `team/orchestrator/rds/`.
   - Each RD must reference the file paths in `projectPath` where work will be done.
6. Write each task into the correct agent's `data.json` using `skill_create_task.md`.
   Set `status: "todo"` on all of them.
7. Log a summary of all created tasks in `team/orchestrator/memory.md`.

**→ Phase 1 complete. Proceed immediately to Phase 2 — do not wait for user input.**

---

## Phase 2 — Sokka (Project Manager): Validate, Scope & Build Roster

Launch **one background PM agent** with the following instructions. Wait for it to complete before proceeding.

```
You are acting as Sokka (Project Manager) for the <project-name> project.
Agent path:   <agentsPath>
Project path: <projectPath>

1. Read team/project-manager/AGENTS.md.
2. Run /delegate (skill_delegate.md):
   - Read every agent's data.json. Collect all tasks with status "todo".
   - Validate each task: confirm the linked RD exists, confirm the owner is correct (re-assign if not), set priority.
   - Change each valid task status from "todo" to "scoped".
3. Build the Active Agent Roster and write it to team/project-manager/output/roster-<date>.md.
   - Research is ALWAYS on the roster. Never omit it.
   - QA Tester is always active unless the work is purely internal with no testable behavior.
   - Other specialists (architect, dba) only if their tasks warrant it.
4. For each active coding agent in the roster, file research requests to team/research/inbox/:
   - Read each agent's scoped tasks and their linked RDs.
   - Identify every library, framework, API, and service those tasks will use.
   - Write one request file per distinct research topic using _skills/skill_declare_research.md format.
   - File requests on behalf of each agent — do not wait for agents to file their own.
5. Run /plan (skill_sprint_planning.md): write sprint plan to team/project-manager/output/sprint-<N>.md.
6. Write delegation summary to team/project-manager/memory.md.
```

After the PM agent completes:
- Read the Active Agent Roster from `team/project-manager/output/roster-<date>.md`.
- Confirm research inbox files exist in `team/research/inbox/` before proceeding.

**→ Phase 2 complete. Launch Phase 2.5 immediately.**

---

## Phase 2.5 — Wan Shi Tong (Research Agent): Pre-development Research

> **Research ALWAYS runs before any coding begins.** No developer agent touches a task until every
> research handoff note is in their `memory.md`. This is non-negotiable.

Launch **one background Research Agent** with the following instructions. Wait for it to complete before proceeding.

```
You are acting as Wan Shi Tong (Research Agent) for the <project-name> project.
Agent path:   <agentsPath>
Project path: <projectPath>

1. Read team/research/AGENTS.md.
2. Read all files in team/research/inbox/. These were filed by the PM on behalf of each coding agent.
3. Deduplicate overlapping topics — if two agents asked about the same library, merge into one research task.
4. For each unique research topic, launch one background sub-agent in parallel with these instructions:
   "Research topic: <topic>. Requested by: <agents>. Needed for tasks: <task IDs>.
    Use skill_search.md to find current official docs. Confirm exact version, install command, and API patterns.
    Write a report to team/research/output/predev-<slug>-<YYYY-MM-DD>.md using skill_report.md."
5. Launch ALL topic sub-agents simultaneously. Wait for ALL to complete.
6. Write a handoff note to each active coding agent's memory.md using the format in skill_predev_research.md Step 5.
7. Mark all processed inbox files as done (rename to done-* or delete).
8. Write pre-dev research summary to team/research/memory.md.
9. Write this exact line to team/orchestrator/memory.md:
   "Pre-dev research complete — all agents notified — <YYYY-MM-DD>"
```

After the Research Agent completes:
- Read `team/orchestrator/memory.md` and confirm it contains "Pre-dev research complete" before proceeding.
- Do NOT launch any dev agent until this confirmation exists.

**→ Phase 2.5 complete. Launch Phase 3 immediately.**

---

## Phase 3 — Agents: Execute Work (Parallel)

Read the Active Agent Roster from `team/project-manager/output/roster-<date>.md`.
Execute **only the active agents**, in the order specified in the roster.

For each active agent (in roster order):

1. Read `team/<agent>/AGENTS.md`, `project.json`, and the agent's `memory.md` (for research handoff notes).
2. Read the agent's `data.json` and sort all `scoped` tasks by priority (`high` first).
3. Apply **`skill_parallel_dispatch.md`** to execute this agent's tasks:
   - Find all tasks ready this round (all `depends_on` satisfied) → mark each `in_progress` → launch one fresh background agent per task simultaneously.
   - Wait for the round to complete, then re-dispatch newly unblocked tasks as the next round.
   - Repeat until all tasks are `"review"`.

**Monitoring (runs continuously while background agents are executing):**

After launching each round, do not block silently. Actively monitor and report:

1. Periodically read each active agent's `data.json` to detect status changes.
2. Report every status transition to the user as it happens:
   - `"▶️ Task #XXXXX (<agent>/<title>): scoped → in_progress"`
   - `"✅ Task #XXXXX (<agent>/<title>): in_progress → review"`
   - `"❌ Task #XXXXX (<agent>/<title>): failed — <reason>"`
3. If a task stalls in `in_progress` with no progress for an abnormal amount of time, log a warning in `team/orchestrator/memory.md` and notify the user.
4. Continue monitoring until ALL tasks across all active agents reach `"review"` (or fail).

**→ Phase 3 complete when all active agents' tasks are at `"review"`. Proceed immediately to Phase 4 — do not wait for user input.**

---

## Phase 4 — Aang (QA Tester): Review & Verify

1. Read `team/qa-tester/AGENTS.md` and act as the QA Tester.
2. Read every agent's `data.json`. Find all tasks with `status: "review"`.
3. For each `review` task:
   - Check every done criterion in the task's RD — pass or fail each one explicitly.
   - If it passes: move the task from `backlog` to `archive` in that agent's `data.json`.
   - If it fails: follow `_skills/skill_review.md` step 6 — write a bug report, set status to `"failed"`, write a `[QA FAILURE]` notice to `team/orchestrator/memory.md`. Do NOT set the task back to `in_progress`.
4. After all `review` tasks have been evaluated:
   - If any tasks failed: act as Raava (Orchestrator) and run `skills/skill_qa_rework.md` immediately.
   - If all tasks passed: proceed to Phase 5.

**→ When all tasks are archived, proceed immediately to Phase 5 — do not wait for user input.**

---

## Phase 5 — Raava: Standup Summary

1. Read all agents' `memory.md` and `data.json` (archive).
2. Print a concise standup:
   - What was built (one line per task), with file paths relative to `projectPath`
   - Which agents were active
   - Any tasks that failed review and were reworked
   - Any open blockers or follow-up suggestions
3. The build cycle is complete.

