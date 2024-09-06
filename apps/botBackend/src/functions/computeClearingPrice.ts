import { ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { BigNumber, ethers } from "ethers";
import { fetchAllBids } from "shared/graph/core/fetchers/auction";
import { calculateClearingPrice } from "shared/web3/priceCalculation";
import { getEasyAuctionContract, getTokenContract } from "shared/web3/utils";
import { client, tableName } from "../lib/db";

export const handler = async (event) => {
  console.log("inside computeClearingPrice");
  // find the auctions where the clearingPriceTimestamp is > 12h ago by querying from ddb
  const chainId = +process.env.CHAINID!;
  const alchemyKey = process.env.ALCHEMY_API_KEY!;
  const provider = new ethers.providers.AlchemyProvider(chainId, alchemyKey);
  const auctionBotContract = getEasyAuctionContract(+chainId, provider);

  // query all the auctions ending in 3 days
  const currentUnixTimestamp = Math.floor(Date.now() / 1000);
  const threeDaysFromNow = currentUnixTimestamp + 3 * 24 * 60 * 60;

  console.log("currentUnixTimestamp", currentUnixTimestamp);
  console.log("threeDaysFromNow", threeDaysFromNow);

  const auctionQueryCommand = new ScanCommand({
    TableName: tableName,
    FilterExpression:
      "auctionEndDate > :now AND auctionEndDate < :threeDaysFromNow",
    ExpressionAttributeValues: {
      ":now": { N: currentUnixTimestamp.toString() },
      ":threeDaysFromNow": { N: threeDaysFromNow.toString() },
    },
  });
  const result = await client.send(auctionQueryCommand);
  if (result.Items) {
    for (const item of result.Items) {
      if (item.clearingPriceTimestamp) {
        const clearingPriceTimestamp = +item.clearingPriceTimestamp.N!;

        // for testing purposes, we can set the sixHoursAgo to clearingPriceTimestamp
        const sixHoursAgo =
          process.env.STAGE === "prod"
            ? currentUnixTimestamp - 6 * 60 * 60
            : clearingPriceTimestamp + 1;

        if (clearingPriceTimestamp >= sixHoursAgo) {
          console.log(
            "clearingPriceTimestamp is not > 6 hours ago for auctionId",
            item.auctionId.S
          );
          continue;
        }
      }

      try {
        console.log(
          "calculating clearing price for auctionId",
          item.auctionId.S
        );
        const bids = await fetchAllBids(chainId, item.auctionId.S!);
        // call findClearingPrice on all the auctions (alchemy key and provider)
        const { clearingOrder } = await calculateClearingPrice(
          auctionBotContract,
          BigNumber.from(item.auctionId.S!),
          chainId,
          bids
        );
        console.log("clearingOrder", clearingOrder);

        const auctionData = await auctionBotContract.auctionData(
          item.auctionId.S
        );

        // Fetch the decimal values
        const biddingTokenContract = getTokenContract(
          auctionData.biddingToken,
          provider
        );
        const auctioningTokenContract = getTokenContract(
          auctionData.auctioningToken,
          provider
        );
        const decimalsBidToken = await biddingTokenContract.decimals();
        const decimalsAucToken = await auctioningTokenContract.decimals();

        // Calculate the clearing price
        const clearingPrice = clearingOrder.sellAmount
          .mul(BigNumber.from(10).pow(decimalsAucToken))
          .mul(BigNumber.from(10).pow(18))
          .div(
            clearingOrder.buyAmount.mul(
              BigNumber.from(10).pow(decimalsBidToken)
            )
          )
          .toString();

        const scaledDownClearingPrice =
          parseFloat(clearingPrice) / Math.pow(10, 18);

        console.log("clearingPrice", clearingPrice);
        console.log("scaledDownClearingPrice", scaledDownClearingPrice);
        // update the ddb with the new clearingPrice and clearingPriceTimestamp
        const updateCommand = new UpdateItemCommand({
          TableName: tableName,
          Key: {
            auctionId: { S: item.auctionId.S! },
          },
          UpdateExpression:
            "SET clearingPrice = :clearingPrice, clearingPriceTimestamp = :clearingPriceTimestamp",
          ExpressionAttributeValues: {
            ":clearingPrice": { S: scaledDownClearingPrice.toString() },
            ":clearingPriceTimestamp": {
              N: currentUnixTimestamp.toString(),
            },
          },
        });
        console.log("updating ddb with new clearing price");
        await client.send(updateCommand);
      } catch (e) {
        console.log("error", e);
        continue;
      }
    }
  }
};
