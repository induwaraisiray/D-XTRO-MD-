const axios = require('axios');
const { cmd } = require('../command');
const yts = require('yt-search');
const fs = require('fs-extra');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions');

// =======================
// DEFINE COMMAND
// =======================
cmd({
    pattern: "define",
    desc: "📖 Get the definition of a word",
    react: "🔍",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a word to define.\n\n📌 *Usage:* .define [word]");

        const word = q.trim();
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

        const response = await axios.get(url);
        const definitionData = response.data[0];

        const definition = definitionData.meanings[0].definitions[0].definition;
        const example = definitionData.meanings[0].definitions[0].example || '❌ No example available';
        const synonyms = definitionData.meanings[0].definitions[0].synonyms.join(', ') || '❌ No synonyms available';
        const phonetics = definitionData.phonetics[0]?.text || '🔇 No phonetics available';
        const audio = definitionData.phonetics.find(p => p.audio)?.audio || null;

        const wordInfo = `
📖 *Word*: *${definitionData.word}*
🗣️ *Pronunciation*: _${phonetics}_
📚 *Definition*: ${definition}
✍️ *Example*: ${example}
📝 *Synonyms*: ${synonyms}

🔗 *© ᴩᴏᴡᴇʀᴅ ʙʏ ɪɴᴅᴜᴡᴀʀᴀ 〽️ᴅ*`;

        if (audio) {
            await conn.sendMessage(from, { audio: { url: audio }, mimetype: 'audio/mpeg' }, { quoted: mek });
        }

        return reply(wordInfo);
    } catch (e) {
        console.error("❌ Error in define command:", e);
        if (e.response && e.response.status === 404) {
            return reply("🚫 *Word not found.* Please check the spelling and try again.");
        }
        return reply("⚠️ An error occurred while fetching the definition. Please try again later.");
    }
});

// =======================
// NPM COMMAND
// =======================
cmd({
  pattern: "npm",
  desc: "Search for a package on npm.",
  react: '📦',
  category: "convert",
  filename: __filename,
  use: ".npm <package-name>"
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args.length) {
      return reply("Please provide the name of the npm package you want to search for. Example: .npm express");
    }

    const packageName = args.join(" ");
    const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error("Package not found or an error occurred.");
    }

    const packageData = response.data;
    const latestVersion = packageData["dist-tags"].latest;
    const description = packageData.description || "No description available.";
    const npmUrl = `https://www.npmjs.com/package/${packageName}`;
    const license = packageData.license || "Unknown";
    const repository = packageData.repository ? packageData.repository.url : "Not available";

    const message = `
> *𝙸𝙽𝙳𝚄𝚆𝙰𝚁𝙰 𝙼𝙳 𝙽𝙿𝙼 𝚂𝙴𝙰𝚁𝙲𝙷*

*🔰 NPM PACKAGE:* ${packageName}
*📄 DESCRIPTION:* ${description}
*⏸️ LAST VERSION:* ${latestVersion}
*🪪 LICENSE:* ${license}
*🪩 REPOSITORY:* ${repository}
*🔗 NPM URL:* ${npmUrl}
`;

    await conn.sendMessage(from, { text: message }, { quoted: mek });

  } catch (error) {
    console.error("❌ Error in npm command:", error);
    if (error.response && error.response.status === 404) {
        return reply(`🚫 Package *"${args.join(" ")}"* not found on npm.`);
    }
    reply("⚠️ An error occurred while fetching the npm package details. Please try again later.");
  }
});

// =======================
// Youtube COMMAND
// =======================
cmd({
    pattern: "yts",
    alias: ["ytsearch"],
    use: '.yts jawad',
    react: "🔎",
    desc: "Search and get details from youtube.",
    category: "search",
    filename: __filename
},
async(conn, mek, m,{from, l, q, reply}) => {
try{
    if (!q) return reply('*Please give me words to search*');

    const arama = await yts(q);
    if (!arama || arama.all.length === 0) {
        return reply('❌ No results found for your search query.');
    }

    let mesaj = '';
    arama.all.forEach((video, index) => {
        mesaj += `*${index + 1}.* 🖲️ *${video.title}*\n🔗 ${video.url}\n\n`;
    });

    await conn.sendMessage(from , { text:  mesaj }, { quoted: mek } );
} catch (e) {
    console.error("❌ Error in yts command:", e);
    reply('⚠️ An error occurred while searching YouTube. Please try again later.');
}
});

