# Skill: qa_rework

Use this immediately after Phase 4 (QA Review) marks one or more tasks as `"failed"`.

> **⛔ HARD STOP:** Do NOT re-run Phase 3 directly. Do NOT fix bugs yourself. Every fix must travel the full SDLC path: Orchestrator creates tasks → PM scopes → Dev builds → QA verifies.

---

## Step 1 — Read all QA failures

1. Read `team/orchestrator/memory.md`. Find every line tagged `[QA FAILURE]`.
2. For each failure, note:
   - Original task ID and title
   - Owning agent (`owned by <agent>`)
   - Bug report path (`bug: team/qa-tester/output/...`)
3. Read each bug report in full to understand the failing criteria.

---

## Step 2 — Create fix tasks (Orchestrator role)

For each QA failure, create one new fix task using `skill_create_task.md`:

- `title`: `"Fix: <original title>"`
- `notes`: Copy the failing criteria from the bug report. Include: bug report path, original task ID, and what specifically needs to change.
- `owner`: Same agent as the original task unless the bug clearly involves a different agent's code.
- `priority`: `"high"` — QA failures are always high priority, no exceptions.
- `rd`: Reference the original RD file. Add a `### QA Rework` section describing what failed and what the fix must achieve.
- `status`: `"todo"`

Write the fix task to the owning agent's `data.json` backlog.
Log every new fix task in `team/orchestrator/memory.md`:
`[REWORK TASK] #<new-id> created for QA failure on #<original-id> — assigned to <agent>`

> If a single bug spans multiple agents (e.g., a backend API contract bug that breaks a frontend component), create one fix task per agent — do not create a single task that crosses ownership boundaries.

---

## Step 3 — Re-run the SDLC (fix tasks only)

**Phase 2 — PM delegates fix tasks:**
Act as PM. Read only the new fix tasks (status `"todo"`). Validate each one, confirm the linked RD section exists, set priority to `"high"`, move to `"scoped"`.

**Phase 2.5 — Research (if needed):**
Skip if the original research still covers the fix. Run Research only if the fix involves a library version, API, or pattern not covered in the previous research reports.

**Phase 3 — Dev agents execute fix tasks:**
Apply `skill_parallel_dispatch.md` to the fix tasks only, using the dispatch loop: find ready fix tasks → mark each `in_progress` → launch one fresh agent per task → repeat for newly unblocked fix tasks.

**Phase 4 — QA verifies fix tasks:**
After all fix tasks reach `"review"`, act as QA and run `/review` on each one.
- If all pass: archive them. Proceed to Phase 5.
- If any fail again: repeat this skill from Step 1. Log each new iteration in `team/orchestrator/memory.md`.

---

## Step 4 — Archive original failed tasks

Once all fix tasks pass QA:

1. Move each original `"failed"` task from `backlog` to `archive` in its agent's `data.json`.
2. Add a note to the archived entry: `"failedQA": true, "fixedBy": <fix-task-id>`.
3. Update `team/orchestrator/memory.md` with the rework cycle outcome:
   `[REWORK COMPLETE] Original #<id> archived as failed. Fixed by #<fix-id>. QA passed on <date>.`
