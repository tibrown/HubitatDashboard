# Skill: request_research

Use this when you need information you cannot confidently provide yourself.
Any agent may use this skill. It sends a request to the Research Agent.

## When to use
- You need current documentation for a library, API, or framework version.
- You need to compare two or more technologies and lack recent data.
- You need best practices from a domain outside your core expertise.
- You are about to make an assumption that could be wrong — verify it first.

## Steps

1. Identify the exact question. Write it as a single, answerable sentence.
   ✅ "What are the breaking changes between Express 4 and Express 5?"
   ✅ "What is the recommended way to handle JWT refresh tokens in 2025?"
   ❌ "Tell me about authentication" (too vague)

2. Create a request file in `team/research/inbox/`:

   **Filename:** `request-<slug>-<YYYY-MM-DD>.md`
   Example: `request-jwt-refresh-tokens-2026-03-24.md`

   **Content:**
   ```markdown
   # Research Request: <Topic>

   **Requested by:** <your-agent-name>
   **Date:** YYYY-MM-DD
   **Urgency:** high | medium | low

   ## Question
   <Single clear question>

   ## Context
   <Why you need this. What decision or task depends on the answer.
    Which task ID is blocked. 1–3 sentences.>

   ## Preferred format
   <What would be most useful: code example, comparison table, step-by-step, summary>
   ```

3. Write a note in your own `memory.md`:
   ```
   ## Pending Research: <topic> — YYYY-MM-DD
   Waiting for Research Agent. Task #XXXXX is blocked until resolved.
   Request file: team/research/inbox/request-<slug>-<date>.md
   ```

4. Continue with other tasks while waiting for the research report.
   The Research Agent will write findings to `team/research/output/` and notify you via your `memory.md`.

## Do not block on research
If you have other `scoped` tasks available, work those while waiting.
Only block if the research is a hard dependency for every available task.
