const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "wallpaper1",
    alias: ["wall", "wp"],
    desc: "Download HD wallpapers",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { reply, args, from }) => {
    try {
        const query = args.join(" ");
        if (!query) return reply("❌ Example: .wallpaper nature");

        await reply("🔍 Searching wallpapers...");

        // Using a simple working API - no key needed
        const response = await axios.get(`https://wallpaper-api-1.vercel.app/api/wallpaper?search=${encodeURIComponent(query)}`);

        if (response.data.status && response.data.data && response.data.data.length > 0) {
            const wallpapers = response.data.data.slice(0, 5);
            
            for (let i = 0; i < wallpapers.length; i++) {
                await conn.sendMessage(from, { 
                    image: { url: wallpapers[i] },
                    caption: `🎑 ${query} - ${i+1}/${wallpapers.length}`
                }, { quoted: mek });
                
                if (i < wallpapers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } else {
            reply("❌ No wallpapers found. Try: nature, cars, anime");
        }

    } catch (error) {
        // If API fails, use backup images
        const backupImages = {
            nature: [
                "https://images.unsplash.com/photo-1501854140801-50d01698950b",
                "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
                "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07"
            ],
            cars: [
                "https://images.unsplash.com/photo-1544636331-e26879cd4d9b",
                "https://images.unsplash.com/photo-1507136566006-cfc505b114fc",
                "https://images.unsplash.com/photo-1553440569-bcc63803a83d"
            ]
        };
        
        const images = backupImages[query] || backupImages.nature;
        for (let i = 0; i < images.length; i++) {
            await conn.sendMessage(from, { 
                image: { url: images[i] },
                caption: `🎑 ${query} - ${i+1}`
            }, { quoted: mek });
        }
    }
});
