import { SQSClient } from "@aws-sdk/client-sqs";

const isLambda = process.env.STAGE !== "dev";

// for rev sharing local testing, you need to add user
// credentials

//  credentials: {
//   accessKeyId: "AKIA...",
//   secretAccessKey: "xxx...",
// },
export const sqsClient = new SQSClient(
  isLambda
    ? {}
    : {
        endpoint: "http://localhost:9324",
        credentials: {
          accessKeyId: "root",
          secretAccessKey: "root",
        },
      }
);

export const distributionQueueUrl = process.env.DISTRIBUTION_QUEUE_URL!;
export const notificationQueueUrl =
  process.env.CLEARING_PRICE_NOTIFICATION_QUEUE_URL!;
