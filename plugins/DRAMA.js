const { cmd } = require("../command");

cmd({
  pattern: "posta",
  alias: ["status", "story"],
  desc: "Post text, image, or video to WhatsApp status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { isCreator }) => {
  if (!isCreator) return await message.reply("*📛 Owner only command*");

  const quoted = message.quoted || message;

  // 1. Handle Text Status
  if (quoted.text && !quoted.hasMedia) {
    try {
      const text = quoted.text.trim();
      if (!text) return await message.reply("⚠ Text cannot be empty");

      // WhatsApp status text update
      await client.sendMessage("status@broadcast", {
        text: text,
        backgroundColor: "#000000", // Optional: Customize background color
        font: 1 // Optional: Font style (1-5)
      }, { statusJidList: [] }); // Empty list for all contacts

      return await message.reply("✅ Text status posted successfully");
    } catch (error) {
      console.error("Text Status Error:", error);
      return await message.reply(`❌ Failed to post text status: ${error.message}`);
    }
  }

  // 2. Handle Media Status (Image or Video)
  if (quoted.hasMedia) {
    try {
      const media = await quoted.downloadMedia(); // Use downloadMedia for Baileys
      if (!media) return await message.reply("⚠ No media found");

      const caption = quoted.caption || "";
      let messageType;

      // Determine media type
      if (quoted.type === "imageMessage") {
        messageType = "image";
      } else if (quoted.type === "videoMessage") {
        messageType = "video";
        // Check video duration (WhatsApp status videos must be ≤ 30 seconds)
        if (quoted.videoMessage?.seconds > 30) {
          return await message.reply("⚠ Video duration must be 30 seconds or less");
        }
      } else {
        return await message.reply("⚠ Unsupported media type");
      }

      // Post media to status
      await client.sendMessage("status@broadcast", {
        [messageType]: {
          url: media.url || media, // Use media URL or buffer
          mimetype: quoted.mimetype || (messageType === "image" ? "image/jpeg" : "video/mp4")
        },
        caption: caption
      }, { statusJidList: [] }); // Empty list for all contacts

      return await message.reply(`✅ ${messageType.charAt(0).toUpperCase() + messageType.slice(1)} status posted successfully`);
    } catch (error) {
      console.error("Media Status Error:", error);
      return await message.reply(`❌ Failed to post media status: ${error.message}`);
    }
  }

  return await message.reply("⚠ Please reply to text, image, or video to post as status");
});
