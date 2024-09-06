import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { AUCTION_ADDRESS, BIG_INT_ZERO } from "const";
import { ERC20 } from "../../generated/EasyAuction/ERC20";
import {
  EasyAuction,
  NewAuction
} from "../../generated/EasyAuction/EasyAuction";
import { Auction } from "../../generated/schema";
import { getToken } from "./Token";

export function getAuction(
  id: BigInt,
  block: ethereum.Block,
  event: NewAuction | null
): Auction {
  if (event !== null) {
    let auction = new Auction(id.toString());
    auction.volumeClearingPriceOrder = BIG_INT_ZERO;
    auction.minFundingThresholdNotReached = false;

    const auctionContract = EasyAuction.bind(AUCTION_ADDRESS);
    const auctionData = auctionContract.auctionData(id);

    const auctionTokenContract = ERC20.bind(event.params._auctioningToken);
    const biddingTokenContract = ERC20.bind(event.params._biddingToken);

    const auctionTokenDecimals = auctionTokenContract.decimals();
    const biddingTokenDecimals = biddingTokenContract.decimals();

    const user = event.params.userId;
    auction.initialAuctionOrder = auctionData
      .getInitialAuctionOrder()
      .toHexString();
    auction.auctionSettled = false;
    auction.auctionStartDate = block.timestamp;
    auction.minFundingThresholdNotReached = false;
    getToken(event.params._biddingToken);
    getToken(event.params._auctioningToken);
    auction.auctioningToken = event.params._auctioningToken.toHexString();
    auction.biddingToken = event.params._biddingToken.toHexString();
    auction.auctioningTokenDecimals = auctionTokenDecimals;
    auction.biddingTokenDecimals = biddingTokenDecimals;
    auction.orderCancellationEndDate = event.params.orderCancellationEndDate;
    auction.volumeClearingPriceOrder = auctionData.getVolumeClearingPriceOrder();
    auction.minimumBiddingAmountPerOrder =
      event.params.minimumBiddingAmountPerOrder;
    auction.interimSumBidAmount = auctionData.getInterimSumBidAmount();
    auction.auctionEndDate = event.params.auctionEndDate;
    auction.strategyID = auctionContract.auctionToStrategy(id);
    auction.referralFeeNumerator = auctionContract.referralFeeNumerator(id);
    auction.createdBy = user.toString();
    auction.biddingTokenPledged = BIG_INT_ZERO;
    auction.biddingTokenRaised = BIG_INT_ZERO;
    auction.minFundingThreshold = auctionData.getMinFundingThreshold();
    auction.save();
    return auction;
  }

  return Auction.load(id.toString()) as Auction;
}
