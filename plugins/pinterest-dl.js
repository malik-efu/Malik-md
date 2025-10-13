const { cmd } = require("../command");

cmd({
    pattern: "pindl",
    alias: ["pinterest"],
    desc: "Download Pinterest videos",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) return await message.reply("❌ Give Pinterest URL");
        
        await message.reply("🔄 Processing...");
        
        // Method 1: Try social downloader API
        const apiUrl = `https://socialdl.org/api?url=${encodeURIComponent(match)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.url) {
            await client.sendMessage(message.jid, {
                video: { url: data.url },
                caption: "✅ Downloaded from Pinterest"
            });
            return;
        }
        
        // If method 1 fails, use method 2
        await message.reply("❌ Pinterest download not working currently. Use Instagram/Facebook download instead.");
        
    } catch (error) {
        await message.reply("❌ Pinterest download failed. Try Instagram: .igdl <url>");
    }
});
