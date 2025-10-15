const { cmd } = require('../command');

// Store feature state and temporary tracking
let antiPromoteEnabled = false;
let recentPromotions = new Set();

cmd({
    pattern: "antipromote",
    alias: ["antipromo", "nopromote"],
    react: "🚫",
    desc: "Auto-demote anyone who promotes another user",
    category: "group",
    use: ".antipromote <on/off/status>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        if (!isOwner) return reply("❌ Only the *bot owner* can toggle Anti-Promote.");

        const sub = (q || '').trim().toLowerCase();

        if (!['on', 'off', 'status'].includes(sub)) {
            return reply(`*🚫 ANTIPROMOTE*\n\n.antipromote on - Enable auto-demote when someone promotes\n.antipromote off - Disable it\n.antipromote status - Check current status`);
        }

        if (sub === 'status') {
            return reply(`🚫 Anti-Promote is currently *${antiPromoteEnabled ? 'ON' : 'OFF'}*.`);
        }

        antiPromoteEnabled = sub === 'on';
        return reply(`🚫 Anti-Promote has been *${antiPromoteEnabled ? 'ENABLED' : 'DISABLED'}*.`);
    } catch (err) {
        console.error("AntiPromote Error:", err);
        reply("❌ Something went wrong while toggling AntiPromote.");
    }
});

async function handleGroupParticipantsUpdate(conn, update) {
    try {
        if (!antiPromoteEnabled) return;

        const { id, participants, action } = update;
        if (action !== 'promote') return;

        const groupMetadata = await conn.groupMetadata(id);
        const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin;

        if (!isBotAdmin) return; // Bot must be admin

        // The WhatsApp event doesn’t show who promoted, so we use last messages to detect it
        const msgs = await conn.fetchMessages(id, { limit: 5 });
        const promotionMsg = msgs.find(m => 
            m.messageStubType === 29 && // Promotion stub type
            participants.includes(m.messageStubParameters?.[0])
        );

        let promoterId = null;
        if (promotionMsg?.key?.participant) {
            promoterId = promotionMsg.key.participant;
        }

        for (const user of participants) {
            const userId = user.id || user;

            if (recentPromotions.has(`${id}_${userId}`)) return;
            recentPromotions.add(`${id}_${userId}`);
            setTimeout(() => recentPromotions.delete(`${id}_${userId}`), 5000);

            // Undo promotion
            await conn.groupParticipantsUpdate(id, [userId], 'demote');

            if (promoterId && promoterId !== botNumber) {
                // Demote the one who promoted
                await conn.groupParticipantsUpdate(id, [promoterId], 'demote');

                await conn.sendMessage(id, {
                    text: `🚫 *Anti-Promote Activated!*\n\n@${promoterId.split('@')[0]} promoted someone, and has been *demoted* automatically.`,
                    mentions: [promoterId]
                });
            } else {
                // Fallback if promoter not detected
                await conn.sendMessage(id, {
                    text: `🚫 Promotion revoked! This group is protected by *Anti-Promote* mode.`,
                });
            }
        }
    } catch (err) {
        console.error('Error in AntiPromote handler:', err);
    }
}

// Add this in your main event handler file:
// conn.ev.on('group-participants.update', (update) => handleGroupParticipantsUpdate(conn, update));

module.exports = { handleGroupParticipantsUpdate };
