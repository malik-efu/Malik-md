const { cmd } = require('../command');

// Store to track recent promotions to avoid loops
let recentPromotions = new Map();

cmd({
    pattern: "antipromote",
    alias: ["antipromo", "nopromote"],
    react: "🚫",
    desc: "Auto-revoke admin promotions in group",
    category: "group",
    use: ".antipromote <on/off/status>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner, isAdmins }) => {
    try {
        if (!isOwner) {
            return reply("❌ This command can only be used by the bot owner.");
        }

        const sub = (q || '').trim().toLowerCase();

        if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
            return reply(`*🚫 ANTIPROMOTE*\n\n.antipromote on - Enable auto-revoke on promotions\n.antipromote off - Disable antipromote\n.antipromote status - Show current status`);
        }

        if (sub === 'status') {
            const isEnabled = recentPromotions.get('enabled') || false;
            return reply(`🚫 Antipromote is currently *${isEnabled ? 'ON' : 'OFF'}*.`);
        }

        const enable = sub === 'on';
        recentPromotions.set('enabled', enable);
        
        await reply(`🚫 Antipromote is now *${enable ? 'ENABLED' : 'DISABLED'}*.`);

    } catch (error) {
        console.error('Antipromote Command Error:', error);
        reply("❌ Failed to update antipromote settings.");
    }
});

// Function to handle group participants update
async function handleGroupParticipantsUpdate(conn, update) {
    try {
        // Check if antipromote is enabled
        if (!recentPromotions.get('enabled')) return;

        const { id, participants, action } = update;
        
        // Only handle promote actions
        if (action !== 'promote') return;

        // Get group metadata
        const groupMetadata = await conn.groupMetadata(id);
        const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        // Check if bot is admin
        const isBotAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin;
        if (!isBotAdmin) return;

        for (const participant of participants) {
            const participantId = participant.id;
            
            // Skip if this is a recent action we processed (avoid loops)
            const recentKey = `${id}_${participantId}`;
            if (recentPromotions.has(recentKey)) return;
            
            // Mark this as recent to avoid loops
            recentPromotions.set(recentKey, true);
            setTimeout(() => recentPromotions.delete(recentKey), 5000);

            try {
                // Demote the promoted user
                await conn.groupParticipantsUpdate(id, [participantId], 'demote');
                
                // Find who promoted (this might need additional logic based on your WhatsApp library)
                // For now, we'll demote all admins except bot
                const admins = groupMetadata.participants.filter(p => p.admin && p.id !== botNumber);
                
                for (const admin of admins) {
                    const adminKey = `${id}_${admin.id}`;
                    if (!recentPromotions.has(adminKey)) {
                        recentPromotions.set(adminKey, true);
                        setTimeout(() => recentPromotions.delete(adminKey), 5000);
                        
                        await conn.groupParticipantsUpdate(id, [admin.id], 'demote');
                    }
                }

                // Send message to group
                await conn.sendMessage(id, {
                    text: "🚫 *Dark Zone MD has to promote user*\n\nAdmin promotions are automatically revoked in this group."
                });

                break; // Process only one promotion at a time

            } catch (error) {
                console.error('Error in antipromote handler:', error);
            }
        }

    } catch (error) {
        console.error('Group Participants Update Error:', error);
    }
}

// Add this to your main bot file event handler
// conn.ev.on('group-participants.update', async (update) => {
//     await handleGroupParticipantsUpdate(conn, update);
// });

module.exports = { handleGroupParticipantsUpdate };
