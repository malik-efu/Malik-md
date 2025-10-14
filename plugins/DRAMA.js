const axios = require('axios');
const { cmd, commands } = require('../command');
const config = require('../config');

cmd({
    pattern: "help",
    alias: ["commands", "menu"],
    react: "📖",
    desc: "Lists all available commands by category",
    category: "utility",
    use: ".help or .help <command>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        // Get all commands
        const getAllCommands = () => commands.map(cmd => cmd);
        const allCommands = getAllCommands();

        // Category merging
        const mergedCategories = {
            "🛡️ Bot Control": ["Administration", "Admin", "Owner", "Bot Management", "System"],
            "🛠️ Utility": ["Utility", "Utilities", "system"],
            "🎬 Media": ["Media", "media", "video", "image"],
            "👥 Group Management": ["Group Management", "group"],
            "🤖 AI": ["AI", "AI Chat"],
            "🎉 Fun": ["Fun", "Games", "greetings"],
            "🔧 Tools": ["Tools", "Information"],
            "📥 Download": ["download", "downloader"]
        };

        const categories = {};

        allCommands.forEach((cmd) => {
            let cat = cmd.category || "📦 Uncategorized";

            // Merge similar categories
            for (const merged in mergedCategories) {
                if (mergedCategories[merged].includes(cat)) {
                    cat = merged;
                    break;
                }
            }

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd);
        });

        // Show specific command help
        if (q) {
            const command = allCommands.find((cmd) => 
                cmd.pattern.toLowerCase() === q.toLowerCase() || 
                (cmd.alias && cmd.alias.includes(q.toLowerCase()))
            );
            
            if (command) {
                return reply(
                    `╭━━━〔 *📖 Command Info* 〕━━━╮\n` +
                    `┃ 🔹 Name: ${command.pattern}\n` +
                    `┃ 🔹 Aliases: ${command.alias ? command.alias.join(", ") : "None"}\n` +
                    `┃ 🔹 Description: ${command.desc || "No description"}\n` +
                    `┃ 🔹 Usage: ${command.use || "No usage specified"}\n` +
                    `┃ 🔹 Category: ${command.category || "Uncategorized"}\n` +
                    `┃ 🔹 React: ${command.react || "None"}\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━━╯`
                );
            } else {
                return reply(`⚠️ No command found with the name "${q}".`);
            }
        }

        // Show main help menu
        let responseText = `
╔══════════════════════╗
     ✨ *${config.botName || 'Knight Bot'}* ✨
╚══════════════════════╝

👑 Owner: ${config.owner || 'Unknown Owner'}
🔰 Prefix: ${prefix}
📊 Total Commands: ${allCommands.length}

`;

        // Add categories and commands
        for (const category in categories) {
            const categoryCommands = categories[category]
                .map(cmd => `   ⤷ ${prefix}${cmd.pattern}`)
                .join("\n");

            responseText += `
╔══════════════════════╗
📂 *${category}* (${categories[category].length})
${categoryCommands}
╚══════════════════════╝
`;
        }

        responseText += `\n📖 Use *${prefix}help <command>* for more info about a specific command.`;

        // Try to send with image if available
        try {
            if (config.helpImage) {
                await conn.sendMessage(from, {
                    image: { url: config.helpImage },
                    caption: responseText
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, {
                    text: responseText
                }, { quoted: m });
            }
        } catch (error) {
            console.error('Help Image Error:', error);
            await conn.sendMessage(from, {
                text: responseText
            }, { quoted: m });
        }

    } catch (error) {
        console.error('Help Command Error:', error);
        reply("❌ An error occurred while generating help menu.");
    }
});
