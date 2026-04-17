# Skill: intake

Use this when receiving a new request (feature, bug, spike, or question).

1. Read the request fully before writing anything.
2. Identify what is unclear. List the open questions.
3. If you cannot answer those questions yourself, stop and ask the requester before proceeding.
4. Once scope is clear:
   - Identify which agent(s) will do the work.
   - Draft one sentence per task: "Build X so that Y."
5. Write each task using `skill_create_task.md`.
6. Log a summary of the intake in `memory.md`.

**Do not create tasks for requests you do not fully understand.**

---

## Auto-handoff

When all tasks are written and logged, **immediately act as the Project Manager** without waiting for user input:

1. Read `team/project-manager/AGENTS.md`.
2. Run `/delegate` — validate, prioritize, and scope all `todo` tasks.
3. After all tasks are `scoped`, identify which agents have work and trigger each one in order.

> Only stop and wait for user input if clarification is genuinely needed mid-intake.
