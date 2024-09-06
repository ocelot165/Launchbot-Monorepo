import { BigNumber, Contract } from "ethers";
import { SellOrderDetails } from "shared/types/auction";
import { fetchAllBids } from "../graph";
export interface Price {
  priceNumerator: BigNumber;
  priceDenominator: BigNumber;
}

export interface ReceivedFunds {
  auctioningTokenAmount: BigNumber;
  biddingTokenAmount: BigNumber;
}

export interface OrderResult {
  auctioningToken: string;
  biddingToken: string;
  auctionEndDate: BigNumber;
  orderCancellationEndDate: BigNumber;
  initialAuctionOrder: string;
  minimumBiddingAmountPerOrder: BigNumber;
  interimSumBidAmount: BigNumber;
  interimOrder: string;
  clearingPriceOrder: string;
  volumeClearingPriceOrder: BigNumber;
  feeNumerator: BigNumber;
}

export interface Order {
  sellAmount: BigNumber;
  buyAmount: BigNumber;
  userId: BigNumber;
}

export const queueStartElement =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
export const queueLastElement =
  "0xffffffffffffffffffffffffffffffffffffffff000000000000000000000001";

export function getClearingPriceFromInitialOrder(order: Order): Order {
  return {
    userId: BigNumber.from(0),
    sellAmount: order.buyAmount,
    buyAmount: order.sellAmount,
  };
}
export function encodeOrder(order: Order): string {
  return (
    "0x" +
    order.userId.toHexString().slice(2).padStart(16, "0") +
    order.buyAmount.toHexString().slice(2).padStart(24, "0") +
    order.sellAmount.toHexString().slice(2).padStart(24, "0")
  );
}

export function decodeOrder(bytes: string): Order {
  return {
    userId: BigNumber.from("0x" + bytes.substring(2, 18)),
    sellAmount: BigNumber.from("0x" + bytes.substring(43, 66)),
    buyAmount: BigNumber.from("0x" + bytes.substring(19, 42)),
  };
}

export function toReceivedFunds(result: [BigNumber, BigNumber]): ReceivedFunds {
  return {
    auctioningTokenAmount: result[0],
    biddingTokenAmount: result[1],
  };
}

export async function getInitialOrder(
  easyAuction: Contract,
  auctionId: BigNumber
): Promise<Order> {
  const auctionDataStruct = await easyAuction.auctionData(auctionId);
  return decodeOrder(auctionDataStruct.initialAuctionOrder);
}

export async function getInterimOrder(
  easyAuction: Contract,
  auctionId: BigNumber
): Promise<Order> {
  const auctionDataStruct = await easyAuction.auctionData(auctionId);
  return decodeOrder(auctionDataStruct.interimOrder);
}

export async function getAuctionEndTimeStamp(
  easyAuction: Contract,
  auctionId: BigNumber
): Promise<BigNumber> {
  const auctionDataStruct = await easyAuction.auctionData(auctionId);
  return auctionDataStruct.auctionEndDate;
}

export function hasLowerClearingPrice(order1: Order, order2: Order): number {
  if (
    order1.buyAmount
      .mul(order2.sellAmount)
      .lt(order2.buyAmount.mul(order1.sellAmount))
  )
    return -1;
  if (order1.buyAmount.lt(order2.buyAmount)) return -1;
  if (
    order1.buyAmount
      .mul(order2.sellAmount)
      .eq(order2.buyAmount.mul(order1.sellAmount))
  ) {
    if (order1.userId < order2.userId) return -1;
  }
  return 1;
}

export async function calculateClearingPrice(
  easyAuction: Contract,
  auctionId: BigNumber,
  chainId: number,
  bids?: SellOrderDetails[]
): Promise<{ clearingOrder: Order; numberOfOrdersToClear: number }> {
  const initialOrder = await getInitialOrder(easyAuction, auctionId);
  //fetch sell orders from subgraph if not provided already
  bids = bids ?? (await fetchAllBids(chainId, auctionId.toString()));
  const sellOrders = bids.map((value) => ({
    buyAmount: value.buyAmount,
    sellAmount: value.sellAmount,
    userId: BigNumber.from(value.auctionUser),
  }));
  sellOrders.sort(function (a: Order, b: Order) {
    return hasLowerClearingPrice(a, b);
  });

  const clearingPriceOrder = findClearingPrice(sellOrders, initialOrder);
  const interimOrder = await getInterimOrder(easyAuction, auctionId);
  let numberOfOrdersToClear;
  if (
    interimOrder.userId === BigNumber.from(0) &&
    interimOrder.sellAmount === BigNumber.from(0) &&
    interimOrder.buyAmount === BigNumber.from(0)
  ) {
    numberOfOrdersToClear = sellOrders.filter((order) =>
      hasLowerClearingPrice(order, clearingPriceOrder)
    ).length;
  } else {
    numberOfOrdersToClear = sellOrders.filter(
      (order) =>
        hasLowerClearingPrice(order, clearingPriceOrder) &&
        hasLowerClearingPrice(interimOrder, order)
    ).length;
  }

  return {
    clearingOrder: clearingPriceOrder,
    numberOfOrdersToClear,
  };
}

