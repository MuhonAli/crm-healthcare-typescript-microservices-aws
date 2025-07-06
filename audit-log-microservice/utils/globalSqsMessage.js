import AWS from "aws-sdk";

export const sqs = new AWS.SQS({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  });

export const params = {
    QueueUrl: process.env.AWS_SQS_URL,
};