import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BIG_INT_ZERO } from "const";
import { SellOrder } from "../../generated/schema";

export function getSellOrder(
  auctionID: BigInt,
  sellTokenDecimals: number,
  buyTokenDecimals: number,
  userId: BigInt,
  buyAmount: BigInt,
  sellAmount: BigInt,
  referralCode: string | null,
  block: ethereum.Block | null,
  txHash: string
): SellOrder {
  const price = sellAmount
    .times(BigInt.fromI32(10).pow(buyTokenDecimals as u8))
    .toBigDecimal()
    .div(
      buyAmount
        .times(BigInt.fromI32(10).pow(sellTokenDecimals as u8))
        .toBigDecimal()
    );

  const orderId = auctionID
    .toString()
    .concat("-")
    .concat(userId.toString())
    .concat("-")
    .concat(buyAmount.toString().concat("-"))
    .concat(sellAmount.toString());
  let newSellOrder = SellOrder.load(orderId);
  if (!newSellOrder) {
    newSellOrder = new SellOrder(orderId);
    newSellOrder.buyAmount = buyAmount;
    newSellOrder.sellAmount = sellAmount;
    newSellOrder.price = price;
    newSellOrder.auction = auctionID.toString();
    newSellOrder.orderClaimed = false;
    newSellOrder.cancelled = false;
    newSellOrder.auctionUser = userId.toString();
    newSellOrder.referral = referralCode;
    newSellOrder.winningAmount = BIG_INT_ZERO;
    newSellOrder.txHash = txHash;

    newSellOrder.timestamp = BIG_INT_ZERO;
    newSellOrder.block = BIG_INT_ZERO;
    newSellOrder.save();
  }
  if (block) {
    newSellOrder.timestamp = block.timestamp;
    newSellOrder.block = block.number;
    newSellOrder.save();
  }
  return newSellOrder;
}
