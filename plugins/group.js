const { cmd, commands } = require('../command');
const config = require('../config');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions');
const { writeFileSync } = require('fs');
const path = require('path');

// Helper function to normalize JIDs
const normalizeJid = (jid) => jid.includes('@') ? jid : jid + '@s.whatsapp.net';

// Get the bot owner's JID from the config file or environment variables
const botOwnerJid = normalizeJid(config.DEV);

// --- GROUP COMMANDS ---

// Command to list all pending group join requests
cmd({
    pattern: "requestlist",
    desc: "Shows pending group join requests",
    category: "group",
    react: "👀",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '👀', key: m.key } });

        if (!isGroup) {
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            return reply("❌ I need to be an admin to view join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);

        if (requests.length === 0) {
            return reply("✅ No pending join requests.");
        }

        let text = `👥 *Pending Join Requests (${requests.length})*\n\n`;
        requests.forEach((user, i) => {
            text += `${i + 1}. @${user.jid.split('@')[0]}\n`;
        });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        return reply(text, { mentions: requests.map(u => u.jid) });
    } catch (error) {
        console.error("Request list error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        return reply("❌ Failed to fetch join requests.");
    }
});

// Command to accept all pending join requests
cmd({
    pattern: "acceptall",
    desc: "Accepts all pending group join requests",
    category: "group",
    react: "✔️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '✔️', key: m.key } });

        if (!isGroup) {
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            return reply("❌ I need to be an admin to accept join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);

        if (requests.length === 0) {
            return reply("✅ No pending join requests to accept.");
        }

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "approve");

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        return reply(`✅ Successfully accepted ${requests.length} join requests.`);
    } catch (error) {
        console.error("Accept all error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        return reply("❌ Failed to accept join requests.");
    }
});

// Command to reject all pending join requests
cmd({
    pattern: "rejectall",
    desc: "Rejects all pending group join requests",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });

        if (!isGroup) {
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            return reply("❌ I need to be an admin to reject join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);

        if (requests.length === 0) {
            return reply("✅ No pending join requests to reject.");
        }

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "reject");

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        return reply(`✅ Successfully rejected ${requests.length} join requests.`);
    } catch (error) {
        console.error("Reject all error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        return reply("❌ Failed to reject join requests.");
    }
});

// Command to add a member to the group
cmd({
    pattern: "add",
    alias: ["a", "invite"],
    desc: "Adds a member to the group",
    category: "admin",
    react: "➕",
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isAdmins, isBotAdmins, reply, quoted, sender, botNumber2 }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins) return reply("❌ Only group admins can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else if (q && /^\d+$/.test(q)) {
        number = q;
    } else {
        return reply("❌ Please reply to a message, mention a user, or provide a number to add.");
    }

    const jid = number + "@s.whatsapp.net";
    const botJid = conn.user.id;

    if (jid === botJid) {
        return reply("❌ I cannot add myself to the group.");
    }

    const groupMetadata = await conn.groupMetadata(from);
    const participants = groupMetadata.participants.map(p => p.id);

    if (participants.includes(jid)) {
        return reply("❌ This user is already a member of the group.");
    }

    try {
        await conn.groupParticipantsUpdate(from, [jid], "add");
        reply(`✅ Successfully added @${number}`, { mentions: [jid] });
    } catch (error) {
        console.error("Add command error:", error);
        reply("❌ Failed to add the member. This may be because the user has privacy settings enabled or is not a contact.");
    }
});

// Command to take adminship for authorized users
cmd({
    pattern: "admin",
    alias: ["takeadmin", "makeadmin"],
    desc: "Take adminship for authorized users",
    category: "owner",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { from, sender, isBotAdmins, isGroup, reply }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to perform this action.");

    const authorizedUsers = [botOwnerJid, "94788770020@s.whatsapp.net"].filter(Boolean);
    const senderNormalized = normalizeJid(sender);

    if (!authorizedUsers.includes(senderNormalized)) {
        return reply("❌ This command is restricted to authorized users only.");
    }

    try {
        const groupMetadata = await conn.groupMetadata(from);
        const userParticipant = groupMetadata.participants.find(p => p.id === senderNormalized);

        if (userParticipant?.admin) {
            return reply("✅ You're already an admin in this group.");
        }

        await conn.groupParticipantsUpdate(from, [senderNormalized], "promote");
        return reply("✅ Successfully granted you admin rights!");

    } catch (error) {
        console.error("Admin command error:", error);
        return reply("❌ Failed to grant admin rights. Error: " + error.message);
    }
});

