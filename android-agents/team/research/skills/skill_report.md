# Skill: report

Use this to write a research report after completing a search.

## File location
`team/research/output/research-<slug>-<YYYY-MM-DD>.md`

## Report template

```markdown
# Research: <Topic>

**Requested by:** <agent-name>
**Date:** YYYY-MM-DD
**Question:** <Exact question from the request>

## Summary
2–4 sentence answer to the question. Lead with the conclusion.

## Findings

### <Finding 1 heading>
Explanation. Keep each finding to 1–3 sentences.
**Source:** [Title](URL) — Published YYYY-MM-DD

### <Finding 2 heading>
...

## Recommendation
Clear, actionable recommendation for the requesting agent.
If no clear answer exists, say so and explain the trade-offs.

## Caveats & Staleness
- List any sources older than 12 months: ⚠️ [Source] — published YYYY-MM-DD, verify still current.
- List any conflicting information found between sources.
- List anything that could not be confirmed.

## Sources
1. [Title](URL) — Published YYYY-MM-DD
2. [Title](URL) — Published YYYY-MM-DD
```

## Quality checklist before returning
- [ ] Summary leads with a concrete answer (not "it depends" without explanation)
- [ ] Every factual claim has a cited source
- [ ] All sources have publication dates noted
- [ ] Stale sources (12+ months) are flagged with ⚠️
- [ ] Recommendation is actionable — the requesting agent knows what to do next
- [ ] Report is under 2 pages — trim anything the agent didn't ask for
