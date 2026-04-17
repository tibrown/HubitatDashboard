# Skill: process_request

Use this to handle an incoming research request from the inbox/.

## Steps

1. Read all files in `team/research/inbox/`.
   Process the oldest file first (lowest timestamp in filename).

2. Parse the request:
   - Who is asking? (`requested_by`)
   - What do they need to know? (`question`)
   - Why do they need it? (`context`) — helps you prioritize what to search for
   - When do they need it? (`urgency`)

3. Confirm the question is answerable by web research.
   If the request is too vague, write a clarification note back to the requesting agent's `memory.md`
   before searching.

4. Register the task on the dashboard. Read `team/research/data.json`, append one entry to `backlog`,
   and write the file before searching:
   ```json
   {
     "id": <unique integer — use current Unix timestamp in ms>,
     "title": "Research: <topic>",
     "notes": "Ad-hoc research for <requesting_agent>. Question: <question>",
     "owner": "research",
     "priority": "<urgency from request>",
     "rd": "",
     "status": "in_progress",
     "depends_on": []
   }
   ```
   Store the ID so you can update it when done.

5. Search using `skill_search.md`.

6. Write the report using `skill_report.md`.

7. Deliver the findings:
   - Write a handoff note to `team/<requesting-agent>/memory.md`:
     ```
     ## Research Complete: <topic> — YYYY-MM-DD
     Report: team/research/output/research-<slug>-<date>.md
     Summary: <2 sentences>
     Action needed: <what the agent should do with this information>
     ```
   - Use `../../_skills/skill_handoff.md`.

8. Mark the request as handled:
   - Rename the inbox file from `request-<slug>.md` to `request-<slug>-done.md`, OR
   - Delete it if the output report is sufficient record.

9. Update the dashboard task to `review`. Read `team/research/data.json` fresh, set the `status`
   of the task created in step 4 to `"review"`, and write the file.

## Request file format (for reference)
Incoming requests use the format defined in `../../_skills/skill_request_research.md`.
