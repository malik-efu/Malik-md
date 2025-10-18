const { cmd } = require('../command');
const { MessageMedia } = require('whatsapp-web.js'); // Standard WhatsApp Bot Library
const axios = require('axios'); // Used for making web requests (e.g., to fetch sticker images)

// --- 🔑 STEP 1: Conceptual Sticker Pack Database ---
// In a real implementation, this JSON data would be loaded from a file, a database, 
// or fetched from a custom API you host.
const StickerPackDB = {
    "CAT": {
        name: "Cute Cats",
        count: 4,
        source: "https://your-sticker-host.com/packs/cat/",
        urls: [
            "https://your-sticker-host.com/packs/cat/cat_happy.webp",
            "https://your-sticker-host.com/packs/cat/cat_sleep.webp",
            "https://your-sticker-host.com/packs/cat/cat_angry.webp",
            "https://your-sticker-host.com/packs/cat/cat_meow.webp"
        ]
    },
    "MEME": {
        name: "Classic Memes",
        count: 5,
        source: "https://some-api-source.net/memes/",
        urls: [
            "https://some-api-source.net/memes/meme1.webp",
            "https://some-api-source.net/memes/meme2.webp",
            "https://some-api-source.net/memes/meme3.webp",
            "https://some-api-source.net/memes/meme4.webp",
            "https://some-api-source.net/memes/meme5.webp"
        ]
    }
    // You would add more packs here...
};

// --- 🚀 STEP 2: The Command Logic ---

cmd({
    pattern: "pack",
    alias: ["stickerpack", "getpack"],
    react: "📦",
    desc: "Sends all stickers from a specific pack by its keyword.",
    category: "stickers",
    use: 'Use !pack <keyword> (e.g., !pack CAT)',
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    
    // 1. Validate Input
    if (!text) {
        let packsList = Object.keys(StickerPackDB).join(', ');
        return reply(`❌ Please provide a sticker pack keyword. Available packs: *${packsList}*`);
    }

    const keyword = text.toUpperCase();
    const pack = StickerPackDB[keyword];

    if (!pack) {
        let packsList = Object.keys(StickerPackDB).join(', ');
        return reply(`🤷‍♂️ Sticker pack with keyword *${keyword}* not found. Try: *${packsList}*`);
    }

    // 2. Start Sending Process
    await reply(`✅ Sending pack: *${pack.name}* (${pack.count} stickers). Please wait...`);

    // 3. Iterate through each sticker URL and send it
    for (let i = 0; i < pack.urls.length; i++) {
        const url = pack.urls[i];
        
        try {
            // Fetch the WEBP file directly using axios
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            
            // Create a MessageMedia object from the binary data
            const media = new MessageMedia(
                'image/webp', 
                Buffer.from(response.data).toString('base64'),
                `${keyword}_sticker_${i}.webp`
            );

            // Send the sticker message
            await conn.sendMessage(from, media, { 
                sendMediaAsSticker: true,
                quoted: mek // Reply to the user's command
            });
            
        } catch (error) {
            console.error(`Error sending sticker ${i+1} from pack ${keyword}:`, error);
            // Optionally, skip to the next sticker if one fails
        }
        // Optional delay to prevent rate limiting (important for large packs)
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    await reply(`🎉 All *${pack.name}* stickers have been sent!`);
});
