import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { request } from 'http';
import type { Server } from 'http';
import { mockClient } from 'aws-sdk-client-mock';
import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

const sqsMock = mockClient(SQSClient);
sqsMock.on(ReceiveMessageCommand).callsFake(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { Messages: [] };
});

const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

describe('server', () => {
  let server: Server;
  let messageEmitter: any;

  beforeAll(async () => {
    vi.stubEnv('QUEUE_URL', 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue');
    vi.stubEnv('PORT', PORT.toString());
    
    const serverModule = await import('./server');
    server = serverModule.default;
    messageEmitter = serverModule.messageEmitter;
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server failed to start')), 5000);
      const checkServer = setInterval(() => {
        if (server.listening) {
          clearInterval(checkServer);
          clearTimeout(timeout);
          resolve();
        }
      }, 10);
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
    vi.unstubAllEnvs();
    sqsMock.reset();
  });

  it('serves HTML on GET /', async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html');
    const html = await res.text();
    expect(html).toContain('SQS Server-Sent Events');
  });

  it('returns health status on GET /health', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: 'ok' });
  });

  it('returns 404 for unknown routes', async () => {
    const res = await fetch(`${BASE_URL}/unknown`);
    expect(res.status).toBe(404);
  });

  it('streams SSE events from SQS messages', async () => {
    await new Promise<void>((resolve, reject) => {
      const req = request(`${BASE_URL}/events`, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('text/event-stream');

        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
          if (data.includes('test message')) {
            req.destroy();
            expect(data).toContain('data: test message');
            resolve();
          }
        });
      });
      req.on('error', (err) => {
        if (err.message === 'socket hang up') resolve();
        else reject(err);
      });
      req.end();

      setTimeout(() => {
        messageEmitter.emit('message', 'test message');
      }, 100);

      setTimeout(() => reject(new Error('Test timeout')), 2000);
    });
  });
});
