import {
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";

import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { BigNumber } from "ethers";
import { client, lastClaimRevenueShareTable, revSharingTableName } from "./db";
import { distributionQueueUrl, sqsClient } from "./sqs";

const CLAIM_TIME_THRESHOLD = 24 * 60 * 60; // 24 hours in sec

export async function getRevSharingPerUser(
  userAddress: string,
  itemsLimit = 10,
  lastEvaluatedKey = null
) {
  // Get the data from DDB
  const data = await getRevSharingDataFromDDB(
    userAddress,
    itemsLimit,
    lastEvaluatedKey
  );

  // Return the data
  return data;
}

export async function claimRevSharing(userAddress: string) {
  // check when the user last claimed
  const canClaim = await isClaimOpenForUser(userAddress);
  if (!canClaim) {
    throw new Error("User cannot claim yet");
  }

  const timestamp = await updateLastClaimed(userAddress);

  await pushMessageToFifoSQS(userAddress, timestamp);
}

export async function isClaimOpenForUser(
  userAddress: string
): Promise<boolean> {
  const latestClaim = await getLatestClaimfromDDB(userAddress);

  // if no data, can claim
  if (!latestClaim) {
    return true;
  }

  // if data, check if it's been more than 24 hours
  const now = Math.floor(Date.now() / 1000);
  const timeSinceLastClaim = now - latestClaim!;
  if (timeSinceLastClaim >= CLAIM_TIME_THRESHOLD) {
    return true;
  }

  // if less than 24 hours, return false
  return false;
}

async function getRevSharingDataFromDDB(
  userAddress: string,
  itemsLimit: number,
  lastEvaluatedKey: { [key: string]: any } | null
) {
  // create a DDB query to get all the rev sharing data for a user
  const commandParams: QueryCommandInput = {
    TableName: revSharingTableName,
    KeyConditionExpression: "userAddress = :address",
    ExpressionAttributeValues: {
      ":address": { S: userAddress },
    },
    Limit: itemsLimit, // Limits the number of results per page
    ScanIndexForward: false, // Returns the results in descending order based on the sort key
  };

  // Include the ExclusiveStartKey if a lastEvaluatedKey was provided (for pagination)
  if (lastEvaluatedKey) {
    commandParams.ExclusiveStartKey = lastEvaluatedKey;
  }

  const command = new QueryCommand(commandParams);

  try {
    const data = await client.send(command);

    let items: {
      userAddress: string;
      timestamp: number;
      epochRevenue: BigNumber;
      claimStatus: string;
      txHash?: string;
    }[] = [];

    if (data.Items) {
      items = data.Items.map((item) => {
        return {
          userAddress: item.userAddress.S!,
          timestamp: Number(item.epoch.N),
          epochRevenue: BigNumber.from(item.epochRevenue.N),
          claimStatus: item.claimStatus.S!,
          txHash: item.txHash?.S,
        };
      });
    }

    return {
      items, // The revenue share data
      lastEvaluatedKey: data.LastEvaluatedKey, // The key to start the next page
    };
  } catch (error) {
    console.error(
      "Unable to query the table. Error JSON:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
}

async function getLatestClaimfromDDB(
  userAddress: string
): Promise<number | undefined> {
  // create a DDB query to get all the rev sharing data for a user
  const commandParams: QueryCommandInput = {
    TableName: lastClaimRevenueShareTable,
    KeyConditionExpression: "userAddress = :address",
    ExpressionAttributeValues: {
      ":address": { S: userAddress },
    },
    Limit: 1, // Limits the number of results per page
    ScanIndexForward: false, // Returns the results in descending order based on the sort key
  };

  const command = new QueryCommand(commandParams);

  try {
    const data = await client.send(command);
    if (data.Items && data.Items.length === 0) {
      return undefined;
    }

    // convert string to number
    const result = Number(data.Items![0].timestamp.N!);
    return result;
  } catch (error) {
    console.error(
      "Unable to query the table. Error JSON:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
}

async function updateLastClaimed(userAddress: string): Promise<number> {
  // timestamp in UNIX time (seconds)
  const timestamp = Math.floor(Date.now() / 1000);
  try {
    // add the addy as the ID and the timestamp as the sort key timestamp
    await client.send(
      new PutItemCommand({
        TableName: lastClaimRevenueShareTable,
        Item: {
          userAddress: { S: userAddress }, // User address as the primary key
          timestamp: { N: timestamp.toString() }, // Current timestamp
        },
      })
    );
  } catch (error) {
    console.error(
      "Unable to update the table. Error JSON:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }

  return timestamp;
}

async function pushMessageToFifoSQS(userAddress: String, timestamp: number) {
  try {
    // send a message with the addy as the ID to a FIFO SQS queue
    console.log("Sending message to SQS");
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: distributionQueueUrl,
        MessageGroupId: `${timestamp}#${userAddress}`,
        MessageDeduplicationId: `${timestamp}#${userAddress}`, // Deduplication: "1244643#0xabcd..."
        MessageBody: JSON.stringify({
          userAddress,
          timestamp,
        }),
      })
    );
  } catch (error) {
    console.error(
      "Unable to enqueue the item to SQS. Error JSON:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
}
