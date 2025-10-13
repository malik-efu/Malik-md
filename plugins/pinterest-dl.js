const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "ssweb1",
    alias: ["ss", "screenshot"],
    react: "🌐",
    desc: "Take website screenshot",
    category: "tools",
    use: ".ssweb <url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a URL\nExample: .ssweb https://google.com")

        // Validate URL
        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            q = 'https://' + q;
        }

        await reply("📸 Taking screenshot...");

        // Use a free working screenshot API
        const apiUrl = `https://api.popcat.xyz/screenshot?url=${encodeURIComponent(q)}`;
        
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Check if we got valid image data
        if (!response.data || response.data.length < 1000) {
            throw new Error('Invalid image response');
        }

        await conn.sendMessage(from, {
            image: response.data,
            caption: `🌐 *Website Screenshot*\n\n📄 URL: ${q}\n\n✨ *Captured by Knight Bot*`
        }, { quoted: m });

    } catch (error) {
        console.error('Screenshot Error:', error);
        
        if (error.response?.status === 400) {
            reply("❌ Invalid URL or website blocked the screenshot");
        } else if (error.code === 'ECONNREFUSED') {
            reply("❌ Screenshot service unavailable. Try again later.");
        } else if (error.message.includes('Invalid image')) {
            reply("❌ Failed to capture screenshot. Website may be blocking.");
        } else {
            reply("❌ Failed to take screenshot. Try a different URL.");
        }
    }
});
