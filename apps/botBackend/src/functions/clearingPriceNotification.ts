import fetch from "node-fetch";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

export const consume = async (event) => {
  for (const record of event.Records) {
    console.log("sending message", record.body);
    const message = JSON.parse(record.body);
    try {
      await sendTelegramMessage(message);
    } catch (e) {
      console.error(e);
    }
  }
};

const sendTelegramMessage = async (message) => {
  const { tgUserId, auctionId, clearingPrice } = message;
  const text = `🚨 Alert: One of your bid for Auction ID #${auctionId} is below the current clearing price of ${clearingPrice}. Please consider cancelling and increasing your bid to remain competitive in the auction.`;

  const response = await fetch(telegramApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: tgUserId, text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to send message: ${errorText}`);
    throw new Error(`Telegram API error: ${errorText}`);
  }
};
