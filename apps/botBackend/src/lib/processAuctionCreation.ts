import { DeleteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { MD5 } from "crypto-js";
import { getAddress } from "ethers/lib/utils";
import { getAddressFromID } from "shared/graph/core/fetchers/auction";
import { AuctionCreatedWebhookQuery } from "shared/graph/core/types";
import { decodeOrder } from "shared/graph/utils";
import { getProvider } from "shared/web3/getProvider";
import { AuctionParams } from "./createAuction";
import { client, tableName } from "./db";
import updateAuctionDescriptions from "./updateAuctionDescriptions";

export default async function processAuctionCreation(
  auctionInfo: AuctionCreatedWebhookQuery,
  chainId: number
) {
  const provider = getProvider(chainId);
  if (!provider) throw new Error("Provider not available");

  const decodedOrder = decodeOrder(auctionInfo.initial_auction_order);

  const userId = decodedOrder.userId;

  const auctionData: AuctionParams & { account: string } = {
    _auctioningToken: getAddress(auctionInfo.auctioning_token),
    _biddingToken: getAddress(auctionInfo.bidding_token),
    _orderCancellationEndDate: auctionInfo.order_cancellation_end_date,
    _auctionEndDate: auctionInfo.auction_end_date,
    _auctionedSellAmount: decodedOrder.sellAmount,
    _minBuyAmount: decodedOrder.buyAmount,
    _minimumBiddingAmountPerOrder: auctionInfo.minimum_bidding_amount_per_order,
    _minFundingThreshold: auctionInfo.min_funding_threshold,
    _referralFeeNumerator: auctionInfo.referral_fee_numerator,
    _strategyId: auctionInfo.strategy_id,
    account: getAddress(await getAddressFromID(chainId, userId)),
  };

  const hash = MD5(
    Object.keys(auctionData)
      .sort()
      .map((key) => auctionData[key])
      .reduce((prev, curr) => `${prev},${curr}`, "")
  ).toString();

  const auctionDetails = await client.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        auctionId: {
          S: auctionInfo.id,
        },
      },
    })
  );
  if (auctionDetails.Item?.["description"]?.S)
    throw new Error("Auction description already set!");

  const data = await client.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        auctionId: {
          S: `temp-${hash}`,
        },
      },
    })
  );

  if (!data.Item?.["description"]?.S)
    throw new Error("Temporary description doesn't exist");

  await updateAuctionDescriptions(
    auctionInfo.id,
    data.Item?.["description"].S as string,
    data.Item?.["protocolName"]?.S as string,
    data.Item?.["protocolImageURI"]?.S as string,
    data.Item?.["tokenImgURI"].S as string,
    "",
    data.Item?.["auctionEndDate"].N as string,
    0,
    true
  );

  await client.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: {
        auctionId: {
          S: `temp-${hash}`,
        },
      },
    })
  );
}