// Command to demote a group admin
cmd({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin"],
    desc: "Demotes a group admin to a normal member",
    category: "admin",
    react: "⬇️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply, quoted, q, botNumber }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins) return reply("❌ Only group admins can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply("❌ Please reply to a message or provide a number to demote.");
    }

    if (number === botNumber) return reply("❌ The bot cannot demote itself.");

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(from, [jid], "demote");
        reply(`✅ Successfully demoted @${number} to a normal member.`, { mentions: [jid] });
    } catch (error) {
        console.error("Demote command error:", error);
        reply("❌ Failed to demote the member.");
    }
});

// Command to update group description
cmd({
    pattern: "updategdesc",
    alias: ["upgdesc", "gdesc"],
    react: "📜",
    desc: "Change the group description.",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, q, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to update the group description.");
        if (!q) return reply("❌ Please provide a new group description.");

        await conn.groupUpdateDescription(from, q);
        reply("✅ Group description has been updated.");
    } catch (e) {
        console.error("Error updating group description:", e);
        reply("❌ Failed to update the group description. Please try again.");
    }
});

// Command to update group name
cmd({
    pattern: "updategname",
    alias: ["upgname", "gname"],
    react: "📝",
    desc: "Change the group name.",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, q, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to update the group name.");
        if (!q) return reply("❌ Please provide a new group name.");

        await conn.groupUpdateSubject(from, q);
        reply(`✅ Group name has been updated to: *${q}*`);
    } catch (e) {
        console.error("Error updating group name:", e);
        reply("❌ Failed to update the group name. Please try again.");
    }
});

// Command to get group information
cmd({
    pattern: "ginfo",
    react: "🥏",
    alias: ["groupinfo"],
    desc: "Get group information.",
    category: "group",
    use: '.ginfo',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isDev, reply, groupMetadata, participants }) => {
    try {
        if (!isGroup) return reply(`❌ This command only works in group chats.`);
        if (!isAdmins && !isDev) return reply(`⛔ Only *Group Admins* or *Bot Dev* can use this.`);
        if (!isBotAdmins) return reply(`❌ I need *admin* rights to fetch group details.`);

        const fallbackPpUrls = ['https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png'];
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = fallbackPpUrls[Math.floor(Math.random() * fallbackPpUrls.length)];
        }

        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        const owner = groupMetadata.owner || groupAdmins[0]?.id || "unknown";

        const gdata = `*「 Group Information 」*\n
*Group Name* : ${groupMetadata.subject}
*Group ID* : ${groupMetadata.id}
*Participants* : ${groupMetadata.size}
*Group Creator* : @${owner.split('@')[0]}
*Description* : ${groupMetadata.desc?.toString() || 'No description'}\n
*Admins (${groupAdmins.length})*:\n${listAdmin}`

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: gdata,
            mentions: groupAdmins.map(v => v.id).concat([owner])
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ An error occurred:\n\n${e}`);
    }
});

// Command to join a group from an invite link
cmd({
    pattern: "join",
    react: "📬",
    alias: ["joinme", "f_join"],
    desc: "To Join a Group from Invite link",
    category: "group",
    use: '.join < Group Link >',
    filename: __filename
}, async (conn, mek, m, { from, q, quoted, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❌ You don't have permission to use this command.");

        let groupLink;
        if (quoted && quoted.type === 'conversation' && isUrl(quoted.text)) {
            groupLink = quoted.text.split('https://chat.whatsapp.com/')[1];
        } else if (q && isUrl(q)) {
            groupLink = q.split('https://chat.whatsapp.com/')[1];
        }

        if (!groupLink) return reply("❌ Invalid Group Link 🖇️");

        await conn.groupAcceptInvite(groupLink);
        await conn.sendMessage(from, { text: `✅ Successfully Joined` }, { quoted: mek });

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`❌ Error Occurred!!\n\n${e}`);
    }
});

// Command to remove a member from the group
cmd({
    pattern: "remove",
    alias: ["kick", "k"],
    desc: "Removes a member from the group",
    category: "admin",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isAdmins, isBotAdmins, reply, quoted, senderNumber }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins) return reply("❌ Only group admins can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply("❌ Please reply to a message or mention a user to remove.");
    }

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(from, [jid], "remove");
        reply(`✅ Successfully removed @${number}`, { mentions: [jid] });
    } catch (error) {
        console.error("Remove command error:", error);
        reply("❌ Failed to remove the member.");
    }
});

// Command to leave the group
cmd({
    pattern: "leave",
    alias: ["left", "leftgc", "leavegc"],
    desc: "Leave the group",
    react: "🎉",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, sender, isGroup, reply }) => {
    try {
        if (!isGroup) {
            return reply("❌ This command can only be used in groups.");
        }

        if (normalizeJid(sender) !== botOwnerJid) {
            return reply("❌ Only the bot owner can use this command.");
        }

        reply("Leaving group...");
        await sleep(1500);
        await conn.groupLeave(from);
    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e}`);
    }
});

