# Skill: epic_breakdown

Use this when a request is too large to fit in a single task.

## What is an epic?
An epic is any request where the work spans multiple agents, multiple sessions,
or cannot be verified in a single review step.

## How to break it down

1. Write the epic in one sentence: "Build X so that Y."
2. Identify the layers: architecture → API → frontend → tests.
3. For each layer, ask: "What is the smallest piece the agent can deliver and verify independently?"
4. Write one task per piece. Each task must:
   - Have a single, checkable done criterion.
   - Be assignable to exactly one agent.
   - Be completable in one focused session.
5. Sequence the tasks: whenever task B cannot start until task A is done, set `"depends_on": [<id of A>]` in task B. This drives parallel scheduling — tasks with no shared dependencies will run in parallel automatically.
6. Create each task using `skill_create_task.md`.

## Red flags — split further if:
- The task has more than one done criterion.
- Two different agents both need to edit the same file.
- You cannot describe "done" in two sentences.

## Example breakdown

Epic: "Add user authentication"

Tasks:
- [architect] Design auth strategy and write ADR (no code yet)
- [api-dev] Implement login endpoint with JWT issuance
- [api-dev] Implement token refresh and logout endpoints
- [api-dev] Write OpenAPI spec for auth endpoints
- [frontend-dev] Build login form component
- [frontend-dev] Add auth token storage and route guards
- [qa-tester] Write test plan for auth flows
- [qa-tester] Execute regression suite on auth
