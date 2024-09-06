import ethers, { BigNumber } from "ethers";
import { PRECALCULATION_ITERATION_STEPS } from "shared/web3/clearAuction";
import { getProvider } from "shared/web3/getProvider";
import { getEasyAuctionContract } from "shared/web3/utils";

export default async function precalculateSettlement(
  auctionId: string,
  chainId: number,
  privateKey: string,
  numSteps: number
) {
  const wallet = new ethers.Wallet(privateKey, getProvider(chainId));
  const easyAuction = getEasyAuctionContract(chainId).connect(wallet);
  const auctionData = await easyAuction.auctionData(auctionId);
  const auctionEndDate = auctionData.auctionEndDate;
  if (auctionEndDate.gt(BigNumber.from(Math.floor(+new Date() / 1000)))) {
    throw new Error("Auction not yet ended");
  }
  const feeData = await wallet.getFeeData();
  const gasPrice = feeData.gasPrice;

  if (gasPrice === null)
    throw new Error("An error occurred while estimating gas");

  let txs: any[] = [];

  let walletBalance = await wallet.getBalance();
  let gas = await easyAuction
    .connect(wallet)
    .estimateGas.precalculateSellAmountSum(
      auctionId,
      PRECALCULATION_ITERATION_STEPS
    );
  let gasRequired = gas.mul(gasPrice).mul(numSteps);
  if (walletBalance.lt(gasRequired))
    throw new Error(
      `Insufficient Gas for precalculating sell amounts. Approx gas required : ${ethers.utils.formatEther(
        gasRequired
      )} ETH`
    );
  for (let i = 0; i < numSteps; i++) {
    const tx = await easyAuction
      .connect(wallet)
      .precalculateSellAmountSum(auctionId, PRECALCULATION_ITERATION_STEPS);
    txs.push(tx.hash);
  }

  return txs;
}
