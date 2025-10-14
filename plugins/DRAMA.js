const fs = require('fs');
const { cmd } = require('../command');

const DATA_PATH = './data/anticall.json';

// Read current state
function readState() {
    try {
        if (!fs.existsSync(DATA_PATH)) return { enabled: false };
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(raw);
    } catch {
        return { enabled: false };
    }
}

// Write new state
function writeState(state) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error('Error writing anticall state:', err);
    }
}

// ----- Command -----
cmd({
    pattern: 'antical',
    alias: ['blockcall', 'antcall'],
    desc: 'Auto block when someone calls bot',
    category: 'owner',
    use: '.anticall on/off/status',
    react: '📵',
    filename: __filename
}, async (conn, mek, m, { q, reply, isOwner }) => {
    if (!isOwner) return reply('❌ Only owner can use this command.');

    const sub = (q || '').trim().toLowerCase();
    const current = readState();

    if (!['on', 'off', 'status'].includes(sub)) {
        return reply(`📵 *ANTICALL OPTIONS*\n\n.anticall on - Enable\n.anticall off - Disable\n.anticall status - Show status`);
    }

    if (sub === 'status') return reply(`📵 Anticall is *${current.enabled ? 'ON' : 'OFF'}*`);

    const newState = { enabled: sub === 'on' };
    writeState(newState);
    reply(`📵 Anticall has been *${newState.enabled ? 'ENABLED' : 'DISABLED'}*.`);
});

// ----- Event Listener for Incoming Calls -----
async function handleCall(sock, update) {
    const state = readState();
    if (!state.enabled) return;

    for (const call of update) {
        if (call.status === 'offer') {
            const caller = call.from;
            const callId = call.id;
            console.log('📞 Incoming call detected from', caller);

            try {
                // Reject the call
                await sock.rejectCall(callId, caller);
                console.log(`📵 Rejected call from ${caller}`);

                // Block the caller
                await sock.updateBlockStatus(caller, 'block');
                console.log(`🚷 Blocked ${caller}`);

                // Warn them (optional)
                await sock.sendMessage(caller, { text: '🚫 Do not call this bot. You have been blocked automatically.' });
            } catch (err) {
                console.error('Anticall error:', err);
            }
        }
    }
}

module.exports = { handleCall };
