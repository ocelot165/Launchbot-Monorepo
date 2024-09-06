export type LatestBidQuery = {
  buyAmount: string;
  sellAmount: string;
  auctionUser: {
    id: string;
  };
};

export type BidsWebhookQuery = {
  order_claimed: boolean;
  auction_user: string;
  sell_amount: string;
  auction: string;
  block: string;
  referral: string;
  winning_amount: string;
  buy_amount: string;
  id: string;
  vid: string;
  cancelled: boolean;
  timestamp: string;
  block_range: string;
};

export type AuctionCreatedWebhookQuery = {
  id: string;
  auctioning_token: string;
  bidding_token: string;
  order_cancellation_end_date: string;
  auction_end_date: string;
  initial_auction_order: string;
  minimum_bidding_amount_per_order: string;
  strategy_id: string;
  referral_fee_numerator: string;
  min_funding_threshold: string;
  clearing_price: string;
};

export type BidsQuery = {
  buyAmount: string;
  sellAmount: string;
  timestamp: string;
  referral: {
    id: string;
  };
  auctionUser: {
    id: string;
    address?: string;
  };
  cancelled: boolean;
  orderClaimed: boolean;
  winningAmount: string;
};

export type UserBidsQuery = {
  auctionSellOrders: BidsQuery[];
  id: string;
  sumAuctioningTokenAmount: string;
};

export type UserReferralsQuery = {
  ordersReferredCount: string;
  ordersWonCount: string;
  totalRewards: string;
  totalWinningSellAmount: string;
  totalSellAmount: string;
  totalWinningsForReferredOrders: string;
};

export type MyAuctionsQuery = {
  id: string;
  createdBy: {
    address: string;
  };
  auctionEndDate: string;
  auctionSettled: boolean;
  auctionStartDate: string;
  auctioningToken: {
    address: string;
    name: string;
    symbol: string;
    decimals: string;
  };
  biddingToken: {
    address: string;
    decimals: string;
    name: string;
    symbol: string;
  };
  initialAuctionOrder: string;
  interimSumBidAmount: string;
  minimumBiddingAmountPerOrder: string;
  referralFeeNumerator: string;
  minFundingThresholdNotReached: boolean;
  orderCancellationEndDate: string;
  strategyID: string;
  volumeClearingPriceOrder: string;
  biddingTokenPledged: string;
  biddingTokenRaised: string;
};

export type TokenQuery = {
  erc20Address: string;
  name: string;
  symbol: string;
  decimals: number;
  initialAmount: string;
};
