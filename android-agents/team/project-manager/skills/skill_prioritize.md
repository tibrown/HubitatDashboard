# Skill: prioritize

Use this to set or rebalance task priorities across the team.

## Priority Definitions

| Priority | Meaning |
|----------|---------|
| `high` | Blocking another task, time-critical, or stakeholder-promised |
| `medium` | Important and should be done this sprint |
| `low` | Useful but deferrable without impact |

## Steps

1. Read all `scoped` and `todo` tasks across all agent backlogs.
2. Identify dependencies: does Task A need to finish before Task B can start?
3. Elevate the priority of tasks that are blocking others.
4. Lower the priority of tasks with no active dependency.
5. Ensure each agent has no more than 2 `high` priority tasks at once.
6. Update `priority` fields in the relevant `data.json` files.
7. Write a one-line rationale for any change above `low` in `memory.md`.

## Signals that priority is wrong
- An agent has 5+ `high` priority tasks (priority inflation — reset them).
- A `low` task is blocking a `high` task (promote the blocker).
- A task has been `scoped` for 3+ days without being started (raise to `high` or drop).
