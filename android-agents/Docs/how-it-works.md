# How Raava Works — Under the Hood

> A deep-dive into the architecture, data flow, and execution model of the Raava Dev Team Agent System.

---

## What Is Raava?

Raava is a **local multi-agent development team** designed to run the full software development lifecycle (SDLC) from a single prompt. It is model-agnostic — it works with GitHub Copilot CLI, Claude Code, Codex, Cursor, or any other AI coding agent. The system lives entirely on disk: no cloud backend, no external services, no proprietary runtime. Everything is files.

---

## High-Level Architecture

```
User Prompt
    │
    ▼
┌───────────────────────────────────────────────────────────┐
│  Raava (Orchestrator)                                      │
│  • Parses the request                                      │
│  • Creates tasks → writes to team/*/data.json              │
│  • Writes RDs → team/orchestrator/rds/                    │
└──────────────┬────────────────────────────────────────────┘
               │ auto-chains
               ▼
┌───────────────────────────────────────────────────────────┐
│  Project Manager (Sokka)                                   │
│  • Validates tasks, sets priority, moves to "scoped"       │
│  • Builds Active Agent Roster                              │
│  • Files pre-dev research requests to research/inbox/      │
└──────────────┬────────────────────────────────────────────┘
               │ auto-chains
               ▼
┌───────────────────────────────────────────────────────────┐
│  Research Agent (Wan Shi Tong)                             │
│  • Processes ALL inbox requests in parallel                │
│  • Writes reports → team/research/output/                  │
│  • Delivers handoff notes → each agent's memory.md         │
└──────────────┬────────────────────────────────────────────┘
               │ auto-chains (no dev agent starts until this is done)
               ▼
┌───────────────────────────────────────────────────────────┐
│  Active Dev Agents (round-based parallel dispatch)         │
│  architect → dba → backend-dev → frontend-dev             │
│  Each task → one independent background agent session      │
└──────────────┬────────────────────────────────────────────┘
               │ auto-chains
               ▼
┌───────────────────────────────────────────────────────────┐
│  QA Tester (Aang)                                          │
│  • Reviews all "review" tasks against their RD criteria    │
│  • Pass → archived | Fail → rework cycle via Orchestrator  │
└──────────────┬────────────────────────────────────────────┘
               │
               ▼
          Standup Summary
```

No human input is required between any of these phases.

---

## The File System IS the Database

There is no SQL database or message queue. State is maintained entirely through JSON files and Markdown files on disk.

### `team/<agent>/data.json` — The Task Backlog

Every agent has exactly one `data.json`. It holds all tasks for that agent. Structure:

```json
{
  "backlog": [
    {
      "id": 17001,
      "title": "Create user authentication endpoint",
      "notes": "POST /auth/login. Returns JWT. Uses bcrypt for password comparison.",
      "owner": "backend-dev",
      "priority": "high",
      "rd": "rds/rd-user-auth.md",
      "status": "scoped",
      "depends_on": [17000]
    }
  ],
  "archive": [
    { "id": 16999, "status": "archived", ... }
  ]
}
```

**Task lifecycle:** `todo` → `scoped` → `in_progress` → `review` → `archived`

| Status | Set by |
|--------|--------|
| `todo` | Orchestrator only |
| `scoped` | Project Manager |
| `in_progress` | The specialist agent (at task start) |
| `review` | The specialist agent (at task end) |
| `archived` | QA Tester (after passing review) |

The `depends_on` array lists IDs from *any* agent's backlog. The parallel dispatcher reads cross-agent dependency status before launching each round.

### `team/<agent>/memory.md` — Persistent Agent Memory

Each agent maintains a `memory.md`. This serves as:
- A **research handoff channel**: the Research Agent writes findings here so dev agents have verified library versions and API patterns before coding
- A **decision log**: architecture choices, constraints, lessons from previous sprints
- A **blocker log**: pending research requests with task IDs waiting on them

### `team/<agent>/rds/` — Requirements Documents

No task may enter `scoped` status without a linked RD existing on disk. The RD defines done criteria — the contract between the task creator and the executor. QA validates against these criteria verbatim.

### `team/orchestrator/rds/` — Centralized RD Storage

