import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { getAuctionData } from "shared/web3/getAuctionData";
import { getProvider } from "shared/web3/getProvider";
import { getUserID } from "shared/web3/getUserID";
import { client, userIDMappingTableName } from "./db";

export async function registerClearingPriceNotifications(
  auctionId: string,
  address: string,
  chainId: number,
  tgUserId: string
) {
  const provider = getProvider(chainId);
  if (!provider) throw new Error("Provider not available");

  const { auctionEndDate } = await getAuctionData(auctionId, chainId, provider);

  if (auctionEndDate <= Date.now() / 1000)
    throw new Error("Cannot subscribe to expired auctions");

  const userId = await getUserID(address, chainId, provider);

  console.log("before put item");
  console.log("userId", userId);
  console.log("auctionId", auctionId);
  console.log("tgUserId", tgUserId);
  console.log("address", address);

  // print the type of var
  console.log("typeof userId", typeof userId);
  console.log("typeof auctionId", typeof auctionId);
  console.log("typeof tgUserId", typeof tgUserId);

  await client.send(
    new PutItemCommand({
      TableName: userIDMappingTableName,
      Item: {
        userId: {
          S: userId,
        },
        auctionId: {
          S: auctionId,
        },
        tgUserId: {
          S: tgUserId.toString(),
        },
      },
    })
  );
}

export async function unRegisterClearingPriceNotifications(
  auctionId: string,
  address: string,
  chainId: number
) {
  const provider = getProvider(chainId);
  if (!provider) throw new Error("Provider not available");

  const userId = await getUserID(address, chainId, provider);

  await client.send(
    new DeleteItemCommand({
      TableName: userIDMappingTableName,
      Key: {
        userId: {
          S: userId,
        },
        auctionId: {
          S: auctionId,
        },
      },
    })
  );
}

export async function clearingPriceNotifications(
  auctionId: string,
  address: string,
  chainId: number
) {
  const provider = getProvider(chainId);
  if (!provider) throw new Error("Provider not available");

  const userId = await getUserID(address, chainId, provider);

  const data = await client.send(
    new GetItemCommand({
      TableName: userIDMappingTableName,
      Key: {
        userId: {
          S: userId,
        },
        auctionId: {
          S: auctionId,
        },
      },
    })
  );

  console.log(data);

  if (!data.Item) {
    return {
      userId: "",
      auctionId: "",
      tgUserId: "",
      bidIds: [],
    };
  }

  return {
    userId: data.Item?.["userId"]?.S,
    auctionId: auctionId,
    tgUserId: data.Item?.["tgUserId"]?.S,
    bidIds: data.Item?.["bidIds"]?.NS,
  };
}
