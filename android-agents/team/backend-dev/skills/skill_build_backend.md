# Skill: build_backend

Use this when implementing any backend work: HTTP endpoints, service logic, background workers, or data access layers.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

---

## Phase 1: Plan — Set up before writing

1. Read the RD and the endpoint/service contract fully. Do not deviate from the specified schema.
2. Identify all dependencies:
   - DB models / repositories (use DBA-approved schema — do not invent tables or columns)
   - Auth middleware and required roles
   - External services or queues this code calls
   - Shared utilities (logging, error handling, config)
3. Confirm the route/handler does not already exist. Check the router/controller/function index.
4. List the Playwright API test cases you will write in Phase 3:
   - Happy path (valid input → expected success response)
   - Each error case from the contract
   - Auth-gated paths: valid token, expired token, no token, wrong role
   - Edge cases: empty arrays, max-length strings, boundary values
5. Estimate if any DB migration is needed — if yes, request DBA Agent to provide the migration before starting Phase 2.

---

## Phase 2: Build — Write the implementation

### 2a. Input validation (always first)

Validate all inputs at the boundary before any business logic runs.

```typescript
// Example — validate at the entry point, not deep inside service logic
if (!body.name || typeof body.name !== 'string' || body.name.length > 255) {
  return res.status(400).json({ error: 'name is required and must be 1-255 characters', code: 'VALIDATION_ERROR' });
}
```

- Reject invalid requests with the correct 4xx status and `{ error, code }` body.
- Never pass unvalidated input to the DB layer.

### 2b. Auth and authorization

- Apply auth middleware exactly as specified in the endpoint contract.
- Check roles/permissions after authentication — return 403 (not 401) for authorization failures.
- Never make auth conditional on environment (`if (dev) skip auth`) — test environments use valid test tokens.

### 2c. Business logic

- Keep route handlers/controllers thin — delegate to a service or use-case layer.
- Never write SQL or ORM queries directly in a handler. Use a repository/data-access layer.
- All DB access must use the DBA-approved schema. Do not add columns or tables here.
- Handle upstream/external service failures gracefully — catch errors, log them, return 500 with `INTERNAL_ERROR`.

### 2d. Response formatting

- Return responses that exactly match the success schema in the RD.
- Use consistent HTTP status codes:
  - `200 OK` — read operations
  - `201 Created` — resource creation (include `Location` header where applicable)
  - `204 No Content` — successful delete or no-body update
  - `400` — client validation error
  - `401` — authentication required
  - `403` — authenticated but not authorized
  - `404` — resource not found
  - `409` — conflict (duplicate, stale data)
  - `429` — rate limited
  - `500` — unexpected server error

### Standard error shape (all surfaces)
```json
{ "error": "Human-readable message", "code": "SCREAMING_SNAKE_CASE" }
```

### 2e. Logging and observability

- Log at structured JSON: `{ level, message, correlationId, userId, ...context }`.
- Log request entry (INFO) and errors (ERROR with stack trace).
- Never log passwords, tokens, or PII.

---

## Phase 3: Test — Write and run Playwright API tests

Save tests to `output/tests/<feature-slug>.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('POST /api/v1/resources', () => {

  test('201: valid input creates resource', async ({ request }) => {
    const res = await request.post('/api/v1/resources', {
      headers: { Authorization: `Bearer ${process.env.TEST_TOKEN}` },
      data: { name: 'My Resource', categoryId: 1 },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('My Resource');
  });

  test('400: missing required field returns VALIDATION_ERROR', async ({ request }) => {
    const res = await request.post('/api/v1/resources', {
      headers: { Authorization: `Bearer ${process.env.TEST_TOKEN}` },
      data: { categoryId: 1 }, // missing name
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).code).toBe('VALIDATION_ERROR');
  });

  test('401: missing token returns 401', async ({ request }) => {
    const res = await request.post('/api/v1/resources', {
      data: { name: 'My Resource', categoryId: 1 },
    });
    expect(res.status()).toBe(401);
  });

  test('403: wrong role returns 403', async ({ request }) => {
    const res = await request.post('/api/v1/resources', {
      headers: { Authorization: `Bearer ${process.env.READONLY_TOKEN}` },
      data: { name: 'My Resource', categoryId: 1 },
    });
    expect(res.status()).toBe(403);
  });

  test('404: non-existent categoryId returns NOT_FOUND', async ({ request }) => {
    const res = await request.post('/api/v1/resources', {
      headers: { Authorization: `Bearer ${process.env.TEST_TOKEN}` },
      data: { name: 'My Resource', categoryId: 99999 },
    });
    expect(res.status()).toBe(404);
    expect((await res.json()).code).toBe('NOT_FOUND');
  });
});
```

Run:
```bash
npx playwright test output/tests/<feature-slug>.spec.ts --reporter=html
```

### Pre-review quality checklist
- [ ] All input fields validated (type, required, length/format/range)
- [ ] Error responses match `{ error, code }` on all paths
- [ ] No secrets or credentials in code
- [ ] OpenAPI spec updated (`skill_openapi_spec.md`)
- [ ] Playwright tests pass: happy path + every error case + auth scenarios
- [ ] No direct SQL or table access from the handler layer
- [ ] Structured logging in place (no raw `console.log`)
- [ ] DBA-approved schema used — no ad-hoc columns or tables

---

## Phase 4: Iterate — Refine from review feedback

1. Read review comments from Architect or QA in `memory.md`.
2. Address each comment with a targeted change — no scope creep.
3. Re-run the Playwright tests after each change:
   ```bash
   npx playwright test output/tests/<feature-slug>.spec.ts
   ```
4. If review changes the contract, update the RD and OpenAPI spec first, then the code.
5. Set task back to `review` once all comments are resolved.
