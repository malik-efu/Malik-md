const { cmd } = require("../command");

cmd({
    pattern: "img",
    alias: ["image"],
    desc: "Search images",
    category: "search",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) return await message.reply("❌ Example: .img cats");

        await message.reply("📸 Sending sample images...");

        // Sample image URLs for testing
        const sampleImages = {
            cats: [
                "https://cdn.pixabay.com/photo/2017/02/20/18/03/cat-2083492_1280.jpg",
                "https://cdn.pixabay.com/photo/2014/11/30/14/11/cat-551554_1280.jpg"
            ],
            dogs: [
                "https://cdn.pixabay.com/photo/2018/03/31/06/31/dog-3277416_1280.jpg",
                "https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_1280.jpg"
            ],
            cars: [
                "https://cdn.pixabay.com/photo/2012/11/02/13/02/car-63930_1280.jpg",
                "https://cdn.pixabay.com/photo/2015/05/28/23/12/auto-788747_1280.jpg"
            ]
        };

        const images = sampleImages[match.toLowerCase()] || sampleImages.cats;
        
        for (let i = 0; i < images.length; i++) {
            await client.sendMessage(message.jid, {
                image: { url: images[i] },
                caption: `📸 ${match} - ${i + 1}`
            });
        }

    } catch (error) {
        await message.reply("❌ Try: .img cats, .img dogs, .img cars");
    }
});
