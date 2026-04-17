# Skill: design_endpoint

Use this before writing any code for a new HTTP endpoint or service contract.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

---

## Phase 1: Analyze — Understand the requirement

1. Read the linked RD completely before touching anything.
2. Answer these questions before writing a single line of design:
   - What business need does this endpoint fulfill?
   - Who calls it — frontend, external client, another service, a function app?
   - What data does it read or write? Does a DB schema exist for it (check with DBA Agent)?
   - What are the auth and permission requirements?
   - What are all the failure modes (client errors, upstream failures, timeouts)?
3. If any answer is unclear, request clarification from the Orchestrator or PM before proceeding.
4. Check if an existing endpoint can be extended rather than creating a new one.

---

## Phase 2: Design — Write the contract

Write the full endpoint contract into the RD under `## Endpoint Design` before writing code.

```markdown
## Endpoint Design

**Method + Path:** POST /api/v1/resource
**Auth:** Bearer JWT (roles: admin, user)
**Rate limit:** 10 requests per minute per user

### Request body
| Field       | Type    | Required | Constraints                |
|-------------|---------|----------|----------------------------|
| name        | string  | yes      | 1–255 characters           |
| categoryId  | integer | yes      | must exist in categories   |
| description | string  | no       | max 2000 characters        |

### Success response — 201 Created
| Field | Type    | Description              |
|-------|---------|--------------------------|
| id    | integer | Newly created record ID  |
| name  | string  | Confirmed name           |

### Error responses
| Status | Code                | Condition                           |
|--------|---------------------|-------------------------------------|
| 400    | VALIDATION_ERROR    | Missing/malformed fields            |
| 401    | UNAUTHORIZED        | Missing or invalid token            |
| 403    | FORBIDDEN           | Authenticated but insufficient role |
| 404    | NOT_FOUND           | Referenced resource does not exist  |
| 409    | CONFLICT            | Duplicate entry                     |
| 429    | RATE_LIMITED        | Too many requests                   |
| 500    | INTERNAL_ERROR      | Unexpected server error             |

### Side effects
- Writes one row to `resources` table (DBA schema: rds/schema-resources.md)
- Emits `resource.created` event to Service Bus topic
```

If the design involves a new DB table or column: **stop and request DBA Agent review before proceeding.**
If the design involves auth changes or a new external service: **request Architect review.**

---

## Phase 3: Verify — Validate the design before building

- [ ] All input fields are validated (type, format, required, length/range).
- [ ] Every error case has an explicit status code and `{ error, code }` body.
- [ ] Auth is explicitly stated (not assumed).
- [ ] Side effects are fully listed (DB writes, cache, events, emails, queues).
- [ ] No field names conflict with existing endpoints (check OpenAPI spec).
- [ ] Rate limiting considered where appropriate.
- [ ] DBA Agent consulted if new/modified DB access is needed.
- [ ] Architect consulted if auth, external services, or cross-cutting concerns are involved.

---

## Phase 4: Iterate — Refine before or during implementation

1. If implementation reveals a design issue, update the RD contract first, then the code.
2. If the Architect or DBA requests a design change, update the contract in the RD before touching code.
3. Never silently diverge from the design — spec and implementation must stay in sync.
4. Document any trade-offs in `memory.md`.
