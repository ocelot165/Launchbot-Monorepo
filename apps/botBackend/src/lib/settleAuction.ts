import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
import { BigNumber, utils, Wallet } from "ethers";
import { ETH_PRICE_FEED_ID, HERMES_URL } from "shared/constants";
import { getProvider } from "shared/web3/getProvider";
import { getEasyAuctionContract, getPythContract } from "shared/web3/utils";

export default async function settleAuction(
  auctionId: string,
  chainId: number,
  privateKey: string
) {
  const wallet = new Wallet(privateKey, getProvider(chainId));
  const easyAuction = getEasyAuctionContract(chainId).connect(wallet);
  const auctionData = await easyAuction.auctionData(auctionId);
  const auctionEndDate = auctionData.auctionEndDate;
  if (auctionEndDate.gt(BigNumber.from(Math.floor(+new Date() / 1000)))) {
    throw new Error("Auction not yet ended");
  }
  const feeData = await wallet.getFeeData();
  const gasPrice = feeData.gasPrice;

  const pythPriceService = new EvmPriceServiceConnection(HERMES_URL);
  const priceFeedUpdateData = await pythPriceService.getPriceFeedsUpdateData([
    ETH_PRICE_FEED_ID
  ]);

  const pythContract = getPythContract(chainId, wallet);

  const updateFee = await pythContract.methods
    .getUpdateFee(priceFeedUpdateData)
    .call();

  if (gasPrice === null)
    throw new Error("An error occurred while estimating gas");
  let walletBalance = await wallet.getBalance();
  let gas = await easyAuction
    .connect(wallet)
    .estimateGas.settleAuction(
      { auctionId, pythUpdateData: priceFeedUpdateData },
      { value: updateFee }
    );
  let gasRequired = gas.mul(gasPrice);
  if (walletBalance.lt(gasRequired))
    throw new Error(
      `Insufficient gas for settling the auction. Gas required : ${utils.formatEther(
        gasRequired
      )} ETH`
    );
  const tx = await easyAuction
    .connect(wallet)
    .settleAuction(
      { auctionId, pythUpdateData: priceFeedUpdateData },
      { value: updateFee }
    );

  return tx.hash;
}
