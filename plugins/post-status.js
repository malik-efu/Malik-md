const { cmd } = require("../command");

cmd({
  pattern: "post",
  alias: ["status", "story"],
  desc: "Post media to WhatsApp status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { isCreator }) => {
  if (!isCreator) return await message.reply("*📛 Owner only command*");

  try {
    const quoted = message.quoted || message;
    
    // DEBUG: Check what we're receiving
    console.log("Message type:", message.type);
    console.log("Quoted type:", quoted.type);
    console.log("Has media:", quoted.hasMedia);
    console.log("Message content:", JSON.stringify(quoted, null, 2));

    // 1. Handle Text Status (direct text or quoted text)
    if (quoted.text && !quoted.message?.imageMessage && !quoted.message?.videoMessage) {
      try {
        await client.updateProfileStatus(quoted.text);
        return await message.reply("✅ Text status updated successfully!");
      } catch (e) {
        return await message.reply("❌ Failed to update text status: " + e.message);
      }
    }

    // 2. Handle Media Status - FIXED DETECTION
    let mediaBuffer;
    let mediaType = '';
    let caption = '';

    // Check for image
    if (quoted.message?.imageMessage || quoted.type === 'image') {
      mediaBuffer = await quoted.download();
      mediaType = 'image';
      caption = quoted.message?.imageMessage?.caption || quoted.caption || '';
    }
    // Check for video
    else if (quoted.message?.videoMessage || quoted.type === 'video') {
      mediaBuffer = await quoted.download();
      mediaType = 'video';
      caption = quoted.message?.videoMessage?.caption || quoted.caption || '';
    }
    // Check for document
    else if (quoted.message?.documentMessage || quoted.type === 'document') {
      mediaBuffer = await quoted.download();
      mediaType = 'document';
      caption = quoted.message?.documentMessage?.caption || quoted.caption || '';
    }
    // Fallback: try to download anyway if hasMedia is true
    else if (quoted.hasMedia) {
      mediaBuffer = await quoted.download();
      mediaType = quoted.type || 'media';
      caption = quoted.caption || '';
    }

    // If we found media, post it
    if (mediaBuffer) {
      try {
        // Method 1: Direct status posting (WhatsApp Business API)
        if (mediaType === 'image' || mediaType === 'video') {
          await client.sendMessage("status@broadcast", {
            [mediaType]: mediaBuffer,
            caption: caption
          }, {
            ephemeralExpiration: 86400
          });
        }
        
        // Method 2: Alternative approach for documents
        else if (mediaType === 'document') {
          await client.sendMessage("status@broadcast", {
            document: mediaBuffer,
            mimetype: quoted.message?.documentMessage?.mimetype || 'application/octet-stream',
            fileName: quoted.message?.documentMessage?.fileName || 'document'
          });
        }

        return await message.reply(`✅ ${mediaType.toUpperCase()} posted to status successfully!`);
        
      } catch (error) {
        return await message.reply(`❌ Failed to post ${mediaType}: ${error.message}`);
      }
    }

    // If no media detected but we have text, try text status
    if (quoted.text) {
      await client.updateProfileStatus(quoted.text);
      return await message.reply("✅ Text status updated!");
    }

    return await message.reply("❌ No media or text detected. Please reply to:\n• Text message\n• Image\n• Video\n• Document");

  } catch (error) {
    return await message.reply(`❌ Error: ${error.message}`);
  }
});
