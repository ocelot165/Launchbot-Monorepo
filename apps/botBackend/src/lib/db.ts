import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const isLambda = process.env.STAGE !== "dev";

export const client = new DynamoDBClient(
  isLambda
    ? {}
    : {
        region: "localhost",
        endpoint: "http://localhost:5678",
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_ID!,
          secretAccessKey: process.env.SECRET_ACCESS_KEY!
        }
      }
);

export const tableName = process.env.TABLE_NAME!;
export const referralTxsTableName = process.env.REFERRAL_TXS_TABLE_NAME!;
export const referralPointsTableName = process.env.REFERRAL_POINTS_TABLE_NAME!;
export const referrerTableName = process.env.REFERRER_TABLE_NAME!;
export const userIDMappingTableName = process.env.USER_ID_MAPPING_TABLE_NAME!;
export const revSharingTableName = process.env.REV_SHARING_TABLE_NAME!;
export const lastClaimRevenueShareTable =
  process.env.LAST_CLAIM_REVENUE_SHARE_TABLE!;
