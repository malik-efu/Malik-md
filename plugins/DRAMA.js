const fs = require('fs');
const { cmd } = require('../command');

const ANTICALL_PATH = './data/anticall.json';

// --- Read & Write State ---
function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const data = JSON.parse(fs.readFileSync(ANTICALL_PATH, 'utf8'));
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch (e) {
        console.error('Failed to write anticall state:', e);
    }
}

// --- Command: .anticall on/off/status ---
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
        if (!isOwner) return reply("❌ Only the bot owner can use this command.");

        const state = readState();
        const sub = (q || '').trim().toLowerCase();

        if (!['on', 'off', 'status'].includes(sub)) {
            return reply(`📵 *ANTICALL OPTIONS*\n\n.anticall on - Enable auto-block\n.anticall off - Disable auto-block\n.anticall status - Show current status`);
        }

        if (sub === 'status') {
            return reply(`📵 Anticall is *${state.enabled ? 'ON' : 'OFF'}*`);
        }

        const enable = sub === 'on';
        writeState(enable);
        reply(`📵 Anticall has been *${enable ? 'ENABLED' : 'DISABLED'}*.`);
    } catch (e) {
        console.error(e);
        reply('❌ Error updating anticall settings.');
    }
});

// --- Event Listener for Incoming Calls ---
module.exports = async function anticallHandler(sock, callUpdate) {
    try {
        const state = readState();
        if (!state.enabled) return;

        for (const call of callUpdate) {
            const callerJid = call.from;
            const callId = call.id;

            if (call.status === 'offer') {
                console.log(`🚫 Incoming call from ${callerJid}`);

                // 1️⃣ Reject the call
                await sock.rejectCall(callId, callerJid);
                console.log(`📵 Rejected call from ${callerJid}`);

                // 2️⃣ Block the caller
                await sock.updateBlockStatus(callerJid, 'block');
                console.log(`🚷 Blocked ${callerJid}`);

                // 3️⃣ Notify them (optional)
                try {
                    await sock.sendMessage(callerJid, {
                        text: '🚫 Please do not call this bot. You have been blocked automatically.'
                    });
                } catch {}

                // 4️⃣ Optionally delete the call record (not always supported)
                if (sock.chatModify) {
                    try {
                        await sock.chatModify({
                            clear: {
                                messages: [{ id: callId, fromMe: false }]
                            }
                        }, callerJid);
                        console.log(`🧹 Deleted call message from ${callerJid}`);
                    } catch (err) {
                        console.log('⚠️ Unable to delete call record:', err.message);
                    }
                }
            }
        }
    } catch (err) {
        console.error('❌ Anticall Handler Error:', err);
    }
};
