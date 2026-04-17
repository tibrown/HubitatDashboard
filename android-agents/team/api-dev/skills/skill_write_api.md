# Skill: write_api

Use this when implementing an endpoint that has already been designed (RD + endpoint contract exist).

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

## Phase 1: Plan — Set up before writing

1. Read the endpoint design in the RD. Do not deviate from the specified schema.
2. Identify all dependencies: DB models, auth middleware, external services.
3. Confirm the route does not already exist (check the router/controller index).
4. Write the list of Playwright API test cases you will write in Phase 3:
   - Happy path (valid input → expected success response)
   - Each error case from the design
   - Auth-gated routes: test with valid token, expired token, no token

---

## Phase 2: Implement — Write the endpoint

1. **Validate input** strictly at the boundary — before any business logic runs.
   Reject invalid requests with the correct 4xx status and `{ error, code }` body.

2. **Apply auth middleware** as specified in the endpoint design.

3. **Implement business logic** — keep handlers thin, delegate to service/model layer.

4. **Return responses** that exactly match the success schema in the RD.

5. **Handle all error cases** from the endpoint design — no unhandled exceptions.

6. **No secrets in code** — environment variables only.

### Standard error shape (all endpoints)
```json
{ "error": "Human-readable message", "code": "SCREAMING_SNAKE_CASE" }
```

---

## Phase 3: Test — Write and run Playwright API tests

Save tests to `output/tests/<endpoint-slug>.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('POST /api/v1/users/login', () => {

  test('200: valid credentials return token and user', async ({ request }) => {
    const res = await request.post('/api/v1/users/login', {
      data: { email: 'user@example.com', password: 'ValidPass1!' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(body.user).toMatchObject({ email: 'user@example.com' });
  });

  test('400: missing password returns VALIDATION_ERROR', async ({ request }) => {
    const res = await request.post('/api/v1/users/login', {
      data: { email: 'user@example.com' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  test('401: wrong password returns INVALID_CREDENTIALS', async ({ request }) => {
    const res = await request.post('/api/v1/users/login', {
      data: { email: 'user@example.com', password: 'WrongPass!' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('INVALID_CREDENTIALS');
  });

  test('401: protected route rejects missing token', async ({ request }) => {
    const res = await request.get('/api/v1/users/me');
    expect(res.status()).toBe(401);
  });
});
```

Run:
```bash
npx playwright test output/tests/<endpoint-slug>.spec.ts --reporter=html
```

### Pre-review quality checklist
- [ ] All request fields validated (type, required, length/format)
- [ ] Error responses match `{ error, code }` shape on all paths
- [ ] No secrets or credentials in code
- [ ] OpenAPI spec updated (run `skill_openapi_spec.md`)
- [ ] Playwright tests pass for happy path and every error case
- [ ] Auth applied where specified; tested with valid, invalid, and missing token

---

## Phase 4: Iterate — Refine from review feedback

1. Read review comments from Architect in `memory.md`.
2. Address each comment with a targeted change — avoid scope creep.
3. Re-run the Playwright API tests after each change:
   ```bash
   npx playwright test output/tests/<endpoint-slug>.spec.ts
   ```
4. If the review changes the endpoint contract, update the RD and OpenAPI spec first.
5. Set task back to `review` once all comments are resolved.

