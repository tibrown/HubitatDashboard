import type { FastifyInstance } from 'fastify';
import { updateDeviceAttribute, setCachedHubVar } from './cache.js';
import { addClient, removeClient, broadcast } from './sse.js';
import type { SSEEvent } from './types.js';

interface HubitatEventContent {
  deviceId?: string;
  displayName?: string;
  name?: string;
  value?: string | number | null;
  source?: string;
}

interface HubitatWebhookBody {
  content?: HubitatEventContent;
}

export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/webhook — receives Hubitat push events
  fastify.post<{ Body: HubitatWebhookBody }>(
    '/api/webhook',
    async (req, reply) => {
      const content = req.body?.content;
      if (!content) return reply.send({ ok: true });

      const { deviceId, name, value, source } = content;

      // Handle HSM status events (source may differ)
      if (name === 'hsmStatus' && value !== undefined) {
        const event: SSEEvent = {
          deviceId: 'hsm',
          attribute: 'hsmStatus',
          value: value ?? null,
          timestamp: Date.now(),
        };
        broadcast(event);
        return reply.send({ ok: true });
      }

      // Handle mode change events
      if (name === 'mode' && value !== undefined) {
        const event: SSEEvent = {
          deviceId: 'mode',
          attribute: 'mode',
          value: value ?? null,
          timestamp: Date.now(),
        };
        broadcast(event);
        return reply.send({ ok: true });
      }

      // Handle hub variable push events (sent by Hubitat apps via pushHubVarToDashboard)
      if (deviceId === 'hubvar' && name && value !== undefined) {
        // Cache so page refreshes get the latest value without needing Maker API exposure
        if (value !== null) setCachedHubVar(name, value as string | number);
        const event: SSEEvent = {
          deviceId: 'hubvar',
          attribute: name,
          value: value ?? null,
          timestamp: Date.now(),
        };
        broadcast(event);
        return reply.send({ ok: true });
      }

      // Handle Maker API location events — hub variable changes arrive with source=LOCATION and no deviceId
      if (source === 'LOCATION' && !deviceId && name && value !== undefined) {
        if (value !== null) setCachedHubVar(name, value as string | number);
        const event: SSEEvent = {
          deviceId: 'hubvar',
          attribute: name,
          value: value ?? null,
          timestamp: Date.now(),
        };
        broadcast(event);
        return reply.send({ ok: true });
      }

      // Regular device events
      if (!deviceId || !name || value === undefined) {
        return reply.send({ ok: true });
      }

      updateDeviceAttribute(deviceId, name, value);

      const event: SSEEvent = {
        deviceId,
        attribute: name,
        value: value ?? null,
        timestamp: Date.now(),
      };
      broadcast(event);

      return reply.send({ ok: true });
    }
  );

  // GET /api/events — SSE streaming endpoint
  fastify.get('/api/events', async (req, reply) => {
    const clientId = crypto.randomUUID();
    addClient(clientId, reply);

    req.raw.on('close', () => {
      removeClient(clientId);
    });

    // addClient handles headers and keeps connection open via reply.hijack()
    // No explicit return needed — connection is kept alive by reply.raw
  });
}
