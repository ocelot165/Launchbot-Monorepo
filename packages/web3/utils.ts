import { BigNumber, Contract, Wallet, ethers, providers } from "ethers";
import ERC20_FACTORY_ABI from "../abis/ERC20Factory.json";
import EASY_AUCTION_ABI from "../abis/easyAuction.json";
import ERC_20_ABI from "../abis/erc20ABI.json";
import REFERRAL_REWARD_MANAGER_ABI from "../abis/referralRewardManager.json";
import {
  EASY_AUCTION_ADDRESS,
  ERC20_FACTORY_ADDRESS,
  PYTH_CONTRACT_ADDRESS,
  REFERRAL_REWARD_MANAGER_ADDRESS
} from "../constants";
import IPythAbi from "@pythnetwork/pyth-sdk-solidity/abis/IPyth.json";
import { getAddress } from "ethers/lib/utils";

export function getEasyAuctionContract(
  chainId: number,
  wallet?: providers.BaseProvider | Wallet
): Contract {
  const c = new Contract(EASY_AUCTION_ADDRESS[chainId], EASY_AUCTION_ABI);

  if (wallet) return c.connect(wallet);

  return c;
}

export function getPythContract(
  chainId: number,
  wallet?: providers.BaseProvider | Wallet
): Contract {
  const c = new Contract(PYTH_CONTRACT_ADDRESS[chainId], IPythAbi);

  if (wallet) return c.connect(wallet);

  return c;
}

export function getReferralContract(
  chainId: number,
  wallet?: providers.BaseProvider | Wallet
): Contract {
  const c = new Contract(
    REFERRAL_REWARD_MANAGER_ADDRESS[chainId],
    REFERRAL_REWARD_MANAGER_ABI
  );

  if (wallet) c.connect(wallet);

  return c;
}

export function getTokenContract(
  address: string,
  wallet?: providers.BaseProvider | Wallet
): Contract {
  const c = new Contract(address, ERC_20_ABI);

  if (wallet) return c.connect(wallet);

  return c;
}

export function getPriceForOrder(buyAmount: BigNumber, sellAmount: BigNumber) {
  return sellAmount.mul(ethers.utils.parseEther("1")).div(buyAmount);
}

export function getERC20FactoryContract(
  chainId: number,
  wallet?: providers.BaseProvider | Wallet
): Contract {
  const c = new Contract(ERC20_FACTORY_ADDRESS[chainId], ERC20_FACTORY_ABI);

  if (wallet) c.connect(wallet);

  return c;
}

export function isAddress(a?: string) {
  try {
    getAddress(a || "0");
    return true;
  } catch (error) {
    return false;
  }
}
