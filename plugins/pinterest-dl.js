const { cmd } = require("../command");

cmd({
    pattern: "pindl",
    alias: ["pinterest"],
    desc: "Download Pinterest videos",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) return await message.reply("❌ Give Pinterest URL\nExample: .pindl https://pin.it/example");

        await message.reply("📥 Downloading...");
        
        // Simple direct method - use a working Pinterest downloader
        const apiUrl = `https://pinterest-downloader.download/api/download?url=${encodeURIComponent(match)}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.url) {
            await client.sendMessage(message.jid, {
                video: { url: data.url },
                caption: "✅ Pinterest Video Downloaded"
            });
        } else {
            await message.reply("❌ No video found");
        }

    } catch (error) {
        await message.reply("❌ Use valid Pinterest video URL");
    }
});
