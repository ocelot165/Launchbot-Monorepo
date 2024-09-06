import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { getAuctionData } from "shared/web3/getAuctionData";
import { getProvider } from "shared/web3/getProvider";
import { getUserID } from "shared/web3/getUserID";
import { client, tableName } from "./db";

export default async function updateAuctionDescriptions(
  auctionId: string,
  description: string,
  protocolName: string,
  protocolImageURI: string,
  tokenImgURI: string,
  address: string,
  endTimestamp: string,
  chainId: number,
  fromSelf = false
) {
  if (!fromSelf) {
    const provider = getProvider(chainId);
    if (!provider) throw new Error("Provider not available");

    const {
      initialAuctionOrder: { auctionUser },
    } = await getAuctionData(auctionId, chainId, provider);

    const userId = await getUserID(address, chainId, provider);

    if (description === "" || !description)
      throw new Error("Description cannot be empty");
    if (protocolName === "" || !protocolName)
      throw new Error("Protocol name cannot be empty");

    if (auctionUser !== userId)
      throw new Error("Only auction creator can subscribe to notifications");
    if (+endTimestamp <= Date.now() / 1000)
      throw new Error("Cannot update expired auctions");
  }

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        auctionId: {
          S: auctionId,
        },
      },
      AttributeUpdates: {
        description: {
          Value: {
            S: description,
          },
          Action: "PUT",
        },
        protocolName: {
          Value: {
            S: protocolName,
          },
          Action: "PUT",
        },
        protocolImageURI: {
          Value: {
            S: protocolImageURI ?? "",
          },
          Action: "PUT",
        },
        tokenImgURI: {
          Value: {
            S: tokenImgURI ?? "",
          },
          Action: "PUT",
        },
        auctionEndDate: {
          Value: {
            N: endTimestamp,
          },
          Action: "PUT",
        },
      },
    })
  );
}
