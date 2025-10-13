const { cmd } = require("../command");
const axios = require('axios');

cmd({
    pattern: "img1",
    alias: ["image", "pic"],
    desc: "Search and send images",
    category: "search",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) return await message.reply("❌ Give search term\nExample: .img cats");

        await message.reply("🔍 Searching images...");

        // Using free Unsplash API for high-quality images
        const response = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(match)}&per_page=5&client_id=YOUR_ACCESS_KEY`);

        const images = response.data.results;
        
        if (!images.length) return await message.reply("❌ No images found");

        for (let i = 0; i < Math.min(images.length, 5); i++) {
            await client.sendMessage(message.jid, {
                image: { url: images[i].urls.regular },
                caption: `📸 ${match} - ${i + 1}/${Math.min(images.length, 5)}`
            });
        }

    } catch (error) {
        await message.reply("❌ Use: .img cats, .img dogs, .img cars");
    }
});
