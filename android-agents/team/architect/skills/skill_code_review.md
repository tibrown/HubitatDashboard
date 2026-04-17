# Skill: code_review

Use this when reviewing an agent's completed work before it moves to `review` status or is archived.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

## Phase 1: Analyze — Understand what you are reviewing

1. Read the task and its linked RD.
2. Read the full implementation diff or output.
3. Before commenting, form a complete picture:
   - What was the agent trying to do?
   - Does the overall approach match the design?
   - What is the risk surface? (auth, data, external calls, user input)
4. Do not comment on style preferences. Only raise issues that matter for correctness, security, or maintainability.

---

## Phase 2: Review — Check every category

### Correctness
- [ ] Does the implementation satisfy every requirement in the RD?
- [ ] Are all edge cases from the RD handled?
- [ ] Are error paths covered and tested?
- [ ] Do the Playwright tests pass and actually cover the behavior (not just assert `200`)?

### Architecture
- [ ] Does it follow agreed patterns and folder structure?
- [ ] Does it introduce unexpected coupling or dependencies?
- [ ] Is the abstraction level appropriate (not over- or under-engineered)?
- [ ] Is the OpenAPI spec updated and consistent with the implementation?

### Security
- [ ] No secrets or credentials in code (only env vars).
- [ ] All user input is validated before use.
- [ ] No SQL injection, XSS, SSRF, or path traversal vectors.
- [ ] Auth middleware applied on every protected route.
- [ ] Sensitive data is not logged.

### Quality
- [ ] Code is readable without requiring excessive comments.
- [ ] No dead code, `console.log` debug statements, or commented-out blocks.
- [ ] Playwright tests exist and pass: `npx playwright test <spec>`.
- [ ] OpenAPI spec validates cleanly.

---

## Phase 3: Communicate — Write actionable feedback

For each issue found, write one comment in this format:

```
**File:** src/api/users.ts
**Line:** 42
**Issue:** This allows SQL injection via string interpolation in the query.
**Fix:** Use a parameterized query: `db.query('SELECT * FROM users WHERE id = $1', [id])`
**Severity:** Critical | Major | Minor
```

- Reference exact file and line — never vague "this area."
- State the problem, not the preference.
- Suggest a concrete fix or direction.
- Rate severity: Critical (must fix before merge) | Major (should fix) | Minor (can defer).

---

## Phase 4: Iterate — Follow through to resolution

1. If all checks pass: archive the task (move to `archive` in `data.json`). Write "LGTM" note in the agent's `memory.md`.
2. If issues found: set task status back to `in_progress`. Write your review comments to the agent's `memory.md`.
3. After the agent addresses feedback: re-review only the changed sections.
4. Do not require more than 2 review cycles for a single task. If issues persist after 2 cycles, escalate to Orchestrator to re-scope the task.

