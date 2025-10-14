
const { cmd } = require('../command');

cmd({
    pattern: "insult",
    alias: ["roast"],
    react: "🔥",
    desc: "Sends a random insult to the mentioned user",
    category: "fun",
    use: ".insult @user",
    filename: __filename
}, async (conn, mek, m, { from, mentions, reply }) => {
    try {
        const insults = [
            "You're like a cloud. When you disappear, it's a beautiful day!",
            "You bring everyone so much joy when you leave the room!",
            "I'd agree with you, but then we'd both be wrong.",
            "You're not stupid; you just have bad luck thinking.",
            "Your secrets are always safe with me. I never even listen to them.",
            "You have a face for radio.",
            "If I had a dollar for every smart thing you say, I'd be poor.",
            "You're the reason they put instructions on shampoo.",
            "I'm not saying I hate you, but I would unplug your life support to charge my phone.",
            "You're about as useful as a screen door on a submarine."
        ];

        const mentionedUsers = Object.keys(mentions || {});
        
        if (mentionedUsers.length === 0) {
            return reply("Please mention a user to insult.");
        }

        const mentionedUser = mentionedUsers[0];
        const randomInsult = insults[Math.floor(Math.random() * insults.length)];
        
        await conn.sendMessage(from, {
            text: `@${mentionedUser.split('@')[0]} ${randomInsult}`,
            mentions: [mentionedUser]
        }, { quoted: m });

    } catch (error) {
        console.error('Insult Command Error:', error);
        reply("❌ Failed to send insult. Please try again.");
    }
});