// Command to get group invite link
cmd({
    pattern: "invite",
    alias: ["glink", "grouplink"],
    desc: "Get group invite link.",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command is only for groups.");
        if (!isAdmins) return reply("❌ You must be an admin to use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to get the group invite link.");

        const inviteCode = await conn.groupInviteCode(from);
        if (!inviteCode) return reply("❌ Failed to retrieve the invite code.");

        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
        return reply(`✅ Here is your group invite link:\n${inviteLink}`);
    } catch (error) {
        console.error("Error in invite command:", error);
        reply(`❌ An error occurred: ${error.message || "Unknown error"}`);
    }
});

// Command to lock the group
cmd({
    pattern: "lockgc",
    alias: ["lock"],
    react: "🔒",
    desc: "Lock the group (Prevents non-admins from sending messages).",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to lock the group.");

        await conn.groupSettingUpdate(from, "announcement");
        reply("✅ Group has been locked. Only admins can send messages now.");
    } catch (e) {
        console.error("Error locking group:", e);
        reply("❌ Failed to lock the group. Please try again.");
    }
});

// Command to mute the group (old pattern, same as lockgc)
cmd({
    pattern: "mute",
    alias: ["groupmute"],
    react: "🔇",
    desc: "Mute the group (Only admins can send messages).",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to mute the group.");

        await conn.groupSettingUpdate(from, "announcement");
        reply("✅ Group has been muted. Only admins can send messages.");
    } catch (e) {
        console.error("Error muting group:", e);
        reply("❌ Failed to mute the group. Please try again.");
    }
});

// Command to create a new group
cmd({
    pattern: "newgc",
    category: "group",
    desc: "Create a new group and add participants.",
    filename: __filename,
}, async (conn, mek, m, { from, body, sender, reply }) => {
    try {
        if (!body) {
            return reply(`Usage: !newgc group_name;number1,number2,...`);
        }

        const [groupName, numbersString] = body.split(";");

        if (!groupName || !numbersString) {
            return reply(`Usage: !newgc group_name;number1,number2,...`);
        }

        const participantNumbers = numbersString.split(",").map(number => `${number.trim()}@s.whatsapp.net`);

        const group = await conn.groupCreate(groupName, participantNumbers);

        await conn.sendMessage(group.id, { text: 'Hello there' });

        const inviteLink = await conn.groupInviteCode(group.id);
        reply(`Group created successfully with invite link: https://chat.whatsapp.com/${inviteLink}`);
    } catch (e) {
        return reply(`❌ An error occurred while processing your request.\n\n_Error:_ ${e.message}`);
    }
});

