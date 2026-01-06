#!/bin/bash
set -e

REGION=${AWS_REGION:-eu-west-2}
STACK_NAME=sqs-sse-queue

echo "Getting queue URL..."
QUEUE_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[0].OutputValue' \
  --output text)

echo "Sending messages to $QUEUE_URL..."
aws sqs send-message --queue-url $QUEUE_URL --message-body "Hello from SQS!" --region $REGION
aws sqs send-message --queue-url $QUEUE_URL --message-body "Message 2" --region $REGION
aws sqs send-message --queue-url $QUEUE_URL --message-body "Message 3" --region $REGION

echo "Sent 3 messages"
