import { QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import {
  SQSClient,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import { DynamoDBStreamEvent } from "aws-lambda";
import { ethers } from "ethers";
import { getSellOrdersBelowClearingPrice } from "shared/graph/core/fetchers/auction";
import { client, userIDMappingTableName } from "../lib/db";
import { notificationQueueUrl, sqsClient } from "../lib/sqs";

interface Notification {
  userId: string;
  tgUserId: string;
  buyAmount: BigInt;
  sellAmount: BigInt;
  auctionId: string;
  userAddress: string;
  clearingPrice: string;
}

export const consume = async (event: DynamoDBStreamEvent) => {
  const chainId = process.env.CHAINID!;
  // 1. try to only take the clearing price modification events (coming from DDB)
  for (const record of event.Records) {
    if (
      record.eventName !== "MODIFY" &&
      (!record.dynamodb?.OldImage?.clearingPriceTimestamp ||
        record.dynamodb?.NewImage?.clearingPriceTimestamp.N! ===
          record.dynamodb?.OldImage?.clearingPriceTimestamp.N!)
    ) {
      console.log("Not a clearing price modification event");
      continue;
    }

    const auctionInfo = record.dynamodb?.NewImage!;

    if (!auctionInfo.clearingPrice.S) {
      console.log("No clearing price");
      continue;
    }

    console.log("auctionInfo", auctionInfo);

    // 2. query the subgraph (cl auction id and cancelled)
    let sellOrdersBelowClearingPrice = await getSellOrdersBelowClearingPrice(
      +chainId,
      auctionInfo.auctionId.S!,
      +auctionInfo.clearingPrice.S!
    );

    // 3. query the DDB (userIDMappingTableName) to
    console.log("sellOrdersBelowClearingPrice", sellOrdersBelowClearingPrice);
    // query the DDB (userIDMappingTableName) to get all the tg id (key = user id from above)
    const itemsToPush: Notification[] = [];
    for (const order of sellOrdersBelowClearingPrice) {
      if (order.auctionUser.address === ethers.constants.AddressZero) {
        continue;
      }
      const result = await getNotificationDataForUserId(
        order.auctionUser.id,
        order.auction.id
      );
      const item = result.Items ? result.Items[0] : null;
      // Throw an error if item is null or doesn't have a telegramId field
      if (!item || !item.tgUserId || !item.tgUserId.S) {
        continue;
      }

      console.log(item);

      if (item.bidIds) {
        const bidIds = item.bidIds.L || [];
        // Skip if the bidId is already in the list
        if (bidIds.find((bidId) => bidId.S! === order.id)) {
          console.log("bidId already in list", order.id);
          continue;
        }
      }

      // Extract the telegramId
      const tgUserId = item.tgUserId.S;

      // 4. update the DDB
      await saveBidNotification(item.userId.S!, item.auctionId.S!, order.id);

      itemsToPush.push({
        userId: order.auctionUser.id,
        tgUserId: tgUserId,
        buyAmount: order.buyAmount,
        sellAmount: order.sellAmount,
        auctionId: order.auction.id,
        userAddress: order.auctionUser.address,
        clearingPrice: auctionInfo.clearingPrice.S!,
      });
    }

    console.log("itemsToPush", itemsToPush);

    if (itemsToPush.length > 0) {
      // 5. push to SQS queue {tgID, auctionID, newClearingPrice}
      await pushToQueue(itemsToPush, notificationQueueUrl, sqsClient);
    }
  }
};

async function saveBidNotification(
  userId: string,
  auctionId: string,
  bidId: string
) {
  console.log("updating bid notification", bidId);
  const query = new UpdateItemCommand({
    TableName: userIDMappingTableName,
    Key: {
      userId: {
        S: userId,
      },
      auctionId: {
        S: auctionId,
      },
    },
    UpdateExpression:
      "SET bidIds = list_append(if_not_exists(bidIds, :emptyList), :newBidId)",
    ExpressionAttributeValues: {
      ":newBidId": { L: [{ S: bidId }] },
      ":emptyList": { L: [] },
    },
  });
  const result = await client.send(query);
  return result;
}

async function getNotificationDataForUserId(userId: string, auctionId: string) {
  const query = new QueryCommand({
    TableName: userIDMappingTableName,
    Limit: 1,
    KeyConditionExpression: "userId = :userId AND auctionId = :auctionId",
    ExpressionAttributeValues: {
      ":userId": { S: userId },
      ":auctionId": { S: auctionId },
    },
  });
  const result = await client.send(query);
  return result;
}

async function pushToQueue(
  items: Notification[],
  queueUrl: string,
  sqsClient: SQSClient
) {
  try {
    for (let i = 0; i < items.length; i += 10) {
      // Prepare a batch of up to 10 messages
      const batch: SendMessageBatchRequestEntry[] = items
        .slice(i, i + 10)
        .map((obj, index) => ({
          Id: `${obj.tgUserId}-${obj.auctionId}-${obj.buyAmount}-${obj.sellAmount}`, // Unique ID for each message in the batch
          MessageBody: JSON.stringify(obj),
        }));

      // Send the batch
      const command = new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: batch,
      });
      const response = await sqsClient.send(command);
      console.log("Batch send response:", response);
    }
  } catch (error) {
    console.error("Failed to send batch:", error);
  }
}
