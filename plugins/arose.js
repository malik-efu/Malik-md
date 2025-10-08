
const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "remini",
    alias: ["enhance"],
    react: "✨",
    desc: "Enhance image quality using AI",
    category: "image",
    use: ".remini <image_url>",
    filename: __filename,
}, 
async (conn, mek, m, { from, quoted, q, reply }) => {
    try {
        if (!q) {
            return reply("📸 *Remini AI Enhancement*\n\nSend: .remini <image_url>\nExample: .remini https://example.com/image.jpg");
        }

        // Simple URL validation
        if (!q.startsWith('http')) {
            return reply("❌ Please provide a valid URL starting with http:// or https://");
        }

        await reply("⏳ Enhancing your image... Please wait!");

        const apiUrl = `https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(q)}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });

        if (response.data?.success && response.data.result?.image_url) {
            const enhancedUrl = response.data.result.image_url;
            
            await conn.sendMessage(from, {
                image: { url: enhancedUrl },
                caption: "✨ *Image Enhanced Successfully!*\n\nEnhanced by Knight-Bot",
            }, { quoted: m });
            
        } else {
            throw new Error("API returned no image");
        }

    } catch (error) {
        console.error('Remini Error:', error.message);
        
        if (error.response?.status === 429) {
            reply("⏰ Too many requests. Try again later.");
        } else if (error.code === 'ECONNABORTED') {
            reply("⏰ Request timeout. Try again.");
        } else {
            reply("❌ Failed to enhance image. Check URL and try again.");
        }
    }
});
