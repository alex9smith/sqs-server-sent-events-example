# SQS Server-sent Events example

An example implementation of a system which converts incoming messages on SQS to a server-sent events stream.

## Quick Start

1. Deploy the SQS queue and start the server:

```sh
npm ci
./start.sh
```

2. Open http://localhost:3000 in your browser

3. In another terminal, send test messages:

```sh
./send-messages.sh
```

You should see the messages appear in your browser in real-time.

4. Clean up when done:

```sh
./destroy.sh
```

## Local Development

Run locally with your AWS credentials:

```sh
export QUEUE_URL=https://sqs.eu-west-2.amazonaws.com/123456789012/your-queue-name
npm ci
npm run dev
```

Open http://localhost:3000 in your browser.

## Docker

Build and run with Docker:

```sh
docker build -t sqs-sse .
docker run -p 3000:3000 \
  -e QUEUE_URL=https://sqs.eu-west-2.amazonaws.com/123456789012/your-queue-name \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e AWS_REGION=eu-west-2 \
  sqs-sse
```

Open http://localhost:3000 in your browser.
