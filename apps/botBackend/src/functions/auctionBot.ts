import cors from "cors";
import express from "express";
import fetch from "node-fetch";
import http from "serverless-http";
import { getAuctionInfoMinimal } from "shared/graph/core/fetchers/auction";
import { Telegraf } from "telegraf";
import { registerAllCommands } from "../botInteractions/commands";
import registerAllMenuActions from "../botInteractions/menus";
import cancelAuctionNotifications from "../lib/cancelAuctionNotifications";
import cancelBids from "../lib/cancelBids";
import claimBids from "../lib/claimBids";
import claimReferralRewards from "../lib/claimReferralRewards";
import createAuction from "../lib/createAuction";
import createToken from "../lib/createToken";
import getAuctionNotificationDetails from "../lib/getAuctionNotificationDetails";
import notify from "../lib/notify";
import placeBid from "../lib/placeBid";
import processAuctionCreation from "../lib/processAuctionCreation";
import registerAuctionNotifications from "../lib/registerAuctionNotifications";
import {
  clearingPriceNotifications,
  registerClearingPriceNotifications,
  unRegisterClearingPriceNotifications
} from "../lib/registerClearingPriceNotifications";
import registerReferral from "../lib/registerReferral";
import {
  claimRevSharing,
  getRevSharingPerUser,
  isClaimOpenForUser
} from "../lib/revSharing";
import settleAuction from "../lib/settleAuction";
import { answerWebAppQueryWithTx } from "../lib/transaction";
import updateAuctionDescriptions from "../lib/updateAuctionDescriptions";
import { privateKeyFromId } from "../middleware/bot/privateKey";
import { asyncHandler, errorHandler } from "../middleware/express/handlers";
import { validateSecret } from "../middleware/express/validateSecret";
import { validateWebAppData } from "../middleware/express/validateWebAppData";
import precalculateSettlement from "../lib/preCalculateSettlement";
import approveAuctioningToken from "../lib/approveAuctioningToken";
import { getTokenPrices } from "shared/web3/getTokenPrices";
import { BIDDING_TOKENS } from "shared/constants";
import { isLambda } from "../lib/db";
import createGTMReferral from "../lib/createGTMReferral";
import getGTMReferralInfo from "../lib/getGTMReferralInfo";
import checkReferralExists from "../lib/checkReferralExists";

const CHAIN_ID = Number(process.env.CHAINID!);
declare var global: any;
global.fetch = fetch; //to prevent ethers webpack issue - https://github.com/ethers-io/ethers.js/issues/1312
const bot = new Telegraf(process.env.BOT_TOKEN!);
registerAllMenuActions(bot);
registerAllCommands(bot);
const app = express();

app.use(cors());

app.get("/", async (_, res) => {
  return res.status(200).json({
    message: "ok"
  });
});

app.post(
  "/auctionBotHandler",
  validateSecret,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    await bot.handleUpdate(context);
    return res.status(200).json({
      error: null
    });
  })
);

app.post(
  "/auctionBotHandler/getUserDetails",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { address } = await privateKeyFromId(context.userId);
    return res.status(200).json({
      account: address,
      chainId: CHAIN_ID
    });
  })
);

app.post(
  "/auctionBotHandler/getPrivateKey",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey } = await privateKeyFromId(context.userId);
    return res.status(200).json({
      privateKey
    });
  })
);

app.post(
  "/auctionBotHandler/webAppReply",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    await bot.telegram.answerWebAppQuery(context.queryId, {
      type: "article",
      id: "VIEW_AUCTION_FROM_ID",
      title: `Auction ${context.auctionId}`,
      input_message_content: {
        message_text: `/auction ${context.auctionID}`
      }
    });
    return res.status(200).json({
      error: null
    });
  })
);

app.post(
  "/auctionBotHandler/createAuctionHandler",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHash = await createAuction(
      context.auctionDetails,
      context.account,
      CHAIN_ID,
      privateKey
    );
    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Create Auction`,
      subText: `Creating a new Auction`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);

app.post(
  "/auctionBotHandler/approveForAuction",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHash = await approveAuctioningToken(
      context.amount,
      context.token,
      CHAIN_ID,
      privateKey
    );
    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Approve`,
      subText: `Approve`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);