The Orchestrator writes all first-draft RDs here, referencing file paths in `projectPath` where work will be done. Other agents' RD folders may also exist for agent-specific docs.

### `team/research/inbox/` — Async Research Queue

Any agent can drop a file here without going through the Orchestrator. The Research Agent picks it up and processes it. File naming: `request-<slug>-<YYYY-MM-DD>.md`. Processed files are renamed `done-*` or deleted.

---

## The Five-Phase Pipeline (`/start`)

The entire SDLC is encoded in `team/orchestrator/skills/skill_start.md`. Here is what happens when you run `/start`:

### Phase 0 — Orient

Reads `project.json` to learn:
- `projectPath` — where the actual codebase lives
- `agentsPath` — where the agent team folder lives
- `name` — the project name

If `project.json` doesn't exist, Raava asks and creates it.

### Phase 1 — Orchestrator: Intake & Task Creation

Raava reads the full project codebase (to avoid duplicating existing work), asks **all clarifying questions in one pass**, then:

1. Breaks the request into the smallest independently testable tasks
2. Writes first-draft RDs into `team/orchestrator/rds/`
3. Writes tasks into each responsible agent's `data.json` with `status: "todo"`
4. Logs a summary to `team/orchestrator/memory.md`

**Hard constraint:** The Orchestrator never writes code to `projectPath`. It only reads.

### Phase 2 — Project Manager: Delegate & Scope

A background PM agent:
1. Reads every agent's `data.json` for `"todo"` tasks
2. Validates owner assignments (re-assigns if wrong), verifies RDs exist, sets priority
3. Moves valid tasks to `"scoped"`
4. Builds the **Active Agent Roster** — a list of which agents are actually needed this sprint, written to `team/project-manager/output/roster-<date>.md`
5. Files research requests to `team/research/inbox/` for every library/API/framework that active agents will use

**Research is always on the roster.** It can never be skipped.

### Phase 2.5 — Research Agent: Pre-Dev Research

Before any coding agent touches a single task:
1. Reads all inbox files
2. Deduplicates overlapping topics
3. Launches **one background sub-agent per unique research topic**, all in parallel
4. Each sub-agent searches the web for current docs, exact versions, install commands, API patterns
5. Writes reports to `team/research/output/predev-<slug>-<date>.md`
6. Delivers handoff notes to each relevant agent's `memory.md`
7. Writes `"Pre-dev research complete — all agents notified — <date>"` to `team/orchestrator/memory.md`

The Orchestrator waits for this confirmation before proceeding. No coding begins until it appears.

### Phase 3 — Dev Agents: Parallel Execution

This phase uses `skill_parallel_dispatch.md`, a round-based dependency-aware dispatch algorithm:

```
Round 1: Find all tasks with no unsatisfied depends_on → launch one background agent per task simultaneously
Round 2: Tasks whose depends_on became "review" in Round 1 → launch in parallel
Round N: Repeat until all tasks reach "review"
```

**Each task gets exactly one fresh, isolated agent session.** The agent:
1. Reads its `AGENTS.md` and `memory.md` (for research handoffs)
2. Confirms task status is `in_progress`
3. Reads the linked RD
4. Applies verified library versions from research reports
5. Does the work, writes output to `projectPath`
6. Sets only its task to `"review"` in `data.json`
7. **Stops.** Never picks up other tasks.

The Orchestrator monitors status changes and reports every transition in real-time.

### Phase 4 — QA: Review & Verify

A QA agent reads every `"review"` task and checks each done criterion from the linked RD explicitly (pass/fail). 

- **Pass** → moves task from `backlog` to `archive` in `data.json`
- **Fail** → writes a bug report, sets status to `"failed"`, notifies Orchestrator

If any tasks fail, `skill_qa_rework.md` triggers a rework cycle: the Orchestrator creates new repair tasks and the pipeline re-runs for those specific items.

### Phase 5 — Standup

Raava reads all agents' `memory.md` and archives, then prints:
- One line per task built, with file paths relative to `projectPath`
- Active agents for this sprint
- Any failures and rework
- Open blockers or follow-up suggestions

---

## The Kanban Board

The board is a local web app that auto-refreshes as agents work.

### Backend: `ui/server.py` (Flask)

