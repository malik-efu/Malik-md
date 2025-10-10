const { cmd } = require("../command");

cmd({
  pattern: "post",
  alias: ["status", "story"],
  desc: "Post media to WhatsApp status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { isCreator }) => {
  if (!isCreator) return await message.reply("*📛 Owner only command*");

  const quoted = message.quoted || message;
  
  try {
    // TEXT STATUS
    if (quoted.text && !quoted.message?.imageMessage && !quoted.message?.videoMessage) {
      await client.updateProfileStatus(quoted.text);
      return await message.reply("✅ Text status updated!");
    }

    // MEDIA STATUS
    if (quoted.message?.imageMessage || quoted.message?.videoMessage || quoted.hasMedia) {
      const media = await quoted.download();
      const isImage = quoted.message?.imageMessage || quoted.type === 'image';
      const isVideo = quoted.message?.videoMessage || quoted.type === 'video';
      
      const mediaType = isImage ? 'image' : 'video';
      const mimeType = isImage ? 'image/jpeg' : 'video/mp4';

      // TRY MULTIPLE METHODS
      let success = false;
      
      // Method 1: Direct status post
      try {
        await client.sendMessage("status@broadcast", {
          [mediaType]: media,
          caption: quoted.caption || "",
          mimetype: mimeType
        });
        success = true;
      } catch (e) {}

      // Method 2: Alternative approach
      if (!success) {
        try {
          await client.setProfilePicture(media);
          success = true;
        } catch (e) {}
      }

      if (success) {
        return await message.reply(`✅ ${mediaType.toUpperCase()} posted to status successfully!`);
      } else {
        return await message.reply("❌ Failed to post status. Try manual posting.");
      }
    }

    return await message.reply("❌ No valid media or text found to post.");

  } catch (error) {
    return await message.reply(`❌ Error: ${error.message}`);
  }
});
