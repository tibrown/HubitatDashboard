# Skill: parallel_dispatch

Use this when executing all `scoped` tasks for a single agent.  
Launches one **fresh background agent per ready task** — never bundling multiple tasks into one agent session. Dependencies are respected by dispatching in rounds: first all tasks with no unsatisfied deps, then tasks unlocked by completing round 1, and so on.

---

## When to use

Call this skill once per agent type during Phase 3. It loops internally until all of that agent's tasks reach `"review"`.

---

## Definitions

- **Ready task**: a `scoped` task whose every `depends_on` entry is already `"review"` or `"archived"` (checked across all agents).
- **Round**: one batch of ready tasks launched simultaneously, each as its own independent background agent.

---

## Step 1 — Collect scoped tasks

Read the agent's `data.json`. Collect every task with `status: "scoped"`.  
If there are zero scoped tasks, skip this agent entirely.

---

## Step 2 — Resolve cross-agent dependencies

For each task, inspect its `depends_on` array. For any ID belonging to a **different agent**:
- Look up that task's current status in the other agent's `data.json`.
- If not yet `"review"` or `"archived"`, this task is **blocked** — exclude it from all rounds until the dependency clears.

---

## Step 3 — Dispatch loop

Repeat until all of this agent's tasks are `"review"`:

### 3a — Find ready tasks this round

From the remaining `scoped` tasks (excluding blocked ones), find every task whose **entire `depends_on` list** is now `"review"` or `"archived"`. These are the tasks to launch this round.

If no tasks are ready yet (all remaining blocked on cross-agent dependencies), wait briefly and poll until at least one clears.

> **Example — backend-dev with 5 tasks, where 17430003–17430006 all depend on 17430002:**  
> Round 1: only 17430002 is ready → **1 agent launched**  
> Round 2: 17430002 is now "review" → 17430003, 17430004, 17430005, 17430006 are all ready → **4 agents launched in parallel**

### 3b — Mark this round's tasks in_progress

Write `data.json` **once**, setting every ready task for this round to `"in_progress"`.  
Read the file back and verify. If any ready task still shows `"scoped"`, write again. **Do not launch any agents until all ready tasks are confirmed `"in_progress"`.**

### 3c — Launch one background agent per ready task

For each ready task, launch one independent background agent with exactly these instructions:

```
You are acting as the <agent-name> for the <project-name> project.

Agent path: <agentsPath>
Project code path: <projectPath>

Your ONLY task this session:
  Task <id>: <title>  [RD: <rd path>]

Steps:
1. Read the agent's AGENTS.md and memory.md (check for research handoff notes).
2. Read project.json to confirm projectPath.
3. Confirm this task's status is "in_progress" in data.json.
   If it still shows "scoped", set it to "in_progress" now before proceeding.
4. Read the linked RD file fully.
5. Read any existing relevant files in projectPath before making changes.
6. Do the work. Write all output to projectPath.
7. Verify against the done criteria in the RD.
8. Set ONLY this task's status to "review" in data.json:
   read data.json fresh → find task by ID → update status → write file.
   Do not change any other task's status.
9. Log a completion note in team/<agent>/memory.md.
10. STOP. Do not read or pick up any other tasks — the dispatcher handles what comes next.

Do NOT modify any other agent's data.json.
Do NOT start any task you were not explicitly assigned above.
```

All agents in this round are launched **at the same time**.

### 3d — Wait for round to complete

Wait for every agent in this round to finish (all their tasks at `"review"` or failed). Report each status transition to the user as it happens:
- `"▶️ Task #XXXXX (<agent>/<title>): scoped → in_progress"`
- `"✅ Task #XXXXX (<agent>/<title>): in_progress → review"`
- `"❌ Task #XXXXX (<agent>/<title>): failed"`

### 3e — Continue to next round

Re-read `data.json`. Find any remaining `scoped` tasks now unblocked by this round's completions.  
If any exist, return to **3b**. If none remain, dispatch is complete.

---

## Summary

| Round | Ready tasks | Agents launched |
|-------|-------------|-----------------|
| Round 1 | Tasks with all deps satisfied | One per task, all in parallel |
| Round 2 | Tasks unblocked by Round 1 | One per task, all in parallel |
| Round N | … | One per task, all in parallel |

Each task gets exactly one fresh agent. Sequential ordering is enforced by rounds, not by bundling tasks into a single long-running session.