// =======================
// YOUTUBE STALK COMMAND
// =======================
cmd({
  pattern: "ytstalk",
  alias: ["ytinfo"],
  desc: "Get details about a YouTube channel.",
  react: "🔍",
  category: "search",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a valid YouTube channel username or ID.");
    }

    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const apiUrl = `https://delirius-apiofc.vercel.app/tools/ytstalk?channel=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.status || !data.data) {
      return reply("⚠️ Failed to fetch YouTube channel details. Ensure the username or ID is correct.");
    }

    const yt = data.data;
    const caption = `╭━━━〔 *YOUTUBE STALKER* 〕━━━⊷\n`
      + `┃👤 *Username:* ${yt.username}\n`
      + `┃📊 *Subscribers:* ${yt.subscriber_count}\n`
      + `┃🎥 *Videos:* ${yt.video_count}\n`
      + `┃🔗 *Channel Link:* (${yt.channel})\n`
      + `╰━━━⪼\n\n`
      + `🔹 *© ᴩᴏᴡᴇʀᴅ ʙʏ ɪɴᴅᴜᴡᴀʀᴀ 〽️ᴅ*`;

    await conn.sendMessage(from, {
      image: { url: yt.avatar },
      caption: caption
    }, { quoted: m });

  } catch (error) {
    console.error("❌ Error in ytstalk command:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});


cmd({
  pattern: "srepo",
  desc: "Fetch information about a GitHub repository.",
  category: "other",
  react: "🍃",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    const repoName = args.join(" ");
    if (!repoName) {
      return reply("❌ Please provide a GitHub repository in the format 📌 `owner/repo`.");
    }

    const apiUrl = `https://api.github.com/repos/${repoName}`;
    const { data } = await axios.get(apiUrl);

    let responseMsg = `📁 *GitHub Repository Info* 📁\n\n`;
    responseMsg += `📌 *Name*: ${data.name}\n`;
    responseMsg += `🔗 *URL*: ${data.html_url}\n`;
    responseMsg += `📝 *Description*: ${data.description || "No description"}\n`;
    responseMsg += `⭐ *Stars*: ${data.stargazers_count}\n`;
    responseMsg += `🍴 *Forks*: ${data.forks_count}\n`;
    responseMsg += `👤 *Owner*: ${data.owner.login}\n`;
    responseMsg += `📅 *Created At*: ${new Date(data.created_at).toLocaleDateString()}\n`;
    responseMsg += `\n> *© ᴩᴏᴡᴇʀᴅ ʙʏ ɪɴᴅᴜᴡᴀʀᴀ 〽️ᴅ*`;

    await conn.sendMessage(from, { text: responseMsg }, { quoted: m });
  } catch (error) {
    console.error("GitHub API Error:", error);
    reply(`❌ Error fetching repository data: ${error.response?.data?.message || error.message}`);
  }
});

