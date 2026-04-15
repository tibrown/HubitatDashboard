import type { FastifyReply } from 'fastify';
import type { SSEEvent } from './types.js';

const clients = new Map<string, FastifyReply>();

export function addClient(id: string, reply: FastifyReply): void {
  // Hijack the connection — Fastify v5 SSE pattern
  reply.hijack();

  // Set SSE headers on the raw response
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial comment to keep proxy connections alive
  reply.raw.write(': ok\n\n');

  clients.set(id, reply);

  // Remove client on disconnect
  reply.raw.on('close', () => {
    removeClient(id);
  });
}

export function removeClient(id: string): void {
  clients.delete(id);
}

export function broadcast(event: SSEEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const [id, reply] of clients) {
    try {
      reply.raw.write(data);
    } catch {
      // Client disconnected mid-write
      removeClient(id);
    }
  }
}

export function clientCount(): number {
  return clients.size;
}