export function findClearingPrice(
  sellOrders: Order[],
  initialAuctionOrder: Order
): Order {
  sellOrders.forEach(function (order, index) {
    if (index > 1) {
      if (!hasLowerClearingPrice(sellOrders[index - 1], order)) {
        throw Error("The orders must be sorted");
      }
    }
  });
  let totalSellVolume = BigNumber.from(0);
  console.log(sellOrders);
  for (const order of sellOrders) {
    console.log("totalSellVolume", totalSellVolume.toString());
    totalSellVolume = totalSellVolume.add(order.sellAmount);
    if (
      totalSellVolume
        .mul(order.buyAmount)
        .div(order.sellAmount)
        .gte(initialAuctionOrder.sellAmount)
    ) {
      const coveredBuyAmount = initialAuctionOrder.sellAmount.sub(
        totalSellVolume
          .sub(order.sellAmount)
          .mul(order.buyAmount)
          .div(order.sellAmount)
      );
      const sellAmountClearingOrder = coveredBuyAmount
        .mul(order.sellAmount)
        .div(order.buyAmount);
      if (sellAmountClearingOrder.gt(BigNumber.from(0))) {
        return order;
      } else {
        return {
          userId: BigNumber.from(0),
          buyAmount: initialAuctionOrder.sellAmount,
          sellAmount: totalSellVolume.sub(order.sellAmount),
        };
      }
    }
  }
  console.log("totalSellVolume", totalSellVolume.toString());
  console.log("initialAuctionOrder", initialAuctionOrder.buyAmount.toString());
  // otherwise, clearing price is initialAuctionOrder
  if (totalSellVolume.gt(initialAuctionOrder.buyAmount)) {
    return {
      userId: BigNumber.from(0),
      buyAmount: initialAuctionOrder.sellAmount,
      sellAmount: totalSellVolume,
    };
  } else {
    return {
      userId: BigNumber.from(0),
      buyAmount: initialAuctionOrder.sellAmount,
      sellAmount: initialAuctionOrder.buyAmount,
    };
  }
}

export async function getAllSellOrders(
  easyAuction: Contract,
  auctionId: BigNumber
): Promise<Order[]> {
  const filterSellOrders = easyAuction.filters.NewSellOrder(
    auctionId,
    null,
    null,
    null
  );
  const logs = await easyAuction.queryFilter(filterSellOrders, 0, "latest");
  const events = logs.map((log: any) => easyAuction.interface.parseLog(log));
  const sellOrders = events.map((x: any) => {
    const order: Order = {
      userId: x.args[1],
      sellAmount: x.args[3],
      buyAmount: x.args[2],
    };
    return order;
  });

  console.log("sellOrders", sellOrders);

  const filterOrderCancellations = easyAuction.filters.CancellationSellOrder(
    auctionId,
    null,
    null,
    null
  );
  const logsForCancellations = await easyAuction.queryFilter(
    filterOrderCancellations,
    0,
    "latest"
  );
  const eventsForCancellations = logsForCancellations.map((log: any) =>
    easyAuction.interface.parseLog(log)
  );
  const sellOrdersDeletions = eventsForCancellations.map((x: any) => {
    const order: Order = {
      userId: x.args[1],
      sellAmount: x.args[3],
      buyAmount: x.args[2],
    };
    return order;
  });
  console.log("sellOrdersDeletions", sellOrdersDeletions);
  for (const orderDeletion of sellOrdersDeletions) {
    if (sellOrders.includes(orderDeletion)) {
      sellOrders.splice(sellOrders.indexOf(orderDeletion), 1);
    }
  }
  return sellOrders;
}
