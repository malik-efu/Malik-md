
const { cmd } = require('../command');
const config = require("../config");

// --- Command to Toggle Anti-Mute Feature ---
cmd({
    'pattern': 'antimute ?(.*)',
    'desc': 'Toggles the Anti-Mute feature which deletes links and mutes the group.',
    'category': 'admin',
    'fromMe': true // Only you (the bot owner) can use this command
}, async (conn, m, store, {
    from,
    args,
    isAdmins,
    reply
}) => {
    // Check if the user is an admin of the group (or only allow bot owner)
    // For simplicity, let's assume the 'fromMe: true' handles the restriction.
    
    if (!m.isGroup) {
        return reply("This command can only be used in a group.");
    }
    
    const action = args[0] ? args[0].toLowerCase() : '';

    if (action === 'on') {
        // You would typically save this setting to a database or config file.
        // For this example, we'll just acknowledge the request.
        // **Note:** The detection logic relies on a proper configuration setup (e.g., in config.js).
        return reply("✅ *Anti-Mute feature is now ON!* Links will be deleted and the group will be set to 'Admin Only'.");
    } else if (action === 'off') {
        // You would typically save this setting to a database or config file.
        return reply("❌ *Anti-Mute feature is now OFF!*");
    } else {
        return reply("Please use the command as follows:\n\n*antimute on* - To enable\n*antimute off* - To disable");
    }
});


// --- Link Detection and Group Mute Logic ---
cmd({
    'on': "body"
}, async (conn, m, store, {
    from,
    body,
    sender,
    isGroup,
    isAdmins,
    isBotAdmins,
    reply
}) => {
    try {
        // Ensure the bot is an admin and the sender is not an admin
        if (!isGroup || isAdmins || !isBotAdmins) {
            return;
        }

        // Check if the feature is enabled (Assuming a config variable named ANTI_MUTE_ENABLED)
        // **IMPORTANT:** You must set and manage this variable based on the 'antimute on/off' command.
        if (config.ANTI_MUTE_ENABLED !== 'true') {
             return;
        }

        // List of link patterns to detect (using the same list you provided)
        const linkPatterns = [
            /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
            /https?:\/\/(?:api\.whatsapp\.com|wa\.me)\/\S+/gi,
            /wa\.me\/\S+/gi,
            /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
            /https?:\/\/(?:www\.)?\.com\/\S+/gi,
            /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
            /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
            /https?:\/\/(?:whatsapp\.com|channel\.me)\/\S+/gi,
            /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
            /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
            /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
            /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
            /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
            /https?:\/\/(?:www\.)?medium\.com\/\S+/gi
        ];

        // Check if message contains any forbidden links
        const containsLink = linkPatterns.some(pattern => pattern.test(body));

        if (containsLink) {
            console.log(`Link detected from ${sender}: ${body}`);

            // 1. Delete the message (as requested)
            try {
                await conn.sendMessage(from, {
                    delete: m.key
                });
                console.log(`Message deleted: ${m.key.id}`);
            } catch (error) {
                console.error("Failed to delete message:", error);
            }

            // 2. Mute the group (Group only allows admins to send messages)
            const response = await conn.groupSettingUpdate(from, 'announcement'); // 'announcement' setting means admin-only

            if (response && response.status === 200) {
                await conn.sendMessage(from, {
                    text: `*🚨 GROUP MUTE ALERT! 🚨*\n\n**Link detected** from @${sender.split('@')[0]}! \n\n*The group has been set to 'Admin Only' mode to prevent further link sharing.*`,
                    mentions: [sender]
                });
            } else {
                 await reply("⚠️ Detected link, but failed to set group to 'Admin Only' mode. Check bot admin status.");
            }
        }
    } catch (error) {
        console.error("Anti-Mute error:", error);
        reply("❌ An error occurred while processing the message.");
    }
});
