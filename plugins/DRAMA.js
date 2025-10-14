const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../data/grpPrefix.json');

// Helper functions to read/write prefix data
function readPrefixes() {
    try {
        if (!fs.existsSync(dataFile)) return {};
        const raw = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(raw || '{}');
    } catch {
        return {};
    }
}

function writePrefixes(prefixes) {
    try {
        const dir = path.dirname(dataFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataFile, JSON.stringify(prefixes, null, 2));
        return true;
    } catch {
        return false;
    }
}

cmd({
    pattern: "prefi",
    alias: ["currentprefix"],
    react: "🔰",
    desc: "Display or set bot prefix",
    category: "utility",
    use: ".prefix or .prefix set <symbol>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, q, reply, prefix }) => {
    try {
        const prefixes = readPrefixes();
        const args = q ? q.split(' ') : [];

        // Show current prefix
        if (!args[0]) {
            const globalPrefix = prefix;
            const groupPrefix = prefixes[from];

            if (isGroup) {
                return reply(
                    `🔰 Prefix Information:\n\n` +
                    `🌍 Global Prefix: \`${globalPrefix}\`\n` +
                    `👥 Group Prefix: \`${groupPrefix || "Not set (using global)"}\``
                );
            } else {
                return reply(`🌍 My current prefix is: \`${globalPrefix}\``);
            }
        }

        // Set prefix
        if (args[0].toLowerCase() === "set") {
            if (!isGroup) {
                return reply("❌ This command can only be used in groups.");
            }
            if (!isAdmins) {
                return reply("❌ Only group admins can set prefix.");
            }
            if (!args[1]) {
                return reply("❌ Please provide a prefix to set.\nExample: .prefix set !");
            }

            const newPrefix = args[1];
            prefixes[from] = newPrefix;

            if (writePrefixes(prefixes)) {
                return reply(`✅ Prefix updated for this group.\n👉 New Prefix: \`${newPrefix}\``);
            } else {
                return reply("❌ Failed to save prefix. Please try again.");
            }
        }

    } catch (error) {
        console.error('Prefix Command Error:', error);
        reply("❌ An error occurred while processing prefix command.");
    }
});
