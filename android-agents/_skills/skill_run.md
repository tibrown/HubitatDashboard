# Skill: run

Use this when a task is in `in_progress` status and ready to be executed.

> ⚠️ **One task per agent session.** This agent handles exactly one task and stops when it reaches `"review"`. The dispatcher launches fresh agents for any subsequently unblocked tasks — do not self-chain or pick up additional work.

1. **Verify `in_progress`.** Open `data.json`. Confirm this task's status is `"in_progress"`. If it still shows `"scoped"`, set it to `"in_progress"` now and write the file before doing anything else. This is the only action in step 1 — do not combine it with anything else.
2. Check `memory.md` for any research handoff notes from the Research Agent. If a handoff exists for a technology you are about to use, read the full report in `team/research/output/` before writing any code.
3. Read the task details in `data.json` and the linked RD in `rds/`.
4. Apply any version numbers, install commands, or API patterns confirmed in research reports — do not guess or use cached knowledge for libraries if a research report covers them.
5. Do the smallest correct version of the work first.
6. Verify the result against the done criteria in the RD.
7. **Set only this task's status to `"review"` in `data.json`.** Read the file fresh immediately before writing. Find this task by ID. Change only its `status` field. Write the file. Do not touch any other task's status.
8. Write a short completion note in `memory.md`.
9. **Stop.** This session is complete. The dispatcher will re-evaluate dependencies and launch fresh agents for any newly unblocked tasks.
