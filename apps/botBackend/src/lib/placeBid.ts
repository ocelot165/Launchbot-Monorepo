import { getProvider } from "shared/web3/getProvider";
import { getEasyAuctionContract } from "shared/web3/utils";
import { Wallet, Transaction, providers, BigNumber } from "ethers";
import { utils } from "ethers";
import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import {
  client,
  referralPointsTableName,
  referralTxsTableName,
  referrerTableName
} from "./db";

async function precomputeTxHash(
  chainId: number,
  placeBidData: any,
  privateKey: string,
  feeData: providers.FeeData,
  gas: BigNumber
) {
  const provider = getProvider(chainId) as providers.StaticJsonRpcProvider;

  const wallet = new Wallet(privateKey);
  const easyAuctionContract = getEasyAuctionContract(chainId);

  const nonce = await provider.getTransactionCount(wallet.address);

  const unsignedTX = await easyAuctionContract
    .connect(provider)
    .populateTransaction.placeSellOrders(
      placeBidData.auctionId,
      placeBidData._minBuyAmounts,
      placeBidData._sellAmounts,
      placeBidData._prevSellOrders,
      placeBidData.referralCode
    );

  const signedTX = await wallet.signTransaction({
    ...unsignedTX,
    nonce,
    gasLimit: gas,
    maxFeePerGas: feeData.maxFeePerGas as BigNumber,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas as BigNumber,
    type: 2,
    chainId
  });

  const txHash = utils.keccak256(signedTX).toLowerCase();

  return { txHash, signedTX };
}

const checkReferrerExists = async (referralID: string) => {
  const data = await client.send(
    new GetItemCommand({
      TableName: referralPointsTableName,
      Key: {
        referralID: {
          S: referralID
        }
      }
    })
  );

  if (!data.Item)
    throw new Error(`Referral ID : ${referralID} does not exist!`);
};

const getReferralDetails = async (userID: string) => {
  const data = await client.send(
    new GetItemCommand({
      TableName: referrerTableName,
      Key: {
        userID: {
          S: userID
        }
      }
    })
  );

  return {
    myReferralID: data.Item?.referralID?.["S"],
    referrer: data.Item?.referrer?.["S"]
  };
};

export default async function placeBid(
  placeBidData: any,
  chainId: number,
  privateKey: string,
  referralID?: string,
  userID?: string
) {
  let walletBalance;
  let gas;
  let gasRequired;

  const provider = getProvider(chainId) as providers.StaticJsonRpcProvider;
  const wallet = new Wallet(privateKey, provider);
  const easyAuction = getEasyAuctionContract(chainId);

  const feeData = await wallet.getFeeData();
  const gasPrice = feeData.gasPrice;

  if (gasPrice === null)
    throw new Error("An error occurred while estimating gas");

  walletBalance = await wallet.getBalance();
  gas = await easyAuction
    .connect(wallet)
    .estimateGas.placeSellOrders(
      placeBidData.auctionId,
      placeBidData._minBuyAmounts,
      placeBidData._sellAmounts,
      placeBidData._prevSellOrders,
      placeBidData.referralCode
    );
  gasRequired = gas.mul(gasPrice);
  if (walletBalance.lt(gasRequired))
    throw new Error(
      `Insufficient gas for placing a bid. Gas required: ${utils.formatEther(
        gasRequired
      )} ETH `
    );

  let hash;
  let signed;
  if (referralID && userID) {
    referralID = referralID.toString();
    userID = userID.toString();
    //throw error if referrer doesnt exist
    await checkReferrerExists(referralID);
    //check if you already have a referrer, proceed if it doesnt exist
    const { referrer, myReferralID } = await getReferralDetails(referralID);
    if (myReferralID === referralID) throw new Error("Cannot refer yourself!");
    if (!referrer) {
      const { txHash, signedTX } = await precomputeTxHash(
        chainId,
        placeBidData,
        privateKey,
        feeData,
        gas
      );
      signed = signedTX;
      hash = txHash;
      console.log(txHash);
      //add data to the database here
      await client.send(
        new PutItemCommand({
          TableName: referralTxsTableName,
          Item: {
            userID: { S: userID },
            referralID: { S: referralID },
            transactionHash: { S: txHash }
          }
        })
      );
    }
  }

  if (hash) {
    await provider.sendTransaction(signed);
    return hash;
  } else {
    const tx: Transaction = await easyAuction
      .connect(wallet)
      .placeSellOrders(
        placeBidData.auctionId,
        placeBidData._minBuyAmounts,
        placeBidData._sellAmounts,
        placeBidData._prevSellOrders,
        placeBidData.referralCode
      );

    return tx.hash;
  }
}
