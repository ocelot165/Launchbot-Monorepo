import { getParsedEthersError } from "@enzoferey/ethers-error-parser";
import "@ethersproject/shims";
import { MD5 } from "crypto-js";
import { BigNumber, Wallet, utils } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { Token } from "shared/types/assets";
import { CreateAuctionQuery } from "shared/types/auction";
import { getProvider } from "shared/web3/getProvider";
import { getTokenDetails } from "shared/web3/getTokenDetails";
import { getEasyAuctionContract } from "shared/web3/utils";
import initAuctionDescriptions from "./initAuctionDescriptions";
export interface AuctionParams {
  _auctioningToken: string;
  _biddingToken: string;
  _orderCancellationEndDate: string;
  _auctionEndDate: string;
  _auctionedSellAmount: string;
  _minBuyAmount: string;
  _minimumBiddingAmountPerOrder: string;
  _minFundingThreshold: string;
  _referralFeeNumerator: string;
  _strategyId: string;
  _strategyInitParams?: any;
}

async function verifyAndSerializeCreateAuctionDetails(
  auctionData: CreateAuctionQuery,
  account: string,
  chainId: number
): Promise<AuctionParams> {
  const auctionEndTimestamp = Number(auctionData.auctionEndTimestamp);
  const orderCancellationEndTimestamp = Number(
    auctionData.orderCancellationEndTimestamp
  );

  if (auctionEndTimestamp <= Date.now() / 1000)
    throw new Error("Auction end timestamp cannot be lesser than current date");
  if (auctionEndTimestamp < orderCancellationEndTimestamp)
    throw new Error(
      "Invalid params for auctionEndTimestamp and orderCancellationEndTimestamp"
    );

  const provider = getProvider(chainId);

  const auctioningToken: Token | undefined = await getTokenDetails(
    auctionData.auctioningToken,
    account,
    chainId,
    provider
  );
  const biddingToken: Token | undefined = await getTokenDetails(
    auctionData.biddingToken,
    account,
    chainId,
    provider
  );

  if (!auctioningToken) throw new Error("Auctioning token invalid");
  if (!biddingToken) throw new Error("Bidding token invalid");

  const referralFeeNumerator = BigNumber.from(auctionData.referralFeeNumerator);
  if (referralFeeNumerator.gt(100))
    throw new Error("Referral Fee numerator cannot exceed 10%");
  const _auctionedSellAmount = BigNumber.from(auctionData.sellAmount);
  if (_auctionedSellAmount.lte(0))
    throw new Error("Auctioned sell amount has to be > 0");
  const minBuyAmount = BigNumber.from(auctionData.minBuyAmount);
  if (minBuyAmount.lte(0)) throw new Error("Min buy amount has to be > 0");
  const minimumBiddingAmountPerOrder = BigNumber.from(
    auctionData.minBuyAmountPerOrder
  );
  if (minimumBiddingAmountPerOrder.lte(0))
    throw new Error("minimumBiddingAmountPerOrder has to be > 0");

  const strategyId = BigNumber.from(auctionData.strategyId);

  if (strategyId.gt(1)) {
    //TODO - check if strategy is enabled
    //TODO - validate the strategy params per strategy
  }

  return {
    _auctioningToken: getAddress(auctioningToken.address),
    _biddingToken: getAddress(biddingToken.address),
    _orderCancellationEndDate: orderCancellationEndTimestamp.toString(),
    _auctionEndDate: auctionEndTimestamp.toString(),
    _auctionedSellAmount: _auctionedSellAmount.toString(),
    _minBuyAmount: minBuyAmount.toString(),
    _minimumBiddingAmountPerOrder: minimumBiddingAmountPerOrder.toString(),
    _minFundingThreshold: BigNumber.from(
      auctionData.minFundingThreshold
    ).toString(),
    _referralFeeNumerator: referralFeeNumerator.toString(),
    _strategyId: strategyId.toString(),
    _strategyInitParams: auctionData.initParams
  };
}

export default async function createAuction(
  auctionData: CreateAuctionQuery,
  account: string,
  chainId: number,
  privateKey: string
) {
  if (auctionData.description === "" || !auctionData.description)
    throw new Error("Description cannot be empty");
  if (auctionData.protocolName === "" || !auctionData.protocolName)
    throw new Error("Protocol name cannot be empty");
  if (auctionData.protocolImageURI === "" || !auctionData.protocolImageURI)
    throw new Error("Protocol image cannot be empty");
  if (auctionData.tokenImageURI === "" || !auctionData.tokenImageURI)
    throw new Error("Token image cannot be empty");
  if (auctionData.protocolName.length > 300)
    throw new Error("Protocol name cannot exceed 300 characters");
  if (auctionData.description.length > 4096)
    throw new Error("Protocol description cannot exceed 4096 characters");

  const data = await verifyAndSerializeCreateAuctionDetails(
    auctionData,
    account,
    chainId
  );
  const tempData = { ...data, account: getAddress(account) };
  delete tempData._strategyInitParams;
  const hash = MD5(
    Object.keys(tempData)
      .sort()
      .map((key) => tempData[key])
      .reduce((prev, curr) => `${prev},${curr}`, "")
  ).toString();
  const wallet = new Wallet(privateKey, getProvider(chainId));
  const easyAuction = getEasyAuctionContract(chainId);
  const feeData = await wallet.getFeeData();
  const gasPrice = feeData.gasPrice;

  if (gasPrice === null)
    throw new Error("An error occurred while estimating gas");

  let walletBalance;
  let gas;
  let gasRequired;
  walletBalance = await wallet.getBalance();
  gas = await easyAuction.connect(wallet).estimateGas.initiateAuction(data);
  gasRequired = gas.mul(gasPrice);
  if (walletBalance.lt(gasRequired))
    throw new Error(
      `Insufficient Gas for auction creation. Gas required : ${utils.formatEther(
        gasRequired
      )} ETH`
    );
  try {
    await initAuctionDescriptions(
      hash.toString(),
      auctionData.description,
      auctionData.protocolName,
      auctionData.protocolImageURI,
      auctionData.tokenImageURI,
      auctionData.auctionEndTimestamp,
      account,
      chainId
    );
    const tx = await easyAuction.connect(wallet).initiateAuction(data);
    // await tx.wait()
    return tx.hash;
    //Tx succeeded, proceed to update auction info
  } catch (error) {
    if (error?.isError) {
      const parsedEthersError = getParsedEthersError(error);
      throw new Error(parsedEthersError.errorCode);
    } else {
      throw new Error(error);
    }
  }
}
