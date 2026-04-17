# Skill: review

Use this before calling work done. Applies to Architect and QA Tester primarily.

1. Read the task and its RD.
2. **Set `reviewer` to your agent key** in the task's `data.json` (e.g., `"reviewer": "architect"` or `"reviewer": "qa-tester"`). This makes the board show your avatar on the card so everyone can see who is reviewing.
3. Check every done criterion — pass or fail each one explicitly.
4. Look for obvious breakage, missing edge cases, or security gaps.
5. If it passes: archive the task (move from `backlog` to `archive` in `data.json`).
6. If it fails:
   a. Write a full bug report to `team/qa-tester/output/bug-<task-id>-<YYYY-MM-DD>.md` using `skill_bug_report.md`.
   b. Set the task's `status` to `"failed"` in its agent's `data.json`. Clear the `reviewer` field.
   c. Write a failure notice to `team/orchestrator/memory.md`:
      `[QA FAILURE] Task #<id> "<title>" owned by <agent> — bug report: team/qa-tester/output/bug-<task-id>-<date>.md — failing criteria: <one-line summary>`
   d. Do NOT set status back to `in_progress`. Do NOT notify the owning agent directly.
      The Orchestrator reads these `[QA FAILURE]` notices and creates proper fix tasks via `skill_qa_rework.md`.
