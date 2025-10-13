const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "wallpaper",
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

        // Using working Wallhaven API
        const url = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&sorting=random&atleast=1920x1080`;
        const response = await axios.get(url);

        // Validate response
        if (!response.data?.data || response.data.data.length === 0) {
            return reply("❌ No wallpapers found. Try: .wallpaper nature, .wallpaper cars, .wallpaper anime");
        }

        const wallpapers = response.data.data;
        // Get 5 random HD wallpapers
        const selectedWallpapers = wallpapers
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);

        for (const wallpaper of selectedWallpapers) {
            await conn.sendMessage(
                from,
                { 
                    image: { url: wallpaper.path },
                    caption: `🎑 ${query} - HD Wallpaper\n📐 Resolution: ${wallpaper.resolution}\n⭐ Favorites: ${wallpaper.favorites}\n> © Powered by 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟`
                },
                { quoted: mek }
            );
            // Add delay between sends
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('Wallpaper Search Error:', error);
        reply(`❌ Error: ${error.message || "Failed to fetch wallpapers"}`);
    }
});
