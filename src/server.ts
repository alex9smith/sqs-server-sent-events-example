import { createServer } from 'http';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqs = new SQSClient({});
const QUEUE_URL = process.env.QUEUE_URL!;
const PORT = parseInt(process.env.PORT || '3000');

let html = '<html><body><h1>SQS Server-Sent Events</h1></body></html>';
const htmlPath = join(__dirname, 'index.html');
if (existsSync(htmlPath)) {
  html = readFileSync(htmlPath, 'utf-8');
}

const server = createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.url === '/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    let active = true;
    const poll = async () => {
      while (active && !res.destroyed) {
        try {
          const { Messages } = await sqs.send(new ReceiveMessageCommand({
            QueueUrl: QUEUE_URL,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
          }));

          if (Messages) {
            for (const msg of Messages) {
              res.write(`data: ${msg.Body}\n\n`);
              await sqs.send(new DeleteMessageCommand({
                QueueUrl: QUEUE_URL,
                ReceiptHandle: msg.ReceiptHandle,
              }));
            }
          }
        } catch (err) {
          break;
        }
      }
    };

    req.on('close', () => {
      active = false;
      res.end();
    });
    poll();
  } else if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

export default server;
