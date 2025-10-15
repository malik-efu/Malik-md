const { cmd } = require('../command');
const config = require('../config');

// پروموشنز کو ٹریک کرنے کے لیے
let promotionTracker = new Map();

cmd({
    pattern: "antipromote",
    alias: ["antipromo", "nopromote"],
    react: "🚫",
    desc: "Auto-detect and revoke admin promotions",
    category: "group",
    use: ".antipromote <on/off/status>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply("❌ This command can only be used by the bot owner.");
        }

        const sub = (q || '').trim().toLowerCase();

        if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
            return reply(`*🚫 ANTIPROMOTE*\n\n.antipromote on - Enable auto-revoke on promotions\n.antipromote off - Disable antipromote\n.antipromote status - Show current status`);
        }

        if (sub === 'status') {
            const isEnabled = promotionTracker.get('enabled') || false;
            return reply(`🚫 Antipromote is currently *${isEnabled ? 'ON' : 'OFF'}*.`);
        }

        const enable = sub === 'on';
        promotionTracker.set('enabled', enable);
        
        // Save to config
        config.ANTIPROMOTE = enable.toString();
        
        await reply(`🚫 Antipromote is now *${enable ? 'ENABLED' : 'DISABLED'}*.`);

    } catch (error) {
        console.error('Antipromote Command Error:', error);
        reply("❌ Failed to update antipromote settings.");
    }
});

// گروپ پرٹیسیپنٹس اپڈیٹ ہینڈلر
async function handleGroupParticipantsUpdate(conn, update) {
    try {
        // چیک کریں کہ اینٹی پروموٹ آن ہے
        if (!promotionTracker.get('enabled') && config.ANTIPROMOTE !== 'true') return;

        const { id, participants, action } = update;
        
        // صرف پروموٹ ایکشنز ہینڈل کریں
        if (action !== 'promote') return;

        // گروپ میٹا ڈیٹا حاصل کریں
        const groupMetadata = await conn.groupMetadata(id);
        const botNumber = conn.user.id;

        // چیک کریں کہ بوٹ ایڈمن ہے
        const isBotAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin;
        if (!isBotAdmin) return;

        // تمام ایڈمنز کی لسٹ بنائیں (بوٹ کو چھوڑ کر)
        const allAdmins = groupMetadata.participants.filter(p => p.admin && p.id !== botNumber);
        
        for (const participant of participants) {
            const promotedUser = participant.id;
            
            // لوپ سے بچنے کے لیے چیک کریں
            const recentKey = `${id}_${promotedUser}_${Date.now()}`;
            if (promotionTracker.has(recentKey)) return;
            
            // اس ایکشن کو ریسنٹ کے طور پر مارک کریں
            promotionTracker.set(recentKey, true);
            setTimeout(() => promotionTracker.delete(recentKey), 10000);

            try {
                // پروموٹ ہونے والے یوزر کو ڈیمیوٹ کریں
                await conn.groupParticipantsUpdate(id, [promotedUser], 'demote');
                
                // تمام ایڈمنز کو ڈیمیوٹ کریں (جو پروموٹ کر سکتے ہیں)
                const adminsToDemote = allAdmins.map(admin => admin.id);
                if (adminsToDemote.length > 0) {
                    await conn.groupParticipantsUpdate(id, adminsToDemote, 'demote');
                }

                // گروپ میں میسج بھیجیں
                await conn.sendMessage(id, {
                    text: "🚫 *Dark Zone MD has to promote user*\n\nAdmin promotions are automatically revoked in this group.\nAll admins have been demoted."
                });

                console.log(`✅ Antipromote: Demoted ${promotedUser} and all admins in group ${id}`);

            } catch (error) {
                console.error('Error in antipromote handler:', error);
                
                // اگر ڈیمیوٹ نہیں ہو سکا تو صرف میسج بھیجیں
                try {
                    await conn.sendMessage(id, {
                        text: "🚫 *Dark Zone MD has to promote user*\n\nAdmin promotions are not allowed in this group."
                    });
                } catch (msgError) {
                    console.error('Failed to send message:', msgError);
                }
            }
        }

    } catch (error) {
        console.error('Group Participants Update Error:', error);
    }
}

// پروموشن ڈیٹیکشن کے لیے ایڈوانسڈ فنکشن
async function detectPromotionAndDemote(conn, groupId, promotedUsers) {
    try {
        if (!promotionTracker.get('enabled') && config.ANTIPROMOTE !== 'true') return;

        const groupMetadata = await conn.groupMetadata(groupId);
        const botNumber = conn.user.id;

        // بوٹ ایڈمن ہے یا نہیں چیک کریں
        const isBotAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin;
        if (!isBotAdmin) return;

        // تمام ایڈمنز (بوٹ کو چھوڑ کر)
        const allAdmins = groupMetadata.participants.filter(p => p.admin && p.id !== botNumber);

        for (const promotedUser of promotedUsers) {
            const recentKey = `${groupId}_${promotedUser}_${Date.now()}`;
            if (promotionTracker.has(recentKey)) continue;
            
            promotionTracker.set(recentKey, true);
            setTimeout(() => promotionTracker.delete(recentKey), 10000);

            try {
                // پروموٹ ہونے والے کو ڈیمیوٹ کریں
                await conn.groupParticipantsUpdate(groupId, [promotedUser], 'demote');
                
                // تمام ایڈمنز کو ڈیمیوٹ کریں
                if (allAdmins.length > 0) {
                    const adminIds = allAdmins.map(admin => admin.id);
                    await conn.groupParticipantsUpdate(groupId, adminIds, 'demote');
                }

                // انفارمیشن میسج
                await conn.sendMessage(groupId, {
                    text: `🚫 *Dark Zone MD has to promote user*\n\n❌ Promotion detected and revoked!\n👤 Promoted user: @${promotedUser.split('@')[0]}\n📛 All admins have been demoted\n\n_This action was performed automatically_`,
                    mentions: [promotedUser]
                });

            } catch (error) {
                console.error(`Failed to demote in group ${groupId}:`, error);
            }
        }

    } catch (error) {
        console.error('Promotion detection error:', error);
    }
}

// اپنے مین بوٹ فائل میں ایڈ کریں
// conn.ev.on('group-participants.update', async (update) => {
//     if (update.action === 'promote') {
//         await handleGroupParticipantsUpdate(conn, update);
//         // یا
//         await detectPromotionAndDemote(conn, update.id, update.participants.map(p => p.id));
//     }
// });

module.exports = { 
    handleGroupParticipantsUpdate, 
    detectPromotionAndDemote 
};