// Command to remove all members with a specific country code
cmd({
    pattern: "out",
    alias: ["ck", "🦶"],
    desc: "Removes all members with a specific country code from the group",
    category: "admin",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isBotAdmins, reply, groupMetadata, isCreator }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isCreator) return reply("❌ Only the bot owner can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");
    if (!q) return reply("❌ Please provide a country code. Example: .out 92");

    const countryCode = q.trim();
    if (!/^\d+$/.test(countryCode)) {
        return reply("❌ Invalid country code. Please provide only numbers (e.g., 92 for +92 numbers)");
    }

    try {
        const participants = await groupMetadata.participants;
        const targets = participants.filter(
            participant => participant.id.startsWith(countryCode) && !participant.admin
        );

        if (targets.length === 0) {
            return reply(`❌ No members found with country code +${countryCode}`);
        }

        const jids = targets.map(p => p.id);
        await conn.groupParticipantsUpdate(from, jids, "remove");

        reply(`✅ Successfully removed ${targets.length} members with country code +${countryCode}`);
    } catch (error) {
        console.error("Out command error:", error);
        reply("❌ Failed to remove members. Error: " + error.message);
    }
});

// Command to create a poll
cmd({
    pattern: "poll",
    category: "group",
    desc: "Create a poll with a question and options in the group.",
    filename: __filename,
}, async (conn, mek, m, { from, body, prefix, reply }) => {
    try {
        let [question, optionsString] = body.split(";");

        if (!question || !optionsString) {
            return reply(`Usage: ${prefix}poll question;option1,option2,option3...`);
        }

        let options = optionsString.split(",").filter(option => option && option.trim() !== "").map(option => option.trim());

        if (options.length < 2) {
            return reply("*Please provide at least two options for the poll.*");
        }

        await conn.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1,
            }
        }, { quoted: mek });
    } catch (e) {
        return reply(`❌ An error occurred while processing your request.\n\n_Error:_ ${e.message}`);
    }
});

// Command to promote a member to group admin
cmd({
    pattern: "promote",
    alias: ["p", "makeadmin"],
    desc: "Promotes a member to group admin",
    category: "admin",
    react: "⬆️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply, quoted, q, botNumber }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins) return reply("❌ Only group admins can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply("❌ Please reply to a message or provide a number to promote.");
    }

    if (number === botNumber) return reply("❌ The bot cannot promote itself.");

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(from, [jid], "promote");
        reply(`✅ Successfully promoted @${number} to admin.`, { mentions: [jid] });
    } catch (error) {
        console.error("Promote command error:", error);
        reply("❌ Failed to promote the member.");
    }
});

// Command to revoke the group invite link
cmd({
    pattern: "revoke",
    react: "🖇️",
    alias: ["revokegrouplink", "resetglink", "revokelink", "f_revoke"],
    desc: "To Reset the group link",
    category: "group",
    use: '.revoke',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply(`❌ This command only works in groups.`);
        if (!isAdmins) return reply(`⛔ You must be a *Group Admin* to use this command.`);
        if (!isBotAdmins) return reply(`❌ I need to be *admin* to reset the group link.`);

        await conn.groupRevokeInvite(from);
        await conn.sendMessage(from, { text: `✅ *Group Link has been reset successfully!*` }, { quoted: mek });
    } catch (err) {
        console.error(err);
        reply(`❌ Error resetting group link.`);
    }
});

