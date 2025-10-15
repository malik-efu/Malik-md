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
    // Add constraints: only group chats, only admins/owner
    onlyGroup: true,
    isAdmin: true,
    isBotAdmin: true // Bot must be admin to demote users
}, async (conn, m, msg, { text, isOwner }) => {
    // Check if the user is an admin or the bot owner
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

// We use 'participants.update' to listen for changes like 'promote'
cmd({ on: 'group-participants.update' }, async (conn, m, msg, { update, participants }) => {
    if (!antiPromoteEnabled) return;
    
    const { id, action, participants: groupParticipants } = update;
    
    // Check if the action is 'promote'
    if (action === 'promote') {
        const promotedJid = groupParticipants[0]; // The user who was promoted
        const groupMetadata = await conn.groupMetadata(id);
        
        // Find the user who performed the action (the promoting admin)
        // This information is usually not directly in the update object, 
        // so we check the latest 'group-participants.update' in conn.ev.on or rely on 
        // a property your framework might add (like m.sender or update.contextInfo.sender).
        // For standard WA event handling, we often need to check the WA-Web data structure or rely on framework-specific context.
        // Assuming your framework provides the `m.sender` or similar context for the *event* that triggered the update:
        
        // --- IMPORTANT ASSUMPTION ---
        // I will assume your framework can correctly identify the *actor* (the admin who promoted the user).
        // I'll use a placeholder for the actor's JID. In real-world bots, this requires correctly parsing the underlying event structure (e.g., from the 'contextInfo' of the promotion action).
        
        const actorJid = msg.sender; // Placeholder: Replace with the correct way to get the admin's JID from your framework
        
        // Ensure the bot is still an admin before trying to demote
        const isBotAdmin = groupMetadata.participants.some(p => p.id === conn.user.jid && p.admin);
        
        if (!isBotAdmin) {
            // Cannot enforce the rule if the bot isn't an admin
            return conn.sendMessage(id, { text: "⚠️ I need to be an **Admin** to enforce the Anti-Promote rule!" });
        }
        
        // 1. Demote the promoting Admin and the promoted User
        const usersToDemote = [actorJid, promotedJid].filter(jid => jid && jid !== conn.user.jid);
        
        if (usersToDemote.length > 0) {
            try {
                // Remove admin status from both users
                await conn.groupParticipantsUpdate(id, usersToDemote, 'demote');
                
                // 2. Send the message
                const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net'; // Assuming OWNER_NUMBER is in config
                const mentions = [actorJid, promotedJid, ownerJid].filter(Boolean); // Filter out null/undefined
                
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
