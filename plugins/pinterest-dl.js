const { cmd } = require("../command");
const fetch = require('node-fetch');

cmd({
    pattern: "pindl",
    alias: ["pinterest"],
    desc: "Download Pinterest videos for free",
    category: "download", 
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) return await message.reply("❌ Usage: .pindl <pinterest_url>");

        await message.reply("⬇️ Downloading Pinterest video...");

        // Free Pinterest downloader API
        const apiUrl = `https://api.pinterestdownloader.com/`;
        
        const formData = new URLSearchParams();
        formData.append('url', match);

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await response.json();
        
        if (data.download_url) {
            await client.sendMessage(message.jid, {
                video: { url: data.download_url },
                caption: "📌 Pinterest Video Downloaded!"
            });
        } else {
            await message.reply("❌ Could not download this Pinterest video.");
        }

    } catch (error) {
        await message.reply("❌ Invalid Pinterest URL or download failed.");
    }
});
