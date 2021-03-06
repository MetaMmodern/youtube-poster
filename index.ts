import "dotenv/config";
import TeleBot, { ConstructorOptions } from "node-telegram-bot-api";
import ytdl from "ytdl-core";

process.env.NTBA_FIX_319 = "1";

console.log(process.env);
const youtubeLinkRegexp =
  /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

const validateUser = (chatId: number) =>
  chatId.toString() === process.env.ALLOWED_USER_CHAT;

const botSettings: ConstructorOptions = {
  // polling: true,
  webHook: { port: Number(process.env.PORT), host: "0.0.0.0" },
};
const url = process.env.APP_URL || "https://youtube-poster.herokuapp.com:443";
const bot = new TeleBot(process.env.BOT_TOKEN ?? "", botSettings);

bot.setWebHook(`${url}/bot${process.env.BOT_TOKEN}`).then((v) => {
  console.log("Setted Webhook");
});

bot.on("message", function onMessage(msg) {
  bot.sendMessage(msg.chat.id, "I am alive on Heroku!");
});

bot.onText(youtubeLinkRegexp, async (msg) => {
  console.log("Youtube Link Recieved");
  if (!validateUser(msg.chat.id)) {
    console.log("Attempt to chat by impostor #" + msg.chat.id);
    await bot.sendMessage(
      msg.chat.id,
      "You are not allowed to use me, only Meta can)"
    );
    return;
  }
  if (msg.text) {
    console.log("Sending a video");
    console.log("Link: ", msg.text);

    const info = await ytdl.getInfo(msg.text);
    const stream = ytdl.downloadFromInfo(info);
    bot.sendMessage(msg.chat.id, "Downloading the file...");
    const bufs: Uint8Array[] = [];
    stream.on("data", (chunk) => {
      bufs.push(chunk);
    });
    stream.on("end", () => {
      console.log("Sending the file");
      bot.sendMessage(msg.chat.id, "Sending the file...");
      const data = Buffer.concat(bufs);
      bot
        .sendVideo(process.env.CHAT_ID!, data, {
          parse_mode: "HTML",
          caption: `<a href="${msg.text}">${info.videoDetails.title}</a>`,
        })
        .then(() => {
          console.log("Sent a Video");
          bot.sendMessage(msg.chat.id, "Sent the file.");
        })
        .catch((reason) => {
          bot.sendMessage(msg.chat.id, "Was not sent because: " + reason);
        });
    });
  }
});

bot.onText(/\/start/, async (msg) => {
  if (!validateUser(msg.chat.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "You are not allowed to use me, only Meta can)"
    );
    return;
  }
});