// Command to hide tag all members
cmd({
    pattern: "hidetag",
    alias: ["tag", "h"],
    react: "🔊",
    desc: "To Tag all Members for Any Message/Media",
    category: "group",
    use: '.hidetag Hello',
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isCreator, isAdmins, participants, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins && !isCreator) return reply("❌ Only group admins can use this command.");

        const mentionAll = { mentions: participants.map(u => u.id) };

        if (!q && !m.quoted) {
            return reply("❌ Please provide a message or reply to a message to tag all members.");
        }

        if (m.quoted) {
            const type = m.quoted.mtype || '';
            const caption = m.quoted.text || m.quoted.caption || "No message content found.";

            if (type === 'extendedTextMessage') {
                return await conn.sendMessage(from, { text: caption, ...mentionAll }, { quoted: mek });
            }

            if (['imageMessage', 'videoMessage'].includes(type)) {
                try {
                    const buffer = await m.quoted.download?.();
                    if (!buffer) return reply("❌ Failed to download the quoted media.");
                    const mediaType = type === 'imageMessage' ? 'image' : 'video';
                    const content = { [mediaType]: buffer, caption: caption, ...mentionAll };
                    return await conn.sendMessage(from, content, { quoted: mek });
                } catch (e) {
                    console.error("Media download/send error:", e);
                    return reply("❌ Failed to process the media. Sending as text instead.");
                }
            }

            return await conn.sendMessage(from, { text: caption, ...mentionAll }, { quoted: mek });
        }

        if (q) {
            await conn.sendMessage(from, { text: q, ...mentionAll }, { quoted: mek });
        }

    } catch (e) {
        console.error(e);
        reply(`❌ *Error Occurred !!*\n\n${e.message}`);
    }
});

// Command to tag all members
cmd({
    pattern: "tagall",
    react: "🔊",
    alias: ["gc_tagall"],
    desc: "To Tag all Members",
    category: "group",
    use: '.tagall [message]',
    filename: __filename
}, async (conn, mek, m, { from, participants, reply, isGroup, groupAdmins, sender }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        const isSenderAdmin = groupAdmins.includes(sender);
        const isBotOwner = normalizeJid(sender) === botOwnerJid;

        if (!isSenderAdmin && !isBotOwner) {
            return reply("❌ Only group admins or the bot owner can use this command.");
        }

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply("❌ Failed to fetch group information.");

        let groupName = groupInfo.subject || "Unknown Group";
        let totalMembers = participants ? participants.length : 0;
        if (totalMembers === 0) return reply("❌ No members found in this group.");

        let emojis = ['📢', '🔊', '🌐', '🔰', '❤‍🩹', '🤍', '🖤', '🩵', '📝', '💗', '🔖', '🪩', '📦', '🎉', '🛡️', '💸', '⏳', '🗿', '🚀', '🎧', '🪀', '⚡', '🚩', '🍁', '🗣️', '👻', '⚠️', '🔥'];
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let message = m.body.split(m.command)[1]?.trim() || "Attention Everyone";

        let teks = `▢ Group : *${groupName}*\n▢ Members : *${totalMembers}*\n▢ Message: *${message}*\n\n┌───⊷ *MENTIONS*\n`;

        for (let mem of participants) {
            if (!mem.id) continue;
            teks += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
        }

        teks += "└──✪ INDUWARA ┃ MD-V2 ✪──";

        conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });

    } catch (e) {
        console.error("TagAll Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

// Command to remove all non-admin members
cmd({
    pattern: "removemembers",
    alias: ["kickall", "endgc", "endgroup"],
    desc: "Remove all non-admin members from the group.",
    react: "🎉",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, groupMetadata, isBotAdmins, sender, reply, isGroup }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        if (normalizeJid(sender) !== botOwnerJid) {
            return reply("❌ Only the bot owner can use this command.");
        }

        if (!isBotAdmins) {
            return reply("❌ I need to be an admin to execute this command.");
        }

        const allParticipants = groupMetadata.participants;
        const nonAdminParticipants = allParticipants.filter(member => !member.admin);

        if (nonAdminParticipants.length === 0) {
            return reply("✅ There are no non-admin members to remove.");
        }

        reply(`Starting to remove ${nonAdminParticipants.length} non-admin members...`);

        for (let participant of nonAdminParticipants) {
            try {
                await conn.groupParticipantsUpdate(from, [participant.id], "remove");
                await sleep(2000);
            } catch (e) {
                console.error(`Failed to remove ${participant.id}:`, e);
            }
        }

        reply("✅ Successfully removed all non-admin members from the group.");
    } catch (e) {
        console.error("Error removing non-admin users:", e);
        reply("❌ An error occurred while trying to remove non-admin members. Please try again.");
    }
});

