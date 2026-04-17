# Skill: create_task

Use this to write a single task into an agent's backlog.

## Step-by-step

1. Identify the target agent (`api-dev`, `frontend-dev`, `architect`, `qa-tester`, `project-manager`).
2. Open `team/<agent>/data.json`.
3. Add a new entry to `backlog` with all required fields:

```json
{
  "id": <unique integer>,
  "title": "<short imperative verb phrase>",
  "notes": "<what done looks like + key constraints, 1–3 sentences>",
  "owner": "<agent-name>",
  "priority": "medium",
  "rd": "rds/<slug>.md",
  "status": "todo",
  "depends_on": []
}
```

`depends_on` is an optional array of task IDs that must reach `"review"` status before this task can begin. Leave as `[]` when there are no dependencies. Cross-agent dependencies are allowed (e.g., a frontend task that depends on a backend task completing first).

4. Write the linked RD to `team/<agent>/rds/<slug>.md` (or `team/orchestrator/rds/<slug>.md` for shared RDs).
5. Add a matching log entry to `team/orchestrator/data.json`.

## Rules
- `priority` is always `"medium"` on creation. PM adjusts.
- `status` is always `"todo"` on creation.
- `id` must be globally unique across all agent data.json files.
- `rd` must point to an actual file that exists (create it before or immediately after the task).
- `title` must start with an imperative verb: "Build", "Add", "Fix", "Write", "Refactor", etc.
- `depends_on` defaults to `[]`. Only populate it when a real ordering constraint exists — "task B cannot start until task A is in `review`". Prefer fewer dependencies over more; over-constraining prevents parallelism.
