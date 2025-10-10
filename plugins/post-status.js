const { cmd } = require("../command");
const { writeFileSync, unlinkSync } = require("fs");
const fs = require("fs").promises;

cmd({
  pattern: "post",
  alias: ["status", "story"],
  desc: "Post media/text to WhatsApp status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { isCreator }) => {
  if (!isCreator) return await message.reply("*📛 Owner only command*");

  const quoted = message.quoted || message;
  
  try {
    // 1. Handle Text Status
    if (quoted.text && !(quoted.message?.imageMessage || quoted.message?.videoMessage || quoted.message?.documentMessage)) {
      try {
        await client.updateProfileStatus(quoted.text);
        return await message.reply("✅ Text status updated successfully!");
      } catch (e) {
        return await message.reply("❌ Failed to update text status: " + e.message);
      }
    }

    // 2. Handle Media Status (Image/Video)
    if (quoted.hasMedia || quoted.message?.imageMessage || quoted.message?.videoMessage) {
      const mediaBuffer = await quoted.download();
      const mediaType = quoted.type || quoted.mediaType;
      const caption = quoted.caption || quoted.text || "";
      
      // Determine media type
      let mediaKey = "image";
      let fileExtension = ".jpg";
      
      if (mediaType.includes("video") || quoted.message?.videoMessage) {
        mediaKey = "video";
        fileExtension = ".mp4";
      } else if (mediaType.includes("image") || quoted.message?.imageMessage) {
        mediaKey = "image";
        fileExtension = ".jpg";
      }

      // Create temporary file
      const tempFilePath = `./temp_status${fileExtension}`;
      writeFileSync(tempFilePath, mediaBuffer);

      try {
        // Method 1: Direct status broadcast
        await client.sendMessage("status@broadcast", {
          [mediaKey]: mediaBuffer,
          caption: caption,
          mimetype: mediaKey === "image" ? "image/jpeg" : "video/mp4"
        }, {
          ephemeralExpiration: 86400 // 24 hours
        });

        // Method 2: Alternative approach
        await client.setProfilePicture(mediaBuffer);

        // Clean up temp file
        unlinkSync(tempFilePath);
        
        return await message.reply(`✅ ${mediaKey.toUpperCase()} posted to status successfully!`);
        
      } catch (error) {
        // Clean up on error
        if (fs.existsSync(tempFilePath)) {
          unlinkSync(tempFilePath);
        }
        return await message.reply(`❌ Failed to post media: ${error.message}`);
      }
    }

    // 3. Handle Document/File Status
    if (quoted.message?.documentMessage) {
      try {
        const documentBuffer = await quoted.download();
        const documentName = quoted.message.documentMessage.fileName || "document";
        
        await client.sendMessage("status@broadcast", {
          document: documentBuffer,
          fileName: documentName,
          mimetype: quoted.message.documentMessage.mimetype
        });
        
        return await message.reply("✅ Document posted to status!");
      } catch (e) {
        return await message.reply("❌ Failed to post document: " + e.message);
      }
    }

    return await message.reply("⚠️ Please reply to:\n• Text message for text status\n• Image/Video for media status\n• Document for file status");

  } catch (error) {
    return await message.reply(`❌ Unexpected error: ${error.message}`);
  }
});
