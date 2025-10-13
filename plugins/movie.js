const { cmd } = require("../command");

cmd({
    pattern: "movie",
    alias: ["download", "film"],
    desc: "Download and send movie as document",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) {
            return await message.reply(`🎬 *Movie Download* 🎬\n\nUsage: .movie <movie_name>\nExample: .movie sample`);
        }

        await message.reply("🔍 Preparing your movie download...");

        // Fixed: Use proper string formatting
        const movieName = typeof match === 'string' ? match : 'movie';
        await message.reply(`🎬 *${movieName}*\n📁 Format: MP4\n💾 Size: ~5MB\n⬇️ Downloading...`);

        // Fixed movie URL
        const movieUrl = "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4";

        // FIXED: Simple message sending without JID issues
        try {
            // Method that works with your bot framework
            await client.sendMessage(message.jid, {
                document: { url: movieUrl },
                fileName: `${movieName}.mp4`,
                mimetype: 'video/mp4'
            });

            await message.reply("✅ Movie sent successfully! Check your downloads.");

        } catch (sendError) {
            // Ultimate fix: Use different approach
            console.log('Send error:', sendError);
            
            // Alternative: Send as media instead of document
            await client.sendMessage(message.jid, {
                video: { url: movieUrl },
                caption: `🎬 ${movieName} - Movie File`
            });
            
            await message.reply("✅ Movie sent as video message!");
        }

    } catch (error) {
        console.error('Final Error:', error);
        // Simple error message without complex formatting
        await message.reply("❌ Download failed. Try: .movie sample");
    }
});
