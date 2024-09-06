
import { getProvider } from "shared/web3/getProvider"
import { BigNumber,Wallet,utils } from "ethers";
import { getTokenContract } from "shared/web3/utils";
import "@ethersproject/shims";
import { EASY_AUCTION_ADDRESS } from "shared/constants";
import { getParsedEthersError } from "@enzoferey/ethers-error-parser";

export default async function approveAuctioningToken(
  amount: string,
  token:string,
  chainId: number,
  privateKey: string
) {

  const wallet = new Wallet(privateKey, getProvider(chainId));

  const tokenContract = getTokenContract(token);

  const feeData = await wallet.getFeeData()
  const gasPrice = feeData.gasPrice

  if(gasPrice===null) throw new Error("An error occurred while estimating gas")

  try{
  let walletBalance;
  let gas;
  let gasRequired;
    walletBalance = await wallet.getBalance()
    gas = await tokenContract.connect(wallet).estimateGas.approve(EASY_AUCTION_ADDRESS[chainId],amount)
    gasRequired = gas.mul(gasPrice)
    if(walletBalance.lt(gasRequired)) throw new Error(`Insufficient Gas for approval TX. Gas required : ${utils.formatEther(gasRequired)} ETH`);
    const tx = await tokenContract.connect(wallet).approve(EASY_AUCTION_ADDRESS[chainId],amount)
    return tx.hash

  }
  catch(error){
      const parsedEthersError = getParsedEthersError(error);
      throw new Error(parsedEthersError.errorCode)
  }
}