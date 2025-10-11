const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');

// FIXED: Proper config saving function
function saveConfig() {
    try {
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

// FIXED: Admin Events Command
cmd({
    pattern: "admin-events",
    alias: ["adminevents"],
    desc: "Enable or disable admin event notifications",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.ADMIN_EVENTS = "true";
        if (saveConfig()) {
            return reply("✅ Admin event notifications are now enabled.");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (status === "off") {
        config.ADMIN_EVENTS = "false";
        if (saveConfig()) {
            return reply("❌ Admin event notifications are now disabled.");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}admin-events on/off`);
    }
});

// FIXED: Welcome Command
cmd({
    pattern: "welcome",
    alias: ["welcomeset"],
    desc: "Enable or disable welcome messages for new members",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.WELCOME = "true";
        if (saveConfig()) {
            return reply("✅ Welcome messages are now enabled.");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (status === "off") {
        config.WELCOME = "false";
        if (saveConfig()) {
            return reply("❌ Welcome messages are now disabled.");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}welcome on/off`);
    }
});

// FIXED: Set Prefix Command
// SET PREFIX
cmd({
  pattern: "setprefix",
  alias: ["prefix", "prifix"],
  desc: "Set the bot's command prefix",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  const newPrefix = args[0]?.trim();
  if (!newPrefix || newPrefix.length > 2) return reply("❌ Provide a valid prefix (1–2 characters).");

  await setConfig("PREFIX", newPrefix);

  await reply(`✅ Prefix updated to: *${newPrefix}*\n\n♻️ Restarting...`);
  setTimeout(() => exec("pm2 restart all"), 2000);
});



// SET BOT NAME
cmd({
  pattern: "setbotname",
  alias: ["botname"],
  desc: "Set the bot's name",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  const newName = args.join(" ").trim();
  if (!newName) return reply("❌ Provide a bot name.");

  await setConfig("BOT_NAME", newName);

  await reply(`✅ Bot name updated to: *${newName}*\n\n♻️ Restarting...`);
  setTimeout(() => exec("pm2 restart all"), 2000);
});

// SET OWNER NAME
cmd({
  pattern: "setownername",
  alias: ["ownername"],
  desc: "Set the owner's name",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  const name = args.join(" ").trim();
  if (!name) return reply("❌ Provide an owner name.");

  await setConfig("OWNER_NAME", name);

  await reply(`✅ Owner name updated to: *${name}*\n\n♻️ Restarting...`);
  setTimeout(() => exec("pm2 restart all"), 2000);
});

// FIXED: Mode Command (Private/Public)
cmd({
    pattern: "mode",
    alias: ["setmode"],
    react: "🔐",
    desc: "Set bot mode to private or public.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    const currentMode = getConfig("MODE") || "public";

    if (!args[0]) {
        return reply(`📌 Current mode: *${currentMode}*\n\nUsage: .mode private OR .mode public`);
    }

    const modeArg = args[0].toLowerCase();

    if (["private", "public"].includes(modeArg)) {
        setConfig("MODE", modeArg);
        await reply(`✅ Bot mode is now set to *${modeArg.toUpperCase()}*.\n\n♻ Restarting bot to apply changes...`);

        exec("pm2 restart all", (error, stdout, stderr) => {
            if (error) {
                console.error("Restart error:", error);
                return;
            }
            console.log("PM2 Restart:", stdout || stderr);
        });
    } else {
        return reply("❌ Invalid mode. Please use `.mode private` or `.mode public`.");
    }
});

// FIXED: Auto Typing Command
cmd({
    pattern: "auto_typing",
    alias: ["autotyping"],
    desc: "Enable or disable auto typing",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_TYPING = "true";
        if (saveConfig()) {
            return reply("✅ Auto typing is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_TYPING = "false";
        if (saveConfig()) {
            return reply("❌ Auto typing is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}auto_typing on/off`);
    }
});

// FIXED: Always Online Command
cmd({
    pattern: "always_online",
    alias: ["alwaysonline"],
    desc: "Enable or disable always online",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.ALWAYS_ONLINE = "true";
        if (saveConfig()) {
            return reply("✅ Always online is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.ALWAYS_ONLINE = "false";
        if (saveConfig()) {
            return reply("❌ Always online is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}always_online on/off`);
    }
});

// FIXED: Auto Recording Command
cmd({
    pattern: "auto_recording",
    alias: ["autorecording"],
    desc: "Enable or disable auto recording",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_RECORDING = "true";
        if (saveConfig()) {
            return reply("✅ Auto recording is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_RECORDING = "false";
        if (saveConfig()) {
            return reply("❌ Auto recording is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}auto_recording on/off`);
    }
});

// FIXED: Status View Command
cmd({
    pattern: "status_view",
    alias: ["auto_status_seen"],
    desc: "Enable or disable auto viewing of statuses",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_STATUS_SEEN = "true";
        if (saveConfig()) {
            return reply("✅ Auto status view is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_STATUS_SEEN = "false";
        if (saveConfig()) {
            return reply("❌ Auto status view is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}status_view on/off`);
    }
});

// FIXED: Status React Command
cmd({
    pattern: "status_react",
    alias: ["statusreact"],
    desc: "Enable or disable auto reacting to statuses",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_STATUS_REACT = "true";
        if (saveConfig()) {
            return reply("✅ Auto status react is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_STATUS_REACT = "false";
        if (saveConfig()) {
            return reply("❌ Auto status react is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}status_react on/off`);
    }
});

// FIXED: Read Message Command
cmd({
    pattern: "read_message",
    alias: ["autoread"],
    desc: "Enable or disable read message",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.READ_MESSAGE = "true";
        if (saveConfig()) {
            return reply("✅ Read message is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.READ_MESSAGE = "false";
        if (saveConfig()) {
            return reply("❌ Read message is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}read_message on/off`);
    }
});

// FIXED: Anti Bad Command
cmd({
    pattern: "anti_bad",
    alias: ["antibad"],
    desc: "Enable or disable anti bad words",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.ANTI_BAD = "true";
        if (saveConfig()) {
            return reply("✅ Anti bad words is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.ANTI_BAD = "false";
        if (saveConfig()) {
            return reply("❌ Anti bad words is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}anti_bad on/off`);
    }
});

// FIXED: Auto Sticker Command
cmd({
    pattern: "auto_sticker",
    alias: ["autosticker"],
    desc: "Enable or disable auto sticker",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_STICKER = "true";
        if (saveConfig()) {
            return reply("✅ Auto sticker is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_STICKER = "false";
        if (saveConfig()) {
            return reply("❌ Auto sticker is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}auto_sticker on/off`);
    }
});

// FIXED: Auto Reply Command
cmd({
    pattern: "auto_reply",
    alias: ["autoreply"],
    desc: "Enable or disable auto reply",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_REPLY = "true";
        if (saveConfig()) {
            return reply("✅ Auto reply is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_REPLY = "false";
        if (saveConfig()) {
            return reply("❌ Auto reply is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}auto_reply on/off`);
    }
});

// FIXED: Auto Voice Command
cmd({
    pattern: "auto_voice",
    alias: ["autovoice"],
    desc: "Enable or disable auto voice",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_VOICE = "true";
        if (saveConfig()) {
            return reply("✅ Auto voice is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_VOICE = "false";
        if (saveConfig()) {
            return reply("❌ Auto voice is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}auto_voice on/off`);
    }
});

// FIXED: Auto React Command
cmd({
    pattern: "auto_react",
    alias: ["autoreact","areact"],
    desc: "Enable or disable auto react",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_REACT = "true";
        if (saveConfig()) {
            return reply("✅ Auto react is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_REACT = "false";
        if (saveConfig()) {
            return reply("❌ Auto react is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}auto_react on/off`);
    }
});

// FIXED: Custom Reacts Command
cmd({
    pattern: "custom_reacts",
    alias: ["heartreact","dillreact"],
    desc: "Enable or disable custom reacts",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.CUSTOM_REACT = "true";
        if (saveConfig()) {
            return reply("✅ Custom reacts is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.CUSTOM_REACT = "false";
        if (saveConfig()) {
            return reply("❌ Custom reacts is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}custom_reacts on/off`);
    }
});

// FIXED: Anti Link Command
cmd({
    pattern: "anti_link",
    alias: ["antilink","anti"],
    desc: "Enable or disable anti link",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.ANTI_LINK = "true";
        if (saveConfig()) {
            return reply("✅ Anti link is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.ANTI_LINK = "false";
        if (saveConfig()) {
            return reply("❌ Anti link is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}anti_link on/off`);
    }
});

// FIXED: Status Reply Command
cmd({
    pattern: "status_reply",
    alias: ["autostatusreply"],
    desc: "Enable or disable status reply",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
        config.AUTO_STATUS_REPLY = "true";
        if (saveConfig()) {
            return reply("✅ Status reply is now enabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else if (args[0] === "off") {
        config.AUTO_STATUS_REPLY = "false";
        if (saveConfig()) {
            return reply("❌ Status reply is now disabled");
        } else {
            return reply("❌ Failed to save configuration.");
        }
    } else {
        return reply(`Example: ${prefix}status_reply on/off`);
    }
});
