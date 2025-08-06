const config = require('../config');
const { cmd } = require('../command');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();

function extractYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

cmd({
    pattern: "song",
    alias: ["mp3", "ytmp3"],
    react: "🎵",
    desc: "Download Ytmp3",
    category: "download",
    use: ".song <Text or YT URL>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return;

        let id = q.startsWith("https://") ? extractYouTubeID(q) : null;

        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return;
            id = searchResults.results[0].videoId;
        }

        const data = await dy_scrap.ytsearch(`https://youtube.com/watch?v=${id}`);
        if (!data?.results?.length) return;

        const { url, title, image, timestamp, ago, views, author } = data.results[0];

        const info = `*🎵 INDUWARA-MD SONG DOWNLOADER*\n\n` +
            `╭━━━━━━━━━━━━━━━┈⊷\n` +
            `│ 🎵 *Title:* ${title || "Unknown"}\n` +
            `│ ⏳ *Duration:* ${timestamp || "Unknown"}\n` +
            `│ 👀 *Views:* ${views || "Unknown"}\n` +
            `│ 🌏 *Release Ago:* ${ago || "Unknown"}\n` +
            `│ 👤 *Author:* ${author?.name || "Unknown"}\n` +
            `│ 🖇 *Url:* ${url || "Unknown"}\n` +
            `│\n` +
            `│ 🔽 *Reply with your choice:*\n` +
            `╰──────────────┈⊷\n` +
            `1 Audio 🎵\n` +
            `2 Document 📁\n\n` +
            `> *© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝙸𝙽𝙳𝚄𝚆𝙰𝚁𝙰 〽️𝙳*`;

        const sentMsg = await conn.sendMessage(from, { image: { url: image }, caption: info }, { quoted: mek });
        const messageID = sentMsg.key.id;

        // 🎶 Initial preview react
        await conn.sendMessage(from, { react: { text: '🎶', key: sentMsg.key } });

        // Listen once for user reply
        conn.ev.once('messages.upsert', async (messageUpdate) => {
            try {
                const mekInfo = messageUpdate?.messages[0];
                if (!mekInfo?.message) return;

                const messageType = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
                const isReplyToSentMsg = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                if (!isReplyToSentMsg) return;

                let userReply = messageType.trim();

                // Send hidden temp message just to react to
                const tempMsg = await conn.sendMessage(from, { text: ".", quoted: mek });
                await conn.sendMessage(from, { react: { text: '🕐', key: tempMsg.key } });

                let response, type;

                if (userReply === "1") {
                    response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${id}`);
                    let downloadUrl = response?.result?.download?.url;
                    if (!downloadUrl) {
                        await conn.sendMessage(from, { react: { text: '❌', key: tempMsg.key } });
                        return;
                    }

                    type = { audio: { url: downloadUrl }, mimetype: "audio/mpeg" };
                    await conn.sendMessage(from, type, { quoted: mek });
                    await conn.sendMessage(from, { react: { text: '✅', key: tempMsg.key } });

                } else if (userReply === "2") {
                    response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${id}`);
                    let downloadUrl = response?.result?.download?.url;
                    if (!downloadUrl) {
                        await conn.sendMessage(from, { react: { text: '❌', key: tempMsg.key } });
                        return;
                    }

                    type = {
                        document: { url: downloadUrl },
                        fileName: `${title}.mp3`,
                        mimetype: "audio/mpeg",
                        caption: title
                    };
                    await conn.sendMessage(from, type, { quoted: mek });
                    await conn.sendMessage(from, { react: { text: '✅', key: tempMsg.key } });

                } else {
                    // ❌ Invalid choice reaction
                    await conn.sendMessage(from, { react: { text: '❌', key: mekInfo.key } });
                }

            } catch (error) {
                console.error(error);
                await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            }
        });

    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
