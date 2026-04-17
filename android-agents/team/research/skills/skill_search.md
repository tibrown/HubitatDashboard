# Skill: search

Use this to find current, authoritative information on any technical topic.

## Before you search

1. Restate the question in one sentence: "What is X and how does it work with Y?"
2. Identify the type of information needed:
   - **API / library docs** → official documentation site
   - **Best practices** → reputable engineering blogs, RFCs, official guides
   - **Comparison / evaluation** → benchmark studies, official migration guides, community surveys
   - **Security** → CVE database, official security advisories, OWASP

## Search strategy

1. Start with the **official documentation** for the technology in question.
   - Check the version — ensure it matches the project's version.
   - Note the "last updated" or release date.

2. Search for **recent articles** (past 12 months preferred):
   - Query format: `"<technology>" "<specific question>" site:docs.<vendor>.com OR site:github.com`
   - Look for official changelogs, migration guides, or release notes.

3. For comparisons, find **at least two independent sources** that agree on the conclusion.

## Source quality ranking (highest to lowest)

| Tier | Examples |
|------|---------|
| ✅ Primary | Official docs, RFCs, GitHub READMEs of the project itself |
| ✅ Strong | Official engineering blogs (e.g., engineering.fb.com, aws.amazon.com/blogs) |
| ⚠️ Acceptable | Well-known dev publications (css-tricks.com, smashingmagazine.com, web.dev) |
| ❌ Avoid | Undated tutorials, Medium articles with no author credentials, Reddit opinions |

## Freshness check

- Note the publish/update date of every source you cite.
- If a source is older than 12 months, flag it: `⚠️ Published <date> — verify still current`.
- If the only sources are old, say so explicitly in the report.

## What to record

For each source: URL, title, date, and the specific claim it supports.
