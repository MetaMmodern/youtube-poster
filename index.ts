import "dotenv/config";
import TeleBot, { ConstructorOptions } from "node-telegram-bot-api";
import ytdl from "ytdl-core";
import stream, { PassThrough, Stream } from "stream";
import path from "path";
import fs from "fs";
process.env.NTBA_FIX_319 = "1";
const youtubeLinkRegexp =
  /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

const validateUser = (chatId: number) =>
  chatId.toString() === process.env.ALLOWED_USER_CHAT;

const botSettings: ConstructorOptions = { polling: true };
const bot = new TeleBot(process.env.BOT_TOKEN ?? "", botSettings);

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
        .sendVideo(msg.chat.id, data, {
          parse_mode: "MarkdownV2",
          caption: `[${info.videoDetails.title}](${msg.text})`,
        })
        .then(() => {
          console.log("Sent a Video");
          bot.sendMessage(msg.chat.id, "Sent the file.");
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
