# Skill: adr

Use this to write an Architecture Decision Record (ADR).
An ADR documents a significant technical decision: what was decided, why, and what was rejected.

## Phase 1: Analyze — Understand the decision space

1. Read the request or task that triggered this ADR.
2. Answer before writing anything:
   - What problem are we solving? (1–2 sentences, no solution yet)
   - Who is affected by this decision? (which agents, which system layers)
   - What are the constraints? (timeline, existing stack, team familiarity, license)
   - What happens if we make no decision and defer?
3. Identify at least 2 alternatives to evaluate. If you can only think of one option, research further.

## When to write an ADR
- Choosing a framework, library, or protocol
- Defining a data model or API contract that will be hard to change
- Approving or rejecting a new pattern for the codebase
- Making a security or performance trade-off with lasting impact

---

## Phase 2: Design — Write the ADR

**File location:** `team/architect/output/adr-NNN-<short-kebab-title>.md`
Number sequentially: `adr-001`, `adr-002`, etc.

```markdown
# ADR-NNN: <Title>

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded by ADR-XXX
**Deciders:** architect (+ any agent with a stake in this decision)

## Context
What is the situation or problem that requires a decision?
3–5 sentences. No solution here — just the problem and constraints.

## Decision
What was decided? State it in one or two sentences.

## Rationale
Why was this chosen? Connect the decision to the constraints from Context.
Reference any research reports from the Research Agent if applicable.

## Alternatives Considered

| Alternative | Pros | Cons | Why rejected |
|-------------|------|------|--------------|
| Option A    | ...  | ...  | ...          |
| Option B    | ...  | ...  | ...          |

## Consequences
### Makes easier
- ...
### Makes harder / trade-offs accepted
- ...

## Related
- Task #XXXXX
- ADR-NNN (if superseding or related)
- Research report: `team/research/output/research-<slug>-<date>.md` (if applicable)
```

---

## Phase 3: Validate — Check the ADR before publishing

- [ ] Context describes the problem without prescribing a solution.
- [ ] At least 2 alternatives are evaluated with honest pros/cons.
- [ ] Consequences acknowledge what becomes harder, not just easier.
- [ ] Any related research is cited.
- [ ] Status is set correctly (start as `Proposed`; change to `Accepted` after review).
- [ ] The decision is specific enough that an agent can act on it without asking follow-up questions.

Share the ADR with affected agents by writing a handoff note to their `memory.md`.

---

## Phase 4: Iterate — Respond to feedback and maintain

1. If another agent challenges the decision, update the ADR with the new argument under **Alternatives Considered**.
2. If the decision is revised, set Status to `Superseded by ADR-XXX` and write the new ADR.
3. If implementation reveals a problem with the decision, document the finding and open a new ADR.
4. Never delete an ADR — supersede it instead.
