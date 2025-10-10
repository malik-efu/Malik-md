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
    // Check if it's text and not media
    if (quoted.text && quoted.type !== 'image' && quoted.type !== 'video') {
      await client.updateProfileStatus(quoted.text);
      return await message.reply("✅ Text status updated!");
    }

    // Check if it's media (image or video)
    if (quoted.type === 'image' || quoted.type === 'video') {
      const media = await quoted.download();
      const mediaType = quoted.type;
      const mimeType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4';

      let success = false;
      
      // Method 1: Direct status post
      try {
        await client.sendMessage("status@broadcast", {
          [mediaType]: media,
          caption: quoted.caption || "",
          mimetype: mimeType
        });
        success = true;
      } catch (e) {
        console.error("Method 1 failed:", e);
      }

      // Method 2: Alternative approach
      if (!success) {
        try {
          await client.setProfilePicture(media);
          success = true;
        } catch (e) {
          console.error("Method 2 failed:", e);
        }
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
