const generateTemplate = (
  biddingToken: string,
  auctioningToken: string,
  auctionSettled: boolean
) => `<b>Bidding with: ${biddingToken}</b>
<b>Auctioning token: ${auctioningToken}</b>
<b>Auction settled: ${auctionSettled}</b>
`;

export default generateTemplate;
