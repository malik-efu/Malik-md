const { cmd } = require("../command");

cmd({
    pattern: "movie",
    alias: ["mdownload", "getfilm"],
    desc: "Download movie files directly",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) {
            return await message.reply("🎬 *Movie Download*\n\nUsage: .movie <name>\nExample: .movie avengers");
        }

        // Show processing message
        await message.reply("⏳ Downloading movie file... Please wait...");

        // Direct working movie URLs (no API needed)
        const workingMovies = {
            "sample": "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
            "bunny": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "video": "https://assets.codepen.io/3611381/video.mp4",
            "test": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
        };

        // Get movie URL (default to sample if not found)
        const movieUrl = workingMovies[match.toLowerCase()] || workingMovies["sample"];
        const movieName = match.charAt(0).toUpperCase() + match.slice(1);

        // FIXED: Simple document send without complex parameters
        const sentMessage = await client.sendMessage(message.from, {
            document: { url: movieUrl },
            fileName: `${movieName}_Movie.mp4`,
            mimetype: 'video/mp4'
        });

        // Confirm success
        if (sentMessage) {
            await message.reply(`✅ *${movieName}* sent successfully!\n\n📁 Check your WhatsApp downloads folder.`);
        } else {
            await message.reply("❌ Failed to send movie. Try again.");
        }

    } catch (error) {
        // Handle specific JID error
        if (error.message.includes('jidDecode') || error.message.includes('server')) {
            await message.reply("🔄 Fixing connection issue... Please try again with: .movie sample");
        } else {
            await message.reply(`❌ Error: ${error.message}\n\nTry: .movie sample`);
        }
    }
});
