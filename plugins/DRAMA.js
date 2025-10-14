const fs = require('fs');
const { cmd } = require('../command');

const ANTICALL_PATH = './data/anticall.json';

// ----- Read/Write State -----
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
        console.error('WriteState Error:', e);
    }
}

// ----- Command -----
cmd({
    pattern: "anticall",
    alias: ["antcall", "blockcall"],
    react: "📵",
    desc: "Auto-block incoming calls",
    category: "owner",
    use: ".anticall <on/off/status>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Only owner can use this command.");

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
});

// ----- Event: Call Detector -----
async function handleIncomingCall(sock, call) {
    const state = readState();
    if (!state.enabled) return;

    const callerJid = call.attrs.from;
    const callId = call.attrs['call-id'];
    const callType = call.tag; // usually "offer"

    if (callType === 'offer') {
        console.log(`🚫 Incoming call detected from: ${callerJid}`);

        // Reject the call
        try {
            await sock.rejectCall(callId, callerJid);
            console.log(`📵 Rejected call from ${callerJid}`);
        } catch (err) {
            console.error('RejectCall error:', err.message);
        }

        // Block the user
        try {
            await sock.updateBlockStatus(callerJid, 'block');
            console.log(`🚷 Blocked ${callerJid}`);
        } catch (err) {
            console.error('Block error:', err.message);
        }

        // Optional warning message
        try {
            await sock.sendMessage(callerJid, { text: '🚫 Do not call this bot. You are now blocked.' });
        } catch {}
    }
}

// ----- Export Handler -----
module.exports = { readState, writeState, handleIncomingCall };
