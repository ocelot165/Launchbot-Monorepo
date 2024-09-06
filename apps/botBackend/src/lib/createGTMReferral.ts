import {
  GetItemCommand,
  TransactWriteItemsCommand
} from "@aws-sdk/client-dynamodb";
import { client, referralPointsTableName, referrerTableName } from "./db";

export default async function createGTMReferral(
  referralID: string,
  userID: string
) {
  referralID = referralID.toString();
  userID = userID.toString();
  const userReferralQuery = await client.send(
    new GetItemCommand({
      TableName: referrerTableName,
      Key: {
        userID: {
          S: userID
        }
      }
    })
  );

  if (!userReferralQuery.Item?.referralID?.S) {
    if (referralID.length > 8 || !referralID.match(/^[a-z]+$/)) {
      throw new Error(
        "Referral ID must be less than 9 characters and can only contain lowercase alphabets"
      );
    }
    await client.send(
      new TransactWriteItemsCommand({
        TransactItems: [
          {
            //update points for the user
            Update: {
              ExpressionAttributeValues: {
                ":newVal": {
                  N: "0"
                }
              },
              Key: {
                referralID: {
                  S: referralID
                }
              },
              TableName: referralPointsTableName,
              UpdateExpression: "SET points = :newVal",
              ConditionExpression: "attribute_not_exists(referralID)"
            }
          },
          {
            Update: {
              TableName: referrerTableName,
              Key: {
                userID: {
                  S: userID
                }
              },
              ExpressionAttributeValues: {
                ":referralID": {
                  S: referralID
                }
              },
              UpdateExpression: "SET referralID = :referralID",
              ConditionExpression: "attribute_not_exists(referralID)"
            }
          }
        ]
      })
    );
  }
}
