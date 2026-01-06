#!/bin/bash
set -e

REGION=${AWS_REGION:-eu-west-2}
STACK_NAME=sqs-sse-queue

echo "Deploying SQS queue..."
aws cloudformation deploy \
  --template-file queue.yaml \
  --stack-name $STACK_NAME \
  --region $REGION

echo "Getting queue URL..."
QUEUE_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[0].OutputValue' \
  --output text)

echo "Queue URL: $QUEUE_URL"
echo ""
echo "Starting server..."
export QUEUE_URL=$QUEUE_URL
npm run dev
