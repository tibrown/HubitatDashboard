# Dev Team Agent System

This repo is a local multi-agent development team task system built for Copilot CLI.
It works with any model-agnostic AI coding agent (Claude Code, Codex, Cursor, OpenCode).

## Team Members

| Role | Folder | Responsibility |
|------|--------|----------------|
| Orchestrator | `team/orchestrator/` | **Creates all tasks.** Receives requests, breaks them into tasks, writes them into the right agent's backlog. |
| Project Manager | `team/project-manager/` | **Delegates tasks.** Validates, prioritizes, assigns agents, moves to Scoped. |
| Backend Developer | `team/backend-dev/` | APIs, REST/GraphQL endpoints, integrations, function apps, background workers. |
| DBA Agent | `team/dba/` | Database schema design, migrations, and schema validation. Sole author of schema changes. |
| Frontend Developer | `team/frontend-dev/` | Builds UI components, layouts, responsive UX. |
| Software Architect | `team/architect/` | Architecture decisions, code reviews, tech stack. |
| QA Tester | `team/qa-tester/` | Test plans, bug reports, regression suites. |
| Research Agent | `team/research/` | **Active by default every sprint.** Runs a pre-dev research phase (verifies library versions, APIs, best practices) before any coding agent begins. |

## Read Order

1. Read this file.
2. Read the target agent's `AGENTS.md` in `team/<role>/`.
3. Read that agent's `data.json`.
4. Read the RD linked on the task.

## Repo Map

- `_skills/` = shared meta workflows (available to all agents)
- `team/*/AGENTS.md` = agent instructions and persona
- `team/*/data.json` = agent's task backlog
- `team/*/rds/` = requirements documents
- `team/*/skills/` = agent-specific skill workflows
- `team/*/memory.md` = decisions and context worth persisting
- `team/*/output/` = work produced by the agent
- `team/research/inbox/` = drop research requests here (any agent can write here)
- `_templates/` = agent skeleton for adding new roles
- `ui/` = local kanban board (run `setup.ps1` to start)

## Hard Rules

- **Only the Orchestrator may create tasks.** No other agent may add items to any `data.json`.
- **Exception: any agent may drop a file in `team/research/inbox/`** to request research without going through the Orchestrator.
- **No task may be worked on without an RD.** Tasks move to `scoped` only when an RD exists.
- **Keep tasks small and testable.** One task = one focused session of work.
- **Keep docs short.** Every sentence should help the agent do the work.
- **Do not commit secrets.** Use `.env` for any credentials.
- **Playwright is CLI only.** Agents write `.spec.ts` files and run `npx playwright test`. No Playwright MCP server or browser automation MCP tools.
- **Update status as you work.** Edit `data.json` when starting and finishing a task.

## Task Flow

```
/start (one prompt to rule them all):

  1. Orchestrator    → intake request, break into tasks, write RDs, populate data.json files [status: todo]
  2. Project Manager → validate tasks, set priorities, build Active Agent Roster [status: scoped]
  2.5 Research Agent → pre-dev research phase: each active agent declares needs, Research
                       gathers current docs/versions/patterns, delivers handoff notes before coding
  3. Active agents   → each runs their tasks in order (from roster): architect → dba → backend-dev
                       → frontend-dev → qa-tester. Each agent reads research findings first.
                       [status: in_progress → review]
  4. QA Tester      → reviews all completed tasks, archives passing ones [status: archived]
  5. Standup        → summary of everything built

No human input is needed between steps. Ask all questions upfront in /start.

Any time an agent needs information during execution:
        → /request-research (any agent) → drops file in team/research/inbox/
        → /research (Research Agent) → searches web, writes report to team/research/output/
        → handoff note written to requesting agent's memory.md → agent unblocked
```

## Kanban Columns

| Column | Meaning |
|--------|---------|
| `todo` | Orchestrator created the task; PM has not yet reviewed |
| `scoped` | PM validated, assigned, and prioritized; agent may begin |
| `in_progress` | Agent is actively working |
| `review` | Work complete; QA or Architect reviewing |

## Workflow Commands

### `/start`
*(Orchestrator — primary entry point)* One prompt kicks off the full autonomous build cycle: intake → delegate → execute → review → standup. See `team/orchestrator/skills/skill_start.md`.

### `/request-research`
*(any agent)* Drop a research request in `team/research/inbox/`. See `_skills/skill_request_research.md`.

### `/research`
*(Research Agent)* Process an inbox request — search, write report, notify requester. See `team/research/skills/skill_process_request.md`.

### `/intake`
*(Orchestrator only)* Receive a request. Understand it fully. Auto-chains to PM delegate when done. See `team/orchestrator/skills/skill_intake.md`.

### `/breakdown`
*(Orchestrator only)* Split an epic into small, assignable tasks. See `team/orchestrator/skills/skill_epic_breakdown.md`.

### `/delegate`
*(PM only)* Review `todo` tasks across all agents. Validate, adjust owner/priority, move to `scoped`. Auto-triggers agents when done. See `team/project-manager/skills/skill_delegate.md`.

### `/plan`
*(PM only)* Sprint planning from the `scoped` backlog. See `team/project-manager/skills/skill_sprint_planning.md`.

### `/prep`
*(any agent)* Clarify the task, tighten the RD, make done criteria testable. See `_skills/skill_prep.md`.

### `/run`
*(any agent)* Read the task. Read the RD. Do the work. Update status. Auto-chains to next task or next agent. See `_skills/skill_run.md`.

### `/review`
*(Architect or QA)* Check output against RD. See `_skills/skill_review.md`.

### `/wrap`
*(any agent)* Summarize what changed, save decisions, clean up. See `_skills/skill_wrap.md`.

### `/handoff`
*(any agent)* Write a handoff note for the receiving agent. See `_skills/skill_handoff.md`.

### `/standup`
*(any agent)* Generate a concise team status summary. See `_skills/skill_standup.md`.

## Shared Skills

- `_skills/skill_prep.md`
- `_skills/skill_run.md`
- `_skills/skill_review.md`
- `_skills/skill_wrap.md`
- `_skills/skill_request_research.md`
- `_skills/skill_handoff.md`
- `_skills/skill_standup.md`
