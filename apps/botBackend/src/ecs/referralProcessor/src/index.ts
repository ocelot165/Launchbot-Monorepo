import express from "express";
import {
  CHAIN_ID,
  EASY_AUCTION_ADDRESS,
  SOCKET_RPC_URLS
} from "shared/constants";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { processInfo } from "./process";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import Web3, { EventLog } from "web3";
import EASY_AUCTION_ABI from "shared/abis/easyAuction.json";
import { BigNumber } from "bignumber.js";
import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(SOCKET_RPC_URLS[CHAIN_ID])
);

const easyAuctionContractWeb3 = new web3.eth.Contract(
  EASY_AUCTION_ABI as any,
  EASY_AUCTION_ADDRESS[CHAIN_ID]
);

export const client = new DynamoDBClient(
  process.env.STAGE !== "dev"
    ? {}
    : {
        region: "localhost",
        endpoint: "http://docker.for.mac.localhost:5678",
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_ID!,
          secretAccessKey: process.env.SECRET!
        }
      }
);

export const tableName = process.env.TABLE_NAME!;
export const referralTxsTableName = process.env.REFERRAL_TXS_TABLE_NAME!;
export const referralPointsTableName = process.env.REFERRAL_POINTS_TABLE_NAME!;
export const referrerTableName = process.env.REFERRER_TABLE_NAME!;
export const revSharingTableName = process.env.REV_SHARING_TABLE_NAME!;
export const lastClaimRevenueShareTable =
  process.env.LAST_CLAIM_REVENUE_SHARE_TABLE!;

async function processReferrals() {
  let lastBlockNumber = 0;

  const lastBlockNumberQuery = await client.send(
    new GetItemCommand({
      TableName: referralPointsTableName,
      Key: {
        referralID: {
          S: "lastBlockNumber"
        }
      }
    })
  );

  if (lastBlockNumberQuery.Item) {
    lastBlockNumber = Number(lastBlockNumberQuery.Item.points?.N as string);
  }

  let nextBlockNumber;
  const newBnBlockNumber = await (await web3.eth.getBlockNumber()).toString();
  const diff = new BigNumber(newBnBlockNumber).minus(lastBlockNumber);
  console.log("block data", lastBlockNumber, newBnBlockNumber, diff);
  if (diff.gt(9999)) {
    nextBlockNumber = lastBlockNumber + 9999;
  } else {
    nextBlockNumber = newBnBlockNumber;
  }
  console.log("event params", {
    fromBlock: lastBlockNumber,
    toBlock: nextBlockNumber
  });
  const results = (await easyAuctionContractWeb3.getPastEvents("NewSellOrder", {
    fromBlock: lastBlockNumber,
    toBlock: nextBlockNumber
  })) as EventLog[];

  console.log("Length of results", results.length);

  for (const result of results) {
    await processInfo({
      blockNumber: result.blockNumber,
      transactionHash: result.transactionHash
    });
  }

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
            N: nextBlockNumber.toString()
          },
          Action: "PUT"
        }
      }
    })
  );

  setTimeout(() => {
    processReferrals();
  }, 60000);
}

const app = express();
const port = 3000;

app.get("/health", (req, res) => {
  return res.status(200).json();
});

app.listen(port, () => {
  console.log(`App started`);

  processReferrals();
});