A Python Flask server with CORS enabled. It runs on port `8765` (overridable via `OPEN_ZEU_PORT` env var).

**API surface:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves `index.html` |
| `/api/repos` | GET | Returns agent metadata (name, color, role, subtitle) |
| `/api/data` | GET | Returns all agents' `data.json` contents (normalized with `repo` field) |
| `/api/data/<repo>` | GET | Returns one agent's data |
| `/api/data/<repo>` | PUT | Writes updated data for one agent |
| `/api/skills` | GET | Returns all skill `.md` files grouped by agent |
| `/api/file` | GET | Returns raw content of any `.md` file within the repo (path-traversal safe) |
| `/avatars/<file>` | GET | Serves avatar images |

The `REPOS` dict in `server.py` maps agent keys to their folder paths, display colors, labels, and skills directories. Agent display names are overridable via `agent-names.json` (gitignored; copy from `agent-names-example.json`).

### Frontend: `ui/index.html`

A single-page app (no framework, pure vanilla JS) that:
- Polls `/api/data` to show live task status across all agents
- Renders a Kanban board with columns: **Todo → Scoped → In Progress → Review → Archived**
- Shows a **Project Complete** banner when all tasks are archived
- Lets users click skill files to read them in a modal (fetched from `/api/file`)
- Supports agent-specific color theming (colors defined in `server.py`)

### Board Launch

`scripts/start-dashboard.ps1` handles starting the board:
1. Checks for an existing process on the port and kills it
2. Starts `server.js` (Node.js alternative backend) as a detached hidden process
3. Health-checks the server
4. Opens the URL in Chrome or Edge in **app mode** (no address bar, standalone window feel)

The Python `server.py` is the primary backend; `server.js` is an alternative that `start-dashboard.ps1` uses. Both expose the same API surface.

---

## Agent Personas & Hard Constraints

Each agent has a `team/<role>/AGENTS.md` that defines:
- Their persona name (e.g., Raava, Sokka, Wan Shi Tong, Aang)
- Their exact responsibilities
- **Hard rules** — non-negotiable constraints encoded in their instructions

**The single most important hard rule:** The Orchestrator never writes code to `projectPath`. Every change, no matter how trivial, must go through the full task → RD → specialist agent → QA cycle. This prevents the Orchestrator from short-circuiting the pipeline.

| Agent | Hard constraint |
|-------|-----------------|
| Orchestrator | Never touches `projectPath`. Never writes code. |
| Project Manager | Never creates tasks. Only scopes and delegates. |
| Research Agent | Never creates tasks. Cites all sources. Re-uses reports < 30 days old. |
| Specialist agents | One task per session. Set own status. Never touch other agents' data.json. |
| QA Tester | Cannot approve their own work. Archives on pass, fails on miss. |

---

## Skills System

Skills are Markdown files that encode **step-by-step workflows**. They are the procedural memory of each agent.

### Shared skills (`_skills/`)

Available to every agent:

