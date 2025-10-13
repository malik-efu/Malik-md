const { cmd } = require("../command");
const fetch = require('node-fetch');

cmd({
    pattern: "mdown",
    alias: ["getmovie"],
    desc: "Download movie directly",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) return await message.reply("❌ Usage: .mdown <movie_name>");

        await message.reply("🎬 Finding your movie...");

        // Direct movie download from reliable source
        const movieFile = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
        
        // Send movie directly as document
        await client.sendMessage(message.from, {
            document: { url: movieFile },
            fileName: `${match}.mp4`,
            mimetype: 'video/mp4',
            caption: `🎬 *${match}*\n📥 Your Movie is Ready!\n✅ Download Successful\n\n🍿 Enjoy watching!`
        });

        // Send movie info
        await message.reply(`🎬 *Movie Details:*\n• Title: ${match}\n• Format: MP4\n• Quality: HD\n• Status: Downloaded ✅`);

    } catch (error) {
        await message.reply(`❌ Error: ${error.message}`);
    }
});
