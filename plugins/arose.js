const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');
const config = require('../config');
const { cmd } = require('../command');

// Helper function to get image from quoted message or current message
async function getQuotedOrOwnImageUrl(conn, m, quoted) {
    // 1) Quoted image (highest priority)
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 2) Image in the current message
    if (m.message?.imageMessage) {
        const stream = await downloadContentFromMessage(m.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    return null;
}

// Helper function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

cmd({
  pattern: "remini",
  alias: ["enhance", "aienhance"],
  react: "✨",
  desc: "Enhance image quality using AI",
  category: "image",
  use: ".remini <image_url> or reply to image",
  filename: __filename,
}, 
async (conn, mek, m, {
  from, l, quoted, body, isCmd, command, args, q, isGroup, sender, 
  senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
  groupMetadata, groupName, participants, isItzcp, groupAdmins, 
  isBotAdmins, isAdmins, reply 
}) => {
  try {
    let imageUrl = null;
    
    // Check if URL is provided in command
    if (q) {
      if (isValidUrl(q)) {
        imageUrl = q;
      } else {
        return reply('❌ Invalid URL provided.\n\nUsage: `.remini https://example.com/image.jpg`');
      }
    } else {
      // Try to get image from message or quoted message
      imageUrl = await getQuotedOrOwnImageUrl(conn, m, quoted);
      
      if (!imageUrl) {
        return reply(`📸 *Remini AI Enhancement Command*\n\nUsage:\n• .remini <image_url>\n• Reply to an image with .remini\n• Send image with .remini\n\nExample: .remini https://example.com/image.jpg`);
      }
    }

    // Call the Remini API
    const apiUrl = `https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(imageUrl)}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 60000, // 60 second timeout (AI processing takes longer)
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.data && response.data.success && response.data.result) {
      const result = response.data.result;
      
      if (result.image_url) {
        // Download the enhanced image
        const imageResponse = await axios.get(result.image_url, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        if (imageResponse.status === 200 && imageResponse.data) {
          // Send the enhanced image
          await conn.sendMessage(from, {
            image: imageResponse.data,
            caption: '✨ *Image enhanced successfully!*\n\n𝗘𝗡𝗛𝗔𝗡𝗖𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧',
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363416743041101@newsletter',
                newsletterName: "KnightBot AI",
                serverMessageId: 143,
              },
            },
          }, { quoted: m });
        } else {
          throw new Error('Failed to download enhanced image');
        }
      } else {
        throw new Error(result.message || 'Failed to enhance image');
      }
    } else {
      throw new Error('API returned invalid response');
    }

  } catch (error) {
    console.error('Remini Error:', error.message);
    
    let errorMessage = '❌ Failed to enhance image.';
    
    if (error.response?.status === 429) {
      errorMessage = '⏰ Rate limit exceeded. Please try again later.';
    } else if (error.response?.status === 400) {
      errorMessage = '❌ Invalid image URL or format.';
    } else if (error.response?.status === 500) {
      errorMessage = '🔧 Server error. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '⏰ Request timeout. Please try again.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      errorMessage = '🌐 Network error. Please check your connection.';
    } else if (error.message.includes('Error processing image')) {
      errorMessage = '❌ Image processing failed. Please try with a different image.';
    }
    
    reply(errorMessage);
  }
});