| Skill | Purpose |
|-------|---------|
| `skill_prep.md` | Clarify a fuzzy task; tighten the RD |
| `skill_run.md` | Execute a single in-progress task |
| `skill_review.md` | Review completed work against RD criteria |
| `skill_wrap.md` | Summarize changes, save decisions, clean up |
| `skill_request_research.md` | Drop a research request in the inbox |
| `skill_declare_research.md` | Declare pre-dev research needs (used by PM on agents' behalf) |
| `skill_handoff.md` | Write a handoff note for the receiving agent |
| `skill_standup.md` | Generate a concise team status summary |

### Agent-specific skills (`team/<role>/skills/`)

Encoded as `skill_<name>.md`. Examples:
- `team/orchestrator/skills/skill_start.md` — the full 5-phase pipeline
- `team/orchestrator/skills/skill_parallel_dispatch.md` — round-based parallel dispatch algorithm
- `team/orchestrator/skills/skill_qa_rework.md` — rework cycle when QA fails tasks
- `team/research/skills/skill_predev_research.md` — batch pre-dev research execution

The board exposes all skills via `/api/skills`, making them readable from the UI.

---

## Project Setup Mechanics

### `setup.ps1` — One-Time Global Install

1. Pulls the latest changes from `origin` (or `internal` remote if present)
2. Sets `AGENT_TEAM_PATH` as a permanent user environment variable pointing to the repo root
3. Copies `.github/agents/raava.agent.md` to `~/.copilot/agents/raava.agent.md` — this installs Raava as a global Copilot CLI agent accessible from any directory via `/agent`
4. Ensures Python is installed (installs via winget if missing)
5. Creates a Python venv in `ui/venv` and pre-installs Flask dependencies so the board launches instantly

### Per-Project Setup

Two scripts handle attaching the agent team to a project:

**`scripts/new-project.ps1`** (new codebase):
- Copies the entire template to `<Destination>/<ProjectName>-agents/`
- Clears all `data.json` backlogs (empty `backlog` and `archive` arrays)
- Resets all `memory.md` files
- Updates the board title in `index.html`
- Writes `project.json` with `name`, `projectPath`, `agentsPath`, `created`

**`scripts/link-project.ps1`** (existing codebase):
- Same as above, but if the agents folder already exists, it updates template files without clearing `data.json` or `memory.md` (preserves existing work)

### `project.json`

The single configuration file that ties a Copilot session to a project:

```json
{
  "name": "my-app",
  "projectPath": "C:\\projects\\my-app",
  "agentsPath": "C:\\projects\\my-app-agents",
  "created": "2026-04-07"
}
```

Every agent reads `project.json` at the start of their session to know where to read and write code.

---

## Dependency Graph: How Tasks Stay Ordered

The `depends_on` field on a task is an array of task IDs from any agent:

```json
{
  "id": 17003,
  "title": "Build user profile API",
  "depends_on": [17001, 17002],
  ...
}
```

The parallel dispatcher (`skill_parallel_dispatch.md`) resolves this by:
1. Checking the status of each dependency ID across all agents' `data.json` files
2. Only launching a task when every listed dependency is `"review"` or `"archived"`
3. Never bundling multiple tasks into one agent — one fresh context window per task

This gives the system true dependency-aware parallelism without a scheduler or queue.

---

## Custom Agent Names

Agents display their role names by default. To customize (e.g., give your team human names):

1. Copy `agent-names-example.json` → `agent-names.json`
2. Edit the names (e.g., `"backend-dev": "Jordan"`)
3. `agent-names.json` is gitignored — stays local to your machine

The orchestrator is always named **Raava** regardless of this file.

---

## Adding a New Agent Role

A template exists at `_templates/agent-template/`:
- `AGENTS.md` — define the persona, responsibilities, hard rules
- `COPILOT.md` — Copilot-specific instructions (usually `See AGENTS.md.`)
- `data.json` — empty backlog
- `memory.md` — empty memory

Steps to add:
1. Copy `_templates/agent-template/` to `team/<new-role>/`
2. Add a `skills/` folder with any role-specific skill files
3. Register the agent in `ui/server.py`'s `REPOS` dict
4. Add the role to the Orchestrator's "Where to Write Tasks" table in `team/orchestrator/AGENTS.md`
5. Update the PM's roster guidance in `team/project-manager/AGENTS.md`

---

## Security & Safety Constraints

- **No secrets in files.** `.env` is used for any credentials; `.gitignore` excludes it.
- **No Playwright MCP.** Browser automation tests are written as `.spec.ts` files run via `npx playwright test` — no live browser tool calls.
- **Path traversal protection.** `server.py`'s `/api/file` endpoint resolves the requested path and checks `path.relative_to(BASE_DIR)` before serving — rejects anything outside the repo.
- **The Orchestrator reads but never writes `projectPath`.** This is enforced by the agent's instructions, not code — it is a behavioral constraint.

---

## Summary: Key Design Principles

| Principle | How it's implemented |
|-----------|---------------------|
| Single source of truth | `data.json` per agent; no external DB |
| No central scheduler | Round-based dispatch reads file state |
| Research before code | Phase 2.5 is a hard blocker; checked via `memory.md` |
| Separation of concerns | Each agent has one job; hard rules prevent scope creep |
| Model-agnostic | All logic is Markdown instructions; no API calls to a specific LLM |
| Local-first | Board, storage, and execution all run on the developer's machine |
| Auditability | Every decision, task, and research finding is a file you can read |
