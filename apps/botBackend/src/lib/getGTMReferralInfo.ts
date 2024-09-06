import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { client, referralPointsTableName, referrerTableName } from "./db";

export default async function getGTMReferralInfo(userID: string) {
  const userReferralQuery = await client.send(
    new GetItemCommand({
      TableName: referrerTableName,
      Key: {
        userID: {
          S: userID,
        },
      },
    }),
  );

  if (!userReferralQuery.Item?.referralID?.S) {
    return;
  }

  const referralID = userReferralQuery.Item?.referralID?.S as string;
  const referrer = userReferralQuery.Item?.referrer?.S;

  const pointsQuery = await client.send(
    new GetItemCommand({
      TableName: referralPointsTableName,
      Key: {
        referralID: {
          S: referralID,
        },
      },
    }),
  );

  const points = Number(pointsQuery.Item?.points?.N);

  return {
    referralID,
    referrer,
    points,
  };
}
