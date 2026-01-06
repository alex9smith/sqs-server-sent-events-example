#!/bin/bash
set -e

REGION=${AWS_REGION:-eu-west-2}
STACK_NAME=sqs-sse-queue

echo "Deleting SQS queue stack..."
aws cloudformation delete-stack \
  --stack-name $STACK_NAME \
  --region $REGION

echo "Stack deletion initiated. Waiting for completion..."
aws cloudformation wait stack-delete-complete \
  --stack-name $STACK_NAME \
  --region $REGION

echo "Queue deleted successfully"
