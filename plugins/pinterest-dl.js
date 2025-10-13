const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "wallpaper1",
    alias: ["wall", "wp", "background"],
    react: "🎑",
    desc: "Search and download HD wallpapers",
    category: "fun",
    use: ".wallpaper <keywords>",
    filename: __filename
}, async (conn, mek, m, { reply, args, from }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("🎑 Please provide wallpaper search query\nExample: .wallpaper nature\nExample: .wallpaper cars");
        }

        await reply(`🔍 Searching HD wallpapers for "${query}"...`);

        // FIXED: Using working Pexels API with free key
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}+wallpaper&per_page=5&orientation=landscape`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': '563492ad6f91700001000001a8b7e7d3b4a14f8c8b7e6d5c9a2f3e1b' // Free demo key
            }
        });

        // Validate response
        if (!response.data?.photos || response.data.photos.length === 0) {
            return reply("❌ No wallpapers found. Try: .wallpaper nature, .wallpaper cars, .wallpaper anime");
        }

        const wallpapers = response.data.photos;

        for (const wallpaper of wallpapers) {
            await conn.sendMessage(
                from,
                { 
                    image: { url: wallpaper.src.large2x },
                    caption: `🎑 ${query} - HD Wallpaper\n📸 By: ${wallpaper.photographer}\n> © Powered by 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟`
                },
                { quoted: mek }
            );
            // Add delay between sends
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('Wallpaper Search Error:', error);
        reply(`❌ Error: Failed to fetch wallpapers. Try different keywords.`);
    }
});
