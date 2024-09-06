import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { getProvider } from "shared/web3/getProvider";
import { client, tableName } from "./db";

export default async function initAuctionDescriptions(
  id: string,
  description: string,
  protocolName: string,
  protocolImageURI: string,
  tokenImgURI: string,
  endTimestamp: string,
  address: string,
  chainId: number
) {
  const provider = getProvider(chainId);
  if (!provider) throw new Error("Provider not available");

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        auctionId: {
          S: `temp-${id}`,
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
            S: protocolImageURI,
          },
          Action: "PUT",
        },
        tokenImgURI: {
          Value: {
            S: tokenImgURI,
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
