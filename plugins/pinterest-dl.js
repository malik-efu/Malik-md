const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "ssweb",
    alias: ["ss", "screenshot"],
    react: "🌐",
    desc: "Take website screenshot",
    category: "tools",
    use: ".ssweb <url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❀ Please enter a website URL.\nExample: .ssweb https://google.com")

        // Validate URL
        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            return reply("❌ Please provide a valid URL starting with http:// or https://")
        }

        await reply("🕒 Taking screenshot...")

        // Try multiple screenshot APIs
        const apis = [
            `https://api.screenshotmachine.com?key=public&url=${encodeURIComponent(q)}&size=X`,
            `https://image.thum.io/get/width/1920/crop/1080/fullpage/${encodeURIComponent(q)}`,
            `https://api.apiflash.com/v1/urltoimage?access_key=YOUR_API_KEY&url=${encodeURIComponent(q)}&full_page=true`
        ]

        let screenshotBuffer = null;
        let apiError = null;

        for (let apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, {
                    responseType: 'arraybuffer',
                    timeout: 45000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                })

                if (response.status === 200 && response.data && response.data.length > 1000) {
                    screenshotBuffer = response.data;
                    break;
                }
            } catch (error) {
                apiError = error;
                continue;
            }
        }

        if (!screenshotBuffer) {
            return reply(`❌ Failed to take screenshot of "${q}"\n\nPossible reasons:\n• Website is blocking screenshots\n• Website is down\n• Invalid URL\n• API services are busy`)
        }

        await conn.sendMessage(from, {
            image: screenshotBuffer,
            caption: `🌐 *Website Screenshot*\n\n📄 URL: ${q}\n\n📸 *Captured by Knight Bot*`
        }, { quoted: m })

    } catch (error) {
        console.error('Screenshot Error:', error)
        
        if (error.response?.status === 502) {
            reply("❌ Screenshot service is temporarily unavailable. Please try again later.")
        } else if (error.code === 'ECONNREFUSED') {
            reply("❌ Cannot connect to screenshot service. Check your internet.")
        } else if (error.code === 'TIMEOUT') {
            reply("❌ Screenshot timeout. Website took too long to load.")
        } else {
            reply(`❌ Failed to take screenshot: ${error.message}`)
        }
    }
})
