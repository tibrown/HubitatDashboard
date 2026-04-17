# Skill: integration

Use this when connecting the backend to a third-party service, external API, or internal platform service (Service Bus, Key Vault, blob storage, OAuth provider, payment processor, etc.).

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

---

## Phase 1: Plan — Understand the integration

1. Read the RD. Confirm the following are documented before writing any code:
   - **What** service is being integrated (name, version, environment URLs).
   - **Why** — what business capability does this unlock?
   - **Auth method** — API key, OAuth 2.0, managed identity, SAS token, connection string.
   - **Data contract** — request and response schemas from the external service.
   - **Error modes** — what errors the external service returns and how to handle them.
   - **Rate limits and quotas** — calls per minute/hour, payload size limits.
   - **Retry and timeout policy** — when to retry, how many times, with what backoff.

2. If the external service contract is not documented in the RD, use `/request-research` to have the Research Agent find the current official documentation before proceeding.

3. Confirm all credentials and config values will come from environment variables or Key Vault. Never hardcode.

4. Assess failure modes:
   - External service is down → return degraded response or queue for retry?
   - Rate limited → backoff and retry or surface 429 to caller?
   - Partial failure → rollback, compensate, or accept inconsistency?

---

## Phase 2: Build — Implement the integration

### 2a. Client/SDK setup

- Use the official SDK where one exists. Do not hand-roll HTTP clients for well-supported services.
- Configure the client once, in a factory or DI registration — do not instantiate per-request.
- All config (base URLs, credentials, timeouts) from environment variables or Key Vault refs.

```typescript
// Example: Azure Service Bus client (singleton)
import { ServiceBusClient } from '@azure/service-bus';

export function createServiceBusClient(): ServiceBusClient {
  const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
  if (!connectionString) throw new Error('SERVICE_BUS_CONNECTION_STRING is not set');
  return new ServiceBusClient(connectionString);
}
```

### 2b. Isolation — wrap behind an interface

Always wrap the third-party client behind a local interface/service class. This enables:
- Unit testing without hitting the real service
- Swapping the provider without touching business logic
- Consistent error translation

```typescript
export interface INotificationService {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class SendGridNotificationService implements INotificationService {
  async send(to: string, subject: string, body: string): Promise<void> {
    // SendGrid-specific implementation here
  }
}
```

### 2c. Error handling and resilience

- Catch external service exceptions at the integration boundary.
- Translate external errors to your internal error shape — never let SDK-specific errors leak to callers.
- Implement retry with exponential backoff for transient failures (5xx, network timeouts).
- Circuit breaker pattern for high-volume integrations where downstream instability should not cascade.

```typescript
// Translate external error to internal shape
try {
  await externalService.doSomething();
} catch (err) {
  if (isTransientError(err)) {
    throw new ServiceUnavailableError('External service temporarily unavailable', 'UPSTREAM_UNAVAILABLE');
  }
  logger.error('External service error', { err });
  throw new InternalError('Unexpected error from external service', 'INTERNAL_ERROR');
}
```

### 2d. Observability

- Log every outbound call: service name, operation, duration, success/failure.
- Include correlation IDs in outbound requests where the service supports it.
- Track integration errors separately from internal errors in monitoring.

---

## Phase 3: Test — Write and run integration tests

For integrations, write two layers of tests:

**1. Unit tests (mock the external service)**
```typescript
import { test, expect } from '@playwright/test';

// Use environment variable to point at a local mock server or test environment
test.describe('NotificationService', () => {
  test('sends email with correct payload', async ({ request }) => {
    // Point TEST_NOTIFICATION_URL at a mock/stub server
    const res = await request.post(`${process.env.TEST_NOTIFICATION_URL}/send`, {
      data: { to: 'test@example.com', subject: 'Test', body: 'Hello' },
    });
    expect(res.status()).toBe(200);
  });

  test('handles upstream 500 gracefully', async ({ request }) => {
    // Mock server returns 500; verify caller gets UPSTREAM_UNAVAILABLE
    const res = await request.post('/api/v1/notify', {
      headers: { Authorization: `Bearer ${process.env.TEST_TOKEN}` },
      data: { userId: 1, message: 'Hello' },
    });
    expect(res.status()).toBe(503);
    expect((await res.json()).code).toBe('UPSTREAM_UNAVAILABLE');
  });
});
```

**2. Smoke test against real sandbox/test environment (when available)**
- Run against the service's sandbox or staging environment.
- Flag these tests with a tag so they can be skipped in CI without sandbox credentials.

Run:
```bash
npx playwright test output/tests/<integration-slug>.spec.ts --reporter=html
```

### Pre-review quality checklist
- [ ] External service contract fully documented in the RD
- [ ] Client/SDK configured once and injected — not instantiated per-request
- [ ] Integration wrapped behind a local interface
- [ ] All credentials from environment variables or Key Vault — nothing hardcoded
- [ ] Retry, timeout, and backoff policy implemented for transient errors
- [ ] External errors caught and translated to internal error shape
- [ ] Structured logging for outbound calls
- [ ] Playwright tests cover: success, upstream error, and auth failure scenarios

---

## Phase 4: Iterate — Refine from review or runtime findings

1. If the external service behaves differently than documented, update the RD contract first.
2. Tune retry/timeout policies based on real latency observations.
3. Add additional error translation cases as they are discovered.
4. Document any undocumented external service behaviors in `memory.md`.
