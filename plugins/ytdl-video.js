const { cmd } = require('../command');
const config = require('../config');

// Initial state, assuming a config variable or defaulting to false
let antiPromoteEnabled = config.ANTI_PROMOTE === "true" || false; 

// --- Command Handler: Enable/Disable Anti-Promote ---
cmd({
    pattern: "antipromote",
    alias: ["apromote", "nopromote"],
    desc: "Enable or disable the anti-promote feature.",
    category: "settings",
    filename: __filename,
    // Constraints
    onlyGroup: true,
    isAdmin: true,
    isBotAdmin: true 
}, async (conn, m, msg, { text, isOwner }) => {
    // Permission check for command
    if (!m.isGroupAdmin && !isOwner) {
        return m.reply("*❌ This command is only for Group Admins or the Bot Owner.*");
    }

    if (!text) return m.reply("*ᴜsᴇ: .ANTIPROMOTE ON | OFF*");

    const state = text.toLowerCase();

    if (state === "on") {
        antiPromoteEnabled = true;
        m.reply("*✅ ANTI-PROMOTE ENABLED*\nAny admin promoting a user will be demoted along with the promoted user.");
    } else if (state === "off") {
        antiPromoteEnabled = false;
        m.reply("*❌ ANTI-PROMOTE DISABLED*");
    } else {
        m.reply("*ᴜsᴇ: .ANTIPROMOTE ON | OFF*");
    }
});

// --- Event Listener: Handle Group Participant Updates (Promotions) ---

cmd({ on: 'group-participants.update' }, async (conn, m, msg, { update, participants }) => {
    if (!antiPromoteEnabled) return;
    
    const { id, action, participants: groupParticipants, actor } = update; // 'actor' is commonly used in many WA frameworks
    
    // Check if the action is 'promote'
    if (action === 'promote') {
        const promotedJid = groupParticipants[0]; 
        const groupMetadata = await conn.groupMetadata(id);
        
        // --- 🔑 Key Improvement ---
        // 1. Try to get the actor (the admin who promoted) from the 'update' object itself.
        // 2. Fallback to msg.sender if 'actor' is not available (as per your base code structure).
        
        let actorJid = actor || msg.sender;
        
        // Final check to make sure the actor is actually an admin and not the bot itself
        const isActorAdmin = groupMetadata.participants.some(p => p.id === actorJid && p.admin);

        // If the one who promoted is the bot owner or the bot itself, allow it.
        // We assume bot owner JID is stored in config or a dedicated variable.
        const botOwnerJid = config.OWNER_NUMBER + '@s.whatsapp.net'; 
        
        if (actorJid === botOwnerJid || actorJid === conn.user.jid) {
            return; // Allow bot owner or bot itself to promote
        }

        // Ensure the bot is still an admin before trying to demote
        const isBotAdmin = groupMetadata.participants.some(p => p.id === conn.user.jid && p.admin);
        
        if (!isBotAdmin) {
            // Cannot enforce the rule if the bot isn't an admin
            return conn.sendMessage(id, { text: "⚠️ I need to be an **Admin** to enforce the Anti-Promote rule!" });
        }
        
        // 1. Demote the promoting Admin and the promoted User
        // Filter out the bot's own JID just in case
        const usersToDemote = [actorJid, promotedJid].filter(jid => jid && jid !== conn.user.jid);
        
        if (usersToDemote.length > 0) {
            try {
                // Remove admin status from both users
                await conn.groupParticipantsUpdate(id, usersToDemote, 'demote');
                
                // 2. Send the message
                const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net'; 
                const mentions = [actorJid, promotedJid, ownerJid].filter(Boolean); 
                
                const responseText = `*🚫 ANTI-PROMOTE ENFORCED*\n\n`
                    + `The owner has *not* allowed unauthorized promotions.\n`
                    + `Both the user promoted: @${promotedJid.split('@')[0]} and the admin who promoted them: @${actorJid.split('@')[0]} have been **demoted**.\n`
                    + `Owner: @${ownerJid.split('@')[0]}`;
                    
                await conn.sendMessage(id, {
                    text: responseText,
                    mentions: mentions
                });
                
            } catch (error) {
                console.error("Error during demotion:", error);
                conn.sendMessage(id, { text: `❌ An error occurred while trying to demote the users: ${error.message}` });
            }
        }
    }
});
