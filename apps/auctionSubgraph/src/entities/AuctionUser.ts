import { Address, BigInt } from "@graphprotocol/graph-ts";
import { REFERRAL_ADDRESS } from "const";
import { ReferralRewardManager } from "../../generated/ReferralRewardManager/ReferralRewardManager";
import { AuctionUser } from "../../generated/schema";

export function getAuctionUser(
  userId: BigInt,
  userAddress: string
): AuctionUser {
  const id = userId.toString();
  let auctionUser = AuctionUser.load(id);
  if (!auctionUser) {
    const referralContract = ReferralRewardManager.bind(REFERRAL_ADDRESS);
    auctionUser = new AuctionUser(id);
    let addy = Address.fromString(userAddress);
    auctionUser.address = addy;
    let code = referralContract.addressToCode(addy);
    if (code !== "") {
      auctionUser.referral = code;
    }
    auctionUser.save();
  }

  return auctionUser;
}
