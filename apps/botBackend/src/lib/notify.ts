import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { Telegram } from "telegraf";
import { client, tableName } from "./db";
import { BidsWebhookQuery } from "shared/graph/core/types";
import { getAuctionInfoMinimal } from "shared/graph/core/fetchers/auction";
import { utils, BigNumber } from "ethers";
import { WEB_APP_URL } from "shared/constants";
import { getAddress } from "ethers/lib/utils";

const generateMessage = (
  context: BidsWebhookQuery,
  auctionInfo: any,
  prices: Record<string, number>
) =>
  `<b>🚨 Bid Placed! 🚨</b>
<a href="${WEB_APP_URL}?startapp=${
    context.auction
  }">Participate in the Auction</a>
Order Details:
Bidding Amount: ${utils.formatUnits(
    BigNumber.from(context.sell_amount),
    auctionInfo.biddingToken.decimals
  )} ${
    prices[getAddress(auctionInfo.biddingToken.address)]
      ? `(${
          prices[getAddress(auctionInfo.biddingToken.address)] *
          Number(
            utils.formatUnits(
              BigNumber.from(context.sell_amount),
              auctionInfo.biddingToken.decimals
            )
          )
        }$)`
      : ""
  } ${auctionInfo.biddingToken.symbol}
Buy Amount: ${utils.formatUnits(
    BigNumber.from(context.buy_amount),
    auctionInfo.auctioningToken.decimals
  )} ${auctionInfo.auctioningToken.symbol}
Price: ${utils.formatUnits(
    utils.parseEther(context.sell_amount).div(context.buy_amount)
  )} ${
    prices[getAddress(auctionInfo.biddingToken.address)]
      ? `(${
          prices[getAddress(auctionInfo.biddingToken.address)] *
          Number(
            utils.formatUnits(
              utils.parseEther(context.sell_amount).div(context.buy_amount)
            )
          )
        }$)`
      : ""
  }

Auction Info:
Cumulative Bidding Token Pledged: ${utils.formatUnits(
    BigNumber.from(auctionInfo.biddingTokenPledged),
    auctionInfo.biddingToken.decimals
  )} ${auctionInfo.biddingToken.symbol}
Auction End Date: ${new Date(
    Number(auctionInfo.auctionEndDate) * 1000
  ).toDateString()}`;

export default async function notify(
  context: BidsWebhookQuery,
  telegram: Telegram,
  chainId: number,
  host: string
) {
  const data = await client.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        auctionId: {
          S: context.auction.toString()
        }
      }
    })
  );

  const chatId = data.Item?.["chatId"];

  if (!chatId?.S) throw new Error("No subscription");

  const auctionInfo = await getAuctionInfoMinimal(chainId, context.auction);

  const res = await fetch(
    `${host}/${process.env.STAGE}/auctionBotHandler/getBiddingTokenPrices`,
    {
      method: "get"
    }
  );
  if (res.status !== 200) throw new Error("");
  const prices = await res.json();

  return telegram.sendMessage(
    chatId.S,
    generateMessage(context, auctionInfo, prices),
    {
      parse_mode: "HTML"
    }
  );
}
