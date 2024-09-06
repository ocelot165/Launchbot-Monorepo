import {
  Distribution as DistributionEvent,
  Transfer as TransferEvent
} from "../../generated/AuctionToken/AuctionToken";
import {
  AuctionTokenDistribution,
  AuctionTokenTransfer
} from "../../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  let entity = new AuctionTokenTransfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.save();
}

export function handleDistribution(event: DistributionEvent): void {
  let entity = new AuctionTokenDistribution(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.amountForBuyBack = event.params.amountForBuyBack;
  entity.amountForRevShare = event.params.amountForRevShare;
  entity.amountForTeam = event.params.amountForTeam;
  entity.amountForLiquidity = event.params.amountForLiquidity;
  entity.timestamp = event.block.timestamp;
  entity.save();
}
