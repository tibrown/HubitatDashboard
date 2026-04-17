# Skill: function_app

Use this when building a serverless function, Azure Function App, background worker, or event-driven processor.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

---

## Phase 1: Plan — Define the function before building

1. Read the RD completely. Confirm the following are documented:
   - **Trigger type**: HTTP, Timer (cron), Service Bus, Event Hub, Blob, Queue, etc.
   - **Input binding**: what data arrives and in what format.
   - **Output binding**: what is produced (response body, queue message, blob, DB write).
   - **Processing logic**: what the function does with the input.
   - **Error handling**: what happens on failure — dead-letter queue, retry policy, alert.
   - **Idempotency**: can the function safely process the same message twice?
   - **Concurrency**: how many instances may run simultaneously? Any ordering constraints?
   - **Secrets**: what environment variables or Key Vault references does it need?

2. If any of the above is unclear, request clarification before writing code.

3. If DB access is needed: check with DBA Agent for the approved schema and access pattern.

4. Identify testability:
   - HTTP trigger → testable with Playwright `request` fixture.
   - Non-HTTP trigger → isolate business logic into a pure function, test that directly; test the trigger handler with a thin wrapper test.

---

## Phase 2: Build — Implement the function

### 2a. Structure

Follow single-responsibility: the trigger handler is a thin adapter that validates input, calls a service function, and maps the result to an output.

```typescript
// Azure Function — HTTP trigger (isolated worker model, .NET 9 / Node.js equivalent)

// handler.ts — thin trigger adapter
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { processOrder } from '../services/orderService';

app.http('ProcessOrder', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    ctx.log('ProcessOrder triggered');
    const body = await req.json() as { orderId: string };

    if (!body?.orderId) {
      return { status: 400, jsonBody: { error: 'orderId is required', code: 'VALIDATION_ERROR' } };
    }

    try {
      const result = await processOrder(body.orderId);
      return { status: 200, jsonBody: result };
    } catch (err) {
      ctx.error('processOrder failed', err);
      return { status: 500, jsonBody: { error: 'Unexpected error', code: 'INTERNAL_ERROR' } };
    }
  },
});
```

```typescript
// orderService.ts — pure business logic, easily unit-tested
export async function processOrder(orderId: string): Promise<{ status: string }> {
  // No Azure SDK imports here — inject dependencies
  const order = await orderRepository.findById(orderId);
  if (!order) throw new NotFoundError(`Order ${orderId} not found`);
  // ...
  return { status: 'processed' };
}
```

### 2b. Configuration

- All connection strings, API keys, and secrets from environment variables or Key Vault references in `local.settings.json` (never committed) and Azure App Settings.
- `local.settings.json` entries are mirrored in `.env.example` for documentation.

### 2c. Idempotency

If the trigger can deliver a message more than once (Service Bus, Event Hub, Queue):
- Check if the work is already done before processing.
- Use a deduplication key (message ID, correlation ID) to skip duplicates.
- Log skip decisions explicitly.

### 2d. Dead-lettering and alerting

- If processing fails after retries, let the message dead-letter (do not swallow exceptions silently).
- Log a structured error entry that an alert rule can target.
- Document the dead-letter queue location in `memory.md`.

---

## Phase 3: Test — Write and run tests

### For HTTP-triggered functions
```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.FUNCTION_BASE_URL ?? 'http://localhost:7071';

test.describe('ProcessOrder function', () => {

  test('200: valid orderId processes successfully', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ProcessOrder`, {
      headers: { 'x-functions-key': process.env.FUNCTION_KEY ?? '' },
      data: { orderId: 'ORD-001' },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe('processed');
  });

  test('400: missing orderId returns VALIDATION_ERROR', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ProcessOrder`, {
      headers: { 'x-functions-key': process.env.FUNCTION_KEY ?? '' },
      data: {},
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).code).toBe('VALIDATION_ERROR');
  });

  test('404: non-existent orderId returns NOT_FOUND', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ProcessOrder`, {
      headers: { 'x-functions-key': process.env.FUNCTION_KEY ?? '' },
      data: { orderId: 'DOES-NOT-EXIST' },
    });
    expect(res.status()).toBe(404);
  });
});
```

Run against local func runtime:
```bash
# Start function app locally
func start

# In another terminal
npx playwright test output/tests/process-order.spec.ts --reporter=html
```

### For non-HTTP triggers (Service Bus, Timer, etc.)

Test the service layer directly; write a thin integration test against a local emulator where available (Azurite for Storage/Queue).

### Pre-review quality checklist
- [ ] Trigger handler is thin — delegates to service layer immediately
- [ ] All inputs validated before any processing
- [ ] All secrets from environment variables or Key Vault — nothing hardcoded
- [ ] Idempotency handled if trigger can deliver duplicates
- [ ] All error paths return structured `{ error, code }` or dead-letter appropriately
- [ ] Structured logging present (log entry on trigger, log error on failure)
- [ ] Playwright tests cover: success, validation failure, not-found, and upstream error
- [ ] Dead-letter queue and retry policy documented in RD and `memory.md`

---

## Phase 4: Iterate — Refine from review or runtime findings

1. Tune retry counts and backoff based on real execution behavior.
2. Refine idempotency checks if duplicates are encountered in testing.
3. Add more structured log fields as observability needs emerge.
4. If the trigger contract changes, update the RD and any integration tests before touching code.
