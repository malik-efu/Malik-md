const { cmd } = require("../command");
const axios = require('axios');

cmd({
    pattern: "pindl",
    alias: ["pinterest", "pindownload"],
    desc: "Download Pinterest videos",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) {
            return await message.reply(`📌 *Pinterest Download* 📌\n\nUsage: .pindl <pinterest_url>\nExample: .pindl https://pin.it/example`);
        }

        await message.reply("🔍 Downloading from Pinterest...");

        // Extract Pinterest URL
        const pinUrl = match.startsWith('http') ? match : `https://pin.it/${match}`;
        
        // Use Pinterest downloader API
        const apiUrl = `https://pinterest-video-api.p.rapidapi.com/download?url=${encodeURIComponent(pinUrl)}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'X-RapidAPI-Key': 'adb03fd619msh91f2556557237f4p10f659jsn96ca8c5079ee',
                'X-RapidAPI-Host': 'pinterest-video-api.p.rapidapi.com'
            }
        });

        if (response.data.url || response.data.video_url) {
            const videoUrl = response.data.url || response.data.video_url;
            
            // Send as video
            await client.sendMessage(message.jid, {
                video: { url: videoUrl },
                caption: "📌 Pinterest Video Downloaded Successfully!"
            });
            
        } else {
            await message.reply("❌ No video found in this Pinterest link.");
        }

    } catch (error) {
        await message.reply("❌ Failed to download. Check if it's a valid Pinterest video URL.");
    }
});
