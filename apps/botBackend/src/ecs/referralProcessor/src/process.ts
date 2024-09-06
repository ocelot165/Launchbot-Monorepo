import {
  client,
  referralPointsTableName,
  referralTxsTableName,
  referrerTableName
} from ".";
import {
  GetItemCommand,
  TransactWriteItemsCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";

interface ReferralInfo {
  blockNumber: string;
  transactionHash: string;
}

export const processInfo = async (job: ReferralInfo) => {
  const { blockNumber, transactionHash } = job;
  console.log(
    `Processing referral TX ID: ${transactionHash} with blocknumber: ${blockNumber}`
  );

  try {
    //update the last blocknumber in db - If ec2 crashes we can restart from this point
    await client.send(
      new UpdateItemCommand({
        TableName: referralPointsTableName,
        Key: {
          referralID: {
            S: "lastBlockNumber"
          }
        },
        AttributeUpdates: {
          points: {
            Value: {
              N: blockNumber.toString()
            },
            Action: "PUT"
          }
        }
      })
    );

    //get user and referral id corresponding to the tx
    const referralTXData = await client.send(
      new GetItemCommand({
        TableName: referralTxsTableName,
        Key: {
          transactionHash: {
            S: transactionHash.toString()
          }
        }
      })
    );

    console.log(referralTXData.Item);
    if (referralTXData.Item) {
      const userID = referralTXData.Item.userID.S as string;
      const referralID = referralTXData.Item.referralID.S as string;
      await client.send(
        new TransactWriteItemsCommand({
          TransactItems: [
            {
              //update points for the user
              Update: {
                ExpressionAttributeValues: {
                  ":value": {
                    N: "1"
                  }
                },
                Key: {
                  referralID: {
                    S: referralID
                  }
                },
                TableName: referralPointsTableName,
                UpdateExpression: "ADD points :value"
              }
            },
            {
              //create a record that prevents users spamming points by preventing multiple referrers
              Update: {
                TableName: referrerTableName,
                Key: {
                  userID: {
                    S: userID
                  }
                },
                ExpressionAttributeValues: {
                  ":refID": {
                    S: referralID
                  }
                },
                UpdateExpression: "SET referrer = :refID",
                ConditionExpression: "attribute_not_exists(referrer)"
              }
            }
          ]
        })
      );
    }
    console.log(`Job ${transactionHash} completed.`);
  } catch (error) {
    console.log(error);
    console.log(`Job ${transactionHash} failed.`);
  }
};