cmd({
  pattern: "xstalk",
  alias: ["twitterstalk", "twtstalk"],
  desc: "Get details about a Twitter/X user.",
  react: "🔍",
  category: "search",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a valid Twitter/X username.");
    }

    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const apiUrl = `https://delirius-apiofc.vercel.app/tools/xstalk?username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.status || !data.data) {
      return reply("⚠️ Failed to fetch Twitter/X user details. Ensure the username is correct.");
    }

    const user = data.data;
    const verifiedBadge = user.verified ? "✅" : "❌";

    const caption = `╭━━━〔 *TWITTER/X STALKER* 〕━━━⊷\n`
      + `┃👤 *Name:* ${user.name}\n`
      + `┃🔹 *Username:* @${user.username}\n`
      + `┃✔️ *Verified:* ${verifiedBadge}\n`
      + `┃👥 *Followers:* ${user.followers_count}\n`
      + `┃👤 *Following:* ${user.following_count}\n`
      + `┃📝 *Tweets:* ${user.tweets_count}\n`
      + `┃📅 *Joined:* ${user.created}\n`
      + `┃🔗 *Profile:* [Click Here](${user.url})\n`
      + `╰━━━⪼\n\n`
      + `🔹 *Powered BY JawadTechX*`;

    await conn.sendMessage(from, {
      image: { url: user.avatar },
      caption: caption
    }, { quoted: m });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});



cmd({
  pattern: "tiktokstalk",
  alias: ["tstalk", "ttstalk"],
  react: "📱",
  desc: "Fetch TikTok user profile details.",
  category: "search",
  filename: __filename
}, async (conn, m, store, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❎ Please provide a TikTok username.\n\n*Example:* .tiktokstalk mrbeast");
    }

    const apiUrl = `https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status) {
      return reply("❌ User not found. Please check the username and try again.");
    }

    const user = data.data.user;
    const stats = data.data.stats;

    const profileInfo = `🎭 *TikTok Profile Stalker* 🎭

👤 *Username:* @${user.uniqueId}
📛 *Nickname:* ${user.nickname}
✅ *Verified:* ${user.verified ? "Yes ✅" : "No ❌"}
📍 *Region:* ${user.region}
📝 *Bio:* ${user.signature || "No bio available."}
🔗 *Bio Link:* ${user.bioLink?.link || "No link available."}

📊 *Statistics:*
👥 *Followers:* ${stats.followerCount.toLocaleString()}
👤 *Following:* ${stats.followingCount.toLocaleString()}
❤️ *Likes:* ${stats.heartCount.toLocaleString()}
🎥 *Videos:* ${stats.videoCount.toLocaleString()}

📅 *Account Created:* ${new Date(user.createTime * 1000).toLocaleDateString()}
🔒 *Private Account:* ${user.privateAccount ? "Yes 🔒" : "No 🌍"}

🔗 *Profile URL:* https://www.tiktok.com/@${user.uniqueId}
`;

    const profileImage = { image: { url: user.avatarLarger }, caption: profileInfo };

    await conn.sendMessage(from, profileImage, { quoted: m });
  } catch (error) {
    console.error("❌ Error in TikTok stalk command:", error);
    reply("⚠️ An error occurred while fetching TikTok profile data.");
  }
});


cmd({
    pattern: "wstalk",
    alias: ["channelstalk", "chinfo"],
    desc: "Get WhatsApp channel information",
    category: "utility",
    react: "🔍",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        // Check if URL is provided
        if (!args) return reply("❌ Please provide a WhatsApp channel URL\nExample: .wstalk https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j");

        // Extract channel ID from URL
        const channelId = args.match(/channel\/([0-9A-Za-z]+)/i)?.[1];
        if (!channelId) return reply("❌ Invalid WhatsApp channel URL");

        // API endpoint
        const apiUrl = `https://itzpire.com/stalk/whatsapp-channel?url=https://whatsapp.com/channel/${channelId}`;

        // Fetch channel info
        const response = await axios.get(apiUrl);
        const data = response.data.data;

        // Format the information
        const channelInfo = `╭━━〔 *CHANNEL INFO* 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• *📢 Title*: ${data.title}
┃◈┃• *👥 Followers*: ${data.followers}
┃◈┃• *📝 Description*: ${data.description.replace(/\n/g, '\n┃◈┃• ')}
┃◈└───────────┈⊷
╰──────────────┈⊷
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ Jester Tech`;

        // Send message with channel image
        await conn.sendMessage(from, {
            image: { url: data.img },
            caption: channelInfo,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in wstalk command:", e);
        reply(`❌ Error: ${e.response?.data?.message || e.message}`);
    }
});
