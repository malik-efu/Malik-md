const { cmd } = require("../command");

cmd({
    pattern: "testmovie",
    alias: ["tmovie"],
    desc: "Test movie download",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        await message.reply("🎬 Sending test movie...");
        
        // Simple direct URL that always works
        const testMovie = "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4";
        
        // Send without complex parameters
        await client.sendMessage(message.from, {
            document: { url: testMovie },
            fileName: "Test_Movie.mp4",
            mimetype: "video/mp4"
        });

        await message.reply("✅ Test movie sent! Check your downloads.");

    } catch (error) {
        await message.reply(`❌ Test failed: ${error.message}`);
    }
});
