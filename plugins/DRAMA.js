const fs = require('fs');
const { cmd } = require('../command');

const ANTICALL_PATH = './data/anticall.json';

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch {}
}

// ========================
// 🔹 Command: .anticall
// ========================
cmd({
    pattern: "anticall",
    alias: ["antcall", "blockcall"],
    react: "📵",
    desc: "Auto-block incoming calls",
    category: "owner",
    use: ".anticall <on/off/status>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply("❌ This command can only be used by the bot owner.");
        }

        const state = readState();
        const sub = (q || '').trim().toLowerCase();

        if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
            return reply(`*📵 ANTICALL*\n\n.anticall on - Enable auto-block on incoming calls\n.anticall off - Disable anticall\n.anticall status - Show current status`);
        }

        if (sub === 'status') {
            return reply(`📵 Anticall is currently *${state.enabled ? 'ON' : 'OFF'}*.`);
        }

        const enable = sub === 'on';
        writeState(enable);
        await reply(`📵 Anticall is now *${enable ? 'ENABLED' : 'DISABLED'}*.`);

    } catch (error) {
        console.error('Anticall Command Error:', error);
        reply("❌ Failed to update anticall settings.");
    }
});

// ========================
// 🔹 Event: Reject incoming calls
// ========================
module.exports = async function anticallHandler(conn, update) {
    try {
        const state = readState();
        if (!state.enabled) return;

        if (update && update[0] && update[0].content && update[0].content[0]) {
            const call = update[0].content[0];
            if (call.tag === 'offer') {
                const callerJid = update[0].attrs.from;
                console.log(`🚫 Incoming call detected from: ${callerJid}`);

                // Reject the call
                await conn.rejectCall(callerJid, call.attrs['call-id']);
                console.log(`📵 Call rejected automatically from ${callerJid}`);

                // Optional: send a message to the caller
                await conn.sendMessage(callerJid, { text: `🚫 Please don't call the bot. Your call was rejected automatically.` });
            }
        }
    } catch (err) {
        console.error('❌ Error handling call:', err);
    }
};