app.post(
  "/auctionBotHandler/precalculateSellAmounts",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHashes = await precalculateSettlement(
      context.auctionId,
      CHAIN_ID,
      privateKey,
      context.numOrders
    );
    return res.status(200).json({
      error: null,
      transactions: txHashes
    });
  })
);

app.post(
  "/auctionBotHandler/settleAuctionHandler",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHash = await settleAuction(context.auctionId, CHAIN_ID, privateKey);
    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Settle Auction`,
      subText: `Settling Auction with ID: #${context.auctionId}`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);

app.post(
  "/auctionBotHandler/cancelBidHandler",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHash = await cancelBids(
      context.sellOrders,
      context.auctionId,
      privateKey,
      CHAIN_ID
    );
    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Cancel Order(s)`,
      subText: `Cancelling your sell orders`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);

app.post(
  "/auctionBotHandler/claimBidHandler",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHash = await claimBids(
      context.sellOrders,
      context.auctionId,
      privateKey,
      CHAIN_ID
    );
    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Claim Bid(s)`,
      subText: `Claiming your bids`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);

app.post(
  "/auctionBotHandler/placeBidHandler",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHash = await placeBid(
      context.placeBidDetails,
      CHAIN_ID,
      privateKey,
      context.gtmReferralID,
      context.userId
    );
    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Place Bid`,
      subText: `Placing your bid`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);

app.post(
  "/auctionBotHandler/registerReferralCode",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHash = await registerReferral(
      context.referralCode,
      CHAIN_ID,
      privateKey
    );
    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Register Referral`,
      subText: `Registering Referral ID`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);

app.post(
  "/auctionBotHandler/claimReferralRewards",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { privateKey, address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    const txHash = await claimReferralRewards(
      context.amount,
      context.token,
      CHAIN_ID,
      privateKey
    );
    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Claim Referral Rewards`,
      subText: `Claiming Rewards`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);

app.get(
  "/auctionBotHandler/auctionNotificationDetails",
  asyncHandler(async (req, res) => {
    const result = await getAuctionNotificationDetails(
      req.query["auctionId"] as string
    );
    return res.status(200).json(result);
  })
);

app.post(
  "/auctionBotHandler/registerAuctionNotifications",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { address } = await privateKeyFromId(context.userId);
    if (context.account.toLowerCase() !== address.toLowerCase())
      throw new Error("Client provided altered data");
    await registerAuctionNotifications(
      context.auctionId,
      context.chatId,
      address,
      CHAIN_ID,
      bot.telegram,
      context.userId
    );
    return res.status(200).json({
      error: null
    });
  })
);

app.post(
  "/auctionBotHandler/updateAuctionDescription",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { address } = await privateKeyFromId(context.userId);
    if (context.account.toLowerCase() !== address.toLowerCase())
      throw new Error("Client provided altered data");
    await updateAuctionDescriptions(
      context.auctionId,
      context.description,
      context.protocolName,
      context.protocolImageURI,
      context.tokenImageURI,
      context.endTimestamp,
      address,
      context.chainId
    );
    return res.status(200).json({
      error: null
    });
  })
);

app.post(
  "/auctionBotHandler/cancelAuctionNotifications",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { address } = await privateKeyFromId(context.userId);
    if (context.account !== address)
      throw new Error("Client provided altered data");
    await cancelAuctionNotifications(context.auctionId, address, CHAIN_ID);
    return res.status(200).json({
      error: null
    });
  })
);

app.post(
  "/auctionBotHandler/notifyWebhook",
  asyncHandler(async (req, res) => {
    var host = (isLambda ? "https://" : "http://") + req.get("host");
    const header = req.header("goldsky-webhook-secret");
    if (process.env.NOTIFY_WEBHOOK_SECRET! !== header) {
      throw new Error("Unauthorized");
    }
    const context = JSON.parse(req.body.toString("utf8"));
    const {
      op,
      data: { new: newRecord }
    } = context;
    if (op !== "INSERT") return res.status(200).json({}); //only display notifications when a new sell order is created
    const { auctionEndDate } = await getAuctionInfoMinimal(
      Number(process.env.CHAINID!),
      newRecord.auction
    );
    if (Date.now() / 1000 >= Number(auctionEndDate))
      throw new Error("Cannot notify once auction has ended");
    await notify(newRecord, bot.telegram, Number(process.env.CHAINID!), host);
    return res.status(200).json({
      error: null
    });
  })
);

app.post(
  "/auctionBotHandler/auctionInformationWebhook",
  asyncHandler(async (req, res) => {
    const header = req.header("goldsky-webhook-secret");
    if (process.env.INFO_WEBHOOK_SECRET! !== header) {
      throw new Error("Unauthorized");
    }
    const context = JSON.parse(req.body.toString("utf8"));
    const {
      op,
      data: { new: newRecord }
    } = context;
    if (op !== "INSERT") return res.status(200).json({});
    await processAuctionCreation(newRecord, Number(process.env.CHAINID!));
    return res.status(200).json({
      error: null
    });
  })
);

app.post(
  "/auctionBotHandler/createTokenHandler",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { name, symbol, supply } = context?.stageParams;

    const { address, privateKey } = await privateKeyFromId(context.userId);

    if (context.account !== address)
      throw new Error("Client provided altered data");

    const txHash = await createToken(
      name,
      symbol,
      supply,
      privateKey,
      Number(context.chainId)
    );

    return res.status(200).json({
      error: null,
      txHash,
      chainId: CHAIN_ID,
      header: `Create Token`,
      subText: `Creating a Token`,
      actionDisplay: "Back to Menu",
      action: "start"
    });
  })
);

app.get(
  "/auctionBotHandler/getRevSharingPerUser",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { address } = await privateKeyFromId(context.userId);

    if (context.account !== address)
      throw new Error("Client provided altered data");

    // item should follow the format:
    // {userAddress: string, timestamp: number, claimStatus: UserRevenueShareType (forfeit, unclaimed, claimed)}
    const response = await getRevSharingPerUser(
      address,
      10,
      context.lastEvaluatedKey
    );

    return res.status(200).json(response);
  })
);

app.get(
  "/auctionBotHandler/getBiddingTokenPrices",
  asyncHandler(async (_, res) => {
    const prices = await getTokenPrices(BIDDING_TOKENS[CHAIN_ID], CHAIN_ID);
    return res.status(200).json(prices);
  })
);

app.post(
  "/auctionBotHandler/claimRevSharing",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { address } = await privateKeyFromId(context.userId);

    if (context.account !== address)
      throw new Error("Client provided altered data");

    await claimRevSharing(address);

    return res.status(200).json({
      error: null
    });
  })
);

app.get(
  "/auctionBotHandler/isClaimOpenForUser",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    const { address } = await privateKeyFromId(context.userId);

    if (context.account !== address)
      throw new Error("Client provided altered data");

    const isClaimOpen = await isClaimOpenForUser(address);

    return res.status(200).json({
      isClaimOpen
    });
  })
);

app.post(
  "/auctionBotHandler/createGTMReferral",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));

    await createGTMReferral(context.referralID, context.userId);

    return res.status(200).json();
  })
);

app.get(
  "/auctionBotHandler/gtmReferralInfo",
  asyncHandler(async (req, res) => {
    console.log(req.query);
    const data = await getGTMReferralInfo(req.query["userId"] as string);

    return res.status(200).json(data);
  })
);

app.get(
  "/auctionBotHandler/checkReferralExists",
  asyncHandler(async (req, res) => {
    const doesExist = await checkReferralExists(
      req.query["referralId"] as string
    );

    return res.status(200).json({ doesExist });
  })
);

app.post(
  "/auctionBotHandler/subscribeClearingPriceNotifications",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    await registerClearingPriceNotifications(
      context.auctionId,
      context.account,
      CHAIN_ID,
      context.userId
    );
    return res.status(200).json({
      error: null
    });
  })
);

app.post(
  "/auctionBotHandler/unsubscribeClearingPriceNotifications",
  validateWebAppData,
  asyncHandler(async (req, res) => {
    const context = JSON.parse(req.body.toString("utf8"));
    await unRegisterClearingPriceNotifications(
      context.auctionId,
      context.account,
      CHAIN_ID
    );
    return res.status(200).json({
      error: null
    });
  })
);

app.get(
  "/auctionBotHandler/clearingPriceNotifications",
  asyncHandler(async (req, res) => {
    const result = await clearingPriceNotifications(
      req.query["auctionId"] as string,
      req.query["address"] as string,
      CHAIN_ID
    );
    return res.status(200).json(result);
  })
);

app.use(errorHandler);

app.use((_, res) => {
  return res.status(404).json({
    error: "Not Found"
  });
});

export const handler = http(app);
