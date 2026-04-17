# Skill: design_endpoint

Use this before writing any code for a new API endpoint.

## Phase 1: Analyze — Understand the requirement

1. Read the linked RD completely.
2. Answer these questions before touching a design:
   - What is the business need this endpoint fulfills?
   - Who calls it (frontend, external client, another service)?
   - What data does it read or write?
   - Are there auth/permission requirements?
   - What are the failure modes?
3. If any answer is unclear, request clarification from the Orchestrator or PM before proceeding.
4. Check if any existing endpoint can be extended rather than creating a new one.

---

## Phase 2: Design — Write the endpoint contract

Write the full design to the RD (under `## Endpoint Design`) before writing code.

```markdown
## Endpoint Design

**Method + Path:** POST /api/v1/users/login
**Auth:** None (public)
**Rate limit:** 5 requests per minute per IP

### Request body
| Field      | Type   | Required | Constraints          |
|------------|--------|----------|----------------------|
| email      | string | yes      | valid email format   |
| password   | string | yes      | 8–128 characters     |

### Success response — 200 OK
| Field | Type   | Description         |
|-------|--------|---------------------|
| token | string | Signed JWT, 1h TTY  |
| user  | object | { id, email, name } |

### Error responses
| Status | Code                | Condition                        |
|--------|---------------------|----------------------------------|
| 400    | VALIDATION_ERROR    | Missing or malformed fields      |
| 401    | INVALID_CREDENTIALS | Email/password mismatch          |
| 429    | RATE_LIMITED        | Too many attempts                |
| 500    | INTERNAL_ERROR      | Unexpected server error          |
```

Share the design with the Architect for review if it involves auth, new DB schemas, or external services.

---

## Phase 3: Verify — Validate the design before building

Walk through the design with these checks before writing implementation code:

- [ ] All required fields are validated (type, format, length).
- [ ] Every error case has a status code and a consistent error body shape.
- [ ] Auth is explicitly stated (not assumed).
- [ ] Side effects are listed (DB writes, cache invalidation, events, emails).
- [ ] No field names that conflict with existing endpoints (check OpenAPI spec).
- [ ] Rate limiting or throttling considered where appropriate.
- [ ] Design reviewed by Architect if it involves: new tables, auth changes, or external calls.

---

## Phase 4: Iterate — Refine before or during implementation

1. If implementation reveals an issue with the design, update the RD first, then the code.
2. If the Architect requests a design change, update the endpoint contract in the RD.
3. Do not diverge silently from the design — the OpenAPI spec and implementation must stay in sync.
4. Document any trade-offs made in `memory.md`.
