const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "ssweb1",
    alias: ["ss"],
    react: "🕒",
    desc: "Take website screenshot",
    category: "tools",
    use: ".ssweb <url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`❀ Please enter the Link of a page.`)

        await reply("🕒 Taking screenshot...")

        const response = await axios.get(`https://image.thum.io/get/fullpage/${q}`, {
            responseType: 'arraybuffer',
            timeout: 30000
        })

        await conn.sendMessage(from, {
            image: response.data,
            caption: `🌐 Screenshot of: ${q}`
        }, { quoted: m })

    } catch (error) {
        console.error('Screenshot Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})
