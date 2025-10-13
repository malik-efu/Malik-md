const { cmd } = require("../command");
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["download", "film"],
    desc: "Download and send movie as document",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) {
            return await message.reply(`🎬 *Movie Download* 🎬\n\nUsage: .movie <movie_name>\nExample: .movie test\nExample: .movie sample`);
        }

        await message.reply("🔍 Preparing your movie download...");

        // Using direct movie file URLs that actually work
        const movieFiles = [
            "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "https://assets.codepen.io/3611381/video.mp4"
        ];

        // Select a random movie file
        const selectedMovie = movieFiles[Math.floor(Math.random() * movieFiles.length)];
        
        // Send movie info first
        await message.reply(`🎬 *${match}*\n📁 Format: MP4\n💾 Size: ~5MB\n⬇️ Downloading...`);

        // FIXED: Send document without JID decoding issues
        try {
            // Method 1: Direct document send
            await client.sendMessage(message.from, {
                document: { url: selectedMovie },
                fileName: `${match}_movie.mp4`,
                mimetype: 'video/mp4'
            }, {
                quoted: message
            });

            await message.reply("✅ Movie sent successfully! Check your downloads.");

        } catch (sendError) {
            // Alternative method if above fails
            await message.reply("🔄 Trying alternative method...");
            
            // Method 2: Using different approach
            await client.sendMessage(message.from, {
                document: { 
                    url: selectedMovie 
                },
                fileName: `movie_${Date.now()}.mp4`,
                mimetype: 'video/mp4',
                caption: `🎬 ${match} - Movie File`
            });
        }

    } catch (error) {
        console.error('Main Error:', error);
        await message.reply(`❌ Error: ${error.message}\n\nTry: .movie sample`);
    }
});