// Command to remove only admins (excluding bot and owner)
cmd({
    pattern: "removeadmins",
    alias: ["kickadmins", "kickall3", "deladmins"],
    desc: "Remove all admin members from the group, excluding the bot and bot owner.",
    react: "🎉",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isGroup, sender, groupMetadata, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (normalizeJid(sender) !== botOwnerJid) {
            return reply("❌ Only the bot owner can use this command.");
        }
        if (!isBotAdmins) return reply("❌ I need to be an admin to execute this command.");

        const allParticipants = groupMetadata.participants;
        const botJid = conn.user.id;
        const adminParticipants = allParticipants.filter(member => member.admin && member.id !== botJid && member.id !== botOwnerJid);

        if (adminParticipants.length === 0) {
            return reply("✅ There are no other admin members to remove.");
        }

        reply(`Starting to remove ${adminParticipants.length} admin members...`);

        for (let participant of adminParticipants) {
            try {
                await conn.groupParticipantsUpdate(from, [participant.id], "remove");
                await sleep(2000);
            } catch (e) {
                console.error(`Failed to remove ${participant.id}:`, e);
            }
        }

        reply("✅ Successfully removed all admin members from the group, excluding the bot and bot owner.");
    } catch (e) {
        console.error("Error removing admins:", e);
        reply("❌ An error occurred while trying to remove admins. Please try again.");
    }
});

// Command to remove all members and admins (excluding bot and owner)
cmd({
    pattern: "removeall2",
    alias: ["kickall2", "endgc2", "endgroup2"],
    desc: "Remove all members and admins from the group, excluding the bot and bot owner.",
    react: "🎉",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isGroup, sender, groupMetadata, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (normalizeJid(sender) !== botOwnerJid) {
            return reply("❌ Only the bot owner can use this command.");
        }
        if (!isBotAdmins) return reply("❌ I need to be an admin to execute this command.");

        const allParticipants = groupMetadata.participants;
        const botJid = conn.user.id;
        const participantsToRemove = allParticipants.filter(p => p.id !== botJid && p.id !== botOwnerJid);

        if (participantsToRemove.length === 0) {
            return reply("✅ No members to remove after excluding the bot and bot owner.");
        }

        reply(`Starting to remove ${participantsToRemove.length} members...`);

        for (let participant of participantsToRemove) {
            try {
                await conn.groupParticipantsUpdate(from, [participant.id], "remove");
                await sleep(2000);
            } catch (e) {
                console.error(`Failed to remove ${participant.id}:`, e);
            }
        }

        reply("✅ Successfully removed all members, excluding the bot and bot owner, from the group.");
    } catch (e) {
        console.error("Error removing members:", e);
        reply("❌ An error occurred while trying to remove members. Please try again.");
    }
});

// Command to unlock the group
cmd({
    pattern: "unlockgc",
    alias: ["unlock"],
    react: "🔓",
    desc: "Unlock the group (Allows all members to send messages).",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to unlock the group.");

        await conn.groupSettingUpdate(from, "not_announcement");
        reply("✅ Group has been unlocked. All members can now send messages.");
    } catch (e) {
        console.error("Error unlocking group:", e);
        reply("❌ Failed to unlock the group. Please try again.");
    }
});

// Command to unmute the group (old pattern, same as unlockgc)
cmd({
    pattern: "unmute",
    alias: ["groupunmute"],
    react: "🔊",
    desc: "Unmute the group (Everyone can send messages).",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to unmute the group.");

        await conn.groupSettingUpdate(from, "not_announcement");
        reply("✅ Group has been unmuted. Everyone can send messages.");
    } catch (e) {
        console.error("Error unmuting group:", e);
        reply("❌ Failed to unmute the group. Please try again.");
    }
});
