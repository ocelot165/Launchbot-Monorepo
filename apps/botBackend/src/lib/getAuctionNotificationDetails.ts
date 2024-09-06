import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { client, tableName } from "./db";

export default async function getAuctionNotificationDetails(auctionId: string) {
  const data = await client.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        auctionId: {
          S: auctionId,
        },
      },
    })
  );

  if (!data.Item) throw new Error("No subscription info");

  return {
    chatId: data.Item?.["chatId"]?.S,
    auctionId: auctionId,
    description: data.Item?.["description"]?.S,
    protocolName: data.Item?.["protocolName"]?.S,
    protocolImageURI: data.Item?.["protocolImageURI"]?.S,
    tokenImgURI: data.Item?.["tokenImgURI"]?.S,
    auctionEndDate: data.Item?.["auctionEndDate"]?.N,
  };
}
