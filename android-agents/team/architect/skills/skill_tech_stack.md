# Skill: tech_stack

Use this when evaluating a new technology, library, or pattern for adoption.

## Phase 1: Analyze — Define the problem and constraints

1. Write the problem statement in one sentence: "We need X in order to Y."
2. List the constraints before looking at options:
   - Existing stack (what must it integrate with?)
   - Team familiarity (what do the agents already know?)
   - License requirements (OSS-compatible? commercial?)
   - Performance or scale requirements
   - Time to integrate vs. time available
3. If the problem is in a domain outside your expertise, request a research report first:
   - Drop a request in `team/research/inbox/` using `../../../_skills/skill_request_research.md`.
   - Wait for the report before proceeding to evaluation.

---

## Phase 2: Evaluate — Score options side-by-side

Evaluate at least 2 alternatives. More if the decision is high-risk or long-lived.

```markdown
## Tech Stack Evaluation: <Decision Topic>

**Problem:** <one sentence>
**Constraints:** <bulleted list>

| Criterion       | Option A | Option B | Option C |
|-----------------|----------|----------|----------|
| Fit for purpose | ✅ Full  | ⚠️ Partial | ❌ None |
| Maturity        | Stable v8 | Beta v0.9 | Stable v4 |
| Team familiarity | High | Low | Medium |
| License         | MIT | AGPL ⚠️ | MIT |
| Maintenance     | Active (weekly) | Stale (2y) | Active (monthly) |
| Bundle/perf impact | 12kB | 45kB | 8kB |

**Recommendation:** Option A because <2–3 sentences connecting to constraints>.
```

---

## Phase 3: Validate — Verify the recommendation

Before finalizing:
- [ ] Is the recommendation's version current? Check GitHub releases or npm for latest stable.
- [ ] Are there known breaking changes coming? Check the project's CHANGELOG or roadmap.
- [ ] Does the license allow use in this project type (commercial, SaaS, OSS)?
- [ ] Is there at least one other well-known project using this in production? (reduces adoption risk)
- [ ] Have you cited at least one primary source (official docs, official benchmark)?

Write the ADR using `skill_adr.md` to formalize the decision.

---

## Phase 4: Iterate — Revisit if context changes

1. If a new version or competitor emerges, re-evaluate with the same scorecard.
2. If the chosen option causes problems during implementation, document the issue in `memory.md` and open a new ADR to reconsider.
3. Set a review date for major dependencies: add a `memory.md` note to re-evaluate in 6 months.

## Red flags — do not adopt if:

- Last release was more than 2 years ago with open critical issues.
- No meaningful test suite in the library itself.
- License incompatible with the project (e.g., AGPL in a closed-source SaaS).
- Team has zero experience and ramp-up time is not budgeted.
- The library is owned/controlled by a single person with no succession plan (bus factor 1).
