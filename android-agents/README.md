<p align="center">
  <img src="Raava-icon.png" alt="Raava" width="120">
</p>

# Raava — Dev Team Agent System

An autonomous multi-agent development team that runs the full SDLC from a single prompt — planning, research, coding, and QA — with a live Kanban board that opens automatically as a standalone app window.

## The Team

| Agent | Role |
|-------|------|
| **Raava** (Orchestrator) | Runs the whole pipeline. The only one who creates tasks. |
| Project Manager | Scopes tasks, sets priority, builds the agent roster |
| Research | Verifies library versions and APIs before any code is written |
| Architect | Architecture decisions and code review |
| DBA | Database schema design and migrations |
| Backend Dev | APIs, services, integrations |
| Frontend Dev | UI components, layouts, accessibility |
| QA Tester | Test plans, Playwright specs, bug reports |

> Agent display names default to their role. Copy `agent-names-example.json` → `agent-names.json` to give them custom names on your local board.

---

## New Machine Setup (do this once)

### Prerequisites
- [GitHub Copilot CLI](https://githubnext.com/projects/copilot-cli) with an active Copilot subscription
- [Git](https://git-scm.com/)
- [Python 3.x](https://python.org)
- Chrome or Edge (for the standalone board window)

### 1. Clone the repo

```powershell
git clone https://github.com/MotleyRice-Dev-Org/dev-Agent-RaavaOrchestrator.git C:\projects\Raava
```

### 2. Run setup

```powershell
cd C:\projects\Raava
.\setup.ps1
```

That's it. Setup will:
- Pull the latest changes from the remote repo
- Set `AGENT_TEAM_PATH` permanently (so Raava can find itself from any folder)
- Install Raava as a global Copilot CLI agent (available via `/agent` from any directory)
- Pre-install board dependencies (so the board launches instantly when you start a project)

> **Updating:** Re-run `.\setup.ps1` at any time to pull the latest version and reinstall the agent.

---

## Starting a Project

Open a **new terminal** (so `AGENT_TEAM_PATH` is picked up), `cd` into any project folder, then launch Copilot CLI:

```powershell
cd C:\projects\MyProject
copilot
```

Then:

```
/agent
```

Select **Raava**, type **/yolo** *DO NOT USE AUTOPILOT* then describe what you want to build:

> - *"Build a REST API for managing invoices at C:\projects\InvoiceAPI"*
> - *"Add a login page to my existing app at C:\projects\MyApp"*
> - *"New project: a mobile-first CRM at C:\projects\CRM"*
> - *"Reference the plan.md in this project and build it out"*

Raava handles everything from there:
1. Sets up the project workspace
2. **Automatically opens the project's Kanban board as a standalone app window**
3. Runs the full pipeline (PM → Research → Dev agents → QA) in parallel
4. Delivers a standup summary when done

No further input needed between start and standup.

---

## Manual Board Control

To start the board manually for an existing project:

```powershell
$env:AGENT_TEAM_PATH\scripts\start-dashboard.ps1 -AgentsPath "C:\projects\MyApp-agents"
```

To attach Raava to an existing codebase without using the agent:

```powershell
cd C:\projects\Raava
.\scripts\link-project.ps1 -ProjectPath "C:\projects\MyExistingApp" -Launch
```

To scaffold a brand new project folder and open the board immediately:

```powershell
cd C:\projects\Raava
.\scripts\new-project.ps1 -ProjectName "my-app" -Destination "C:\projects" -Launch
```

---

## Kanban Board

The board auto-refreshes as agents work. Tasks move through:

```
Todo → Scoped → In Progress → Review → Archived
```

When all tasks are complete, the board shows a **Project Complete** banner.

If port `8765` is already in use:

```powershell
$env:OPEN_ZEU_PORT = "8877"
.\scripts\start-dashboard.ps1 -AgentsPath "C:\projects\MyApp-agents" -Port 8877
```

