const config = require('../config');
const { cmd } = require('../command');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();

// Track active downloads per user
const activeReplies = new Map();

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
        if (!q) return await reply("❌ Please provide a Query or Youtube URL!");

        let id = q.startsWith("https://") ? replaceYouTubeID(q) : null;

        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return await reply("❌ No results found!");
            id = searchResults.results[0].videoId;
        }

        const data = await dy_scrap.ytsearch(`https://youtube.com/watch?v=${id}`);
        if (!data?.results?.length) return await reply("❌ Failed to fetch video!");

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
            `1. Audio 🎵\n` +
            `2. Document 📁\n\n` +
            `> *© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝙸𝙽𝙳𝚄𝚆𝙰𝚁𝙰 〽️𝙳*`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: image },
            caption: info
        }, { quoted: mek });

        const messageID = sentMsg.key.id;
        await conn.sendMessage(from, { react: { text: '🎶', key: sentMsg.key } });

        // Reply handler
        const handler = async (update) => {
            try {
                const userMsg = update?.messages?.[0];
                if (!userMsg?.message) return;

                const text = userMsg.message?.conversation || userMsg.message?.extendedTextMessage?.text;
                if (!text) return;

                const repliedToBot = userMsg?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID
                    || userMsg?.key?.id === messageID;

                if (!repliedToBot) return;

                const choice = text.trim();
                if (choice !== "1" && choice !== "2") {
                    await conn.sendMessage(from, {
                        text: "❌ Invalid choice! Please reply with 1 or 2.",
                        quoted: userMsg
                    });
                    return;
                }

                await conn.sendMessage(from, { react: { text: '⬇️', key: userMsg.key } });

                const response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${id}`);
                const downloadUrl = response?.result?.download?.url;

                if (!downloadUrl) {
                    console.log("Download failed:", response);
                    await conn.sendMessage(from, {
                        text: "❌ Failed to generate download link.",
                        quoted: userMsg
                    });
                    return;
                }

                if (choice === "1") {
                    await conn.sendMessage(from, {
                        audio: { url: downloadUrl },
                        mimetype: "audio/mpeg"
                    }, { quoted: mek });
                } else {
                    await conn.sendMessage(from, {
                        document: { url: downloadUrl },
                        fileName: `${title}.mp3`,
                        mimetype: "audio/mpeg",
                        caption: title
                    }, { quoted: mek });
                }

                await conn.sendMessage(from, { react: { text: '✅', key: userMsg.key } });

            } catch (err) {
                console.error("Reply handler error:", err);
                await conn.sendMessage(from, {
                    text: `❌ Error: ${err?.message || String(err)}`
                });
            } finally {
                conn.ev.off('messages.upsert', handler);
                activeReplies.delete(from);
            }
        };

        conn.ev.on('messages.upsert', handler);

        // Auto timeout cleanup after 60s
        setTimeout(() => {
            conn.ev.off('messages.upsert', handler);
            activeReplies.delete(from);
        }, 60000);

    } catch (error) {
        console.error("Main command error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ Error: ${error?.message || String(error)}`);
        activeReplies.delete(from);
    }
});

// VIDEO (mp4) command
cmd({
    pattern: "video",
    alias: ["mp4", "ytmp4"],
    react: "🎬",
    desc: "Download YouTube video as mp4",
    category: "download",
    use: ".video <Text or YT URL>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a query or YouTube URL!");

        if (activeReplies.has(from)) {
            return await reply("⏳ Please wait for the previous video process to finish.");
        }

        let id = q.startsWith("https://") ? replaceYouTubeID(q) : null;

        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return await reply("❌ No results found!");
            id = searchResults.results[0].videoId;
        }

        const data = await dy_scrap.ytdetail(`https://youtube.com/watch?v=${id}`);
        if (!data?.result) return await reply("❌ Failed to fetch video details!");

        const { title, duration, views, ago, channel, url, thumbnail } = data.result;

        let info = `*🎬 INDUWARA-MD VIDEO DOWNLOADER*\n\n` +
`╭━━━━━━━━━━━━━━━┈⊷\n` +
`│ 🎬 *Title:* ${title || "Unknown"}\n` +
`│ ⏳ *Duration:* ${duration || "Unknown"}\n` +
`│ 👀 *Views:* ${views || "Unknown"}\n` +
`│ 🌏 *Published:* ${ago || "Unknown"}\n` +
`│ 👤 *Channel:* ${channel?.name || "Unknown"}\n` +
`│ 🖇 *URL:* ${url || "Unknown"}\n` +
`│\n` +
`│ 🔽 *Reply with your choice:*\n` +
`╰──────────────┈⊷\n` +
`  1. Stream 🎬\n` +
`  2. Document 📁\n\n` +
`> *© Powered by Induwara MD*`;

        const sentMsg = await conn.sendMessage(from, { image: { url: thumbnail }, caption: info }, { quoted: mek });
        const messageID = sentMsg.key.id;
        await conn.sendMessage(from, { react: { text: '🎥', key: sentMsg.key } });

        activeReplies.set(from, true);

        const timeout = setTimeout(() => {
            activeReplies.delete(from);
        }, 3 * 60 * 1000); // 3 minutes timeout

        const handler = async (update) => {
            try {
                const mekInfo = update?.messages?.[0];
                if (!mekInfo?.message) return;

                const text = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
                if (!text) return;

                const contextStanza = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId;
                const isReplyToSentMsg = contextStanza === messageID || mekInfo?.key?.id === messageID;
                if (!isReplyToSentMsg) return;

                const userReply = text.trim();

                if (userReply !== "1" && userReply !== "2") {
                    await conn.sendMessage(from, { text: "❌ Invalid choice! Please reply with 1 or 2.", quoted: mekInfo });
                    return;
                }

                await conn.sendMessage(from, { react: { text: '⬇️', key: mekInfo.key } });

                const response = await dy_scrap.ytmp4(`https://youtube.com/watch?v=${id}`);
                console.log("ytmp4 response:", response);

                const downloadUrl = response?.result?.download?.url;
                if (!downloadUrl) {
                    await conn.sendMessage(from, { text: "❌ Could not get the download link.", quoted: mekInfo });
                    return;
                }

                if (userReply === "1") {
                    await conn.sendMessage(from, { video: { url: downloadUrl }, mimetype: "video/mp4" }, { quoted: mek });
                } else if (userReply === "2") {
                    await conn.sendMessage(from, {
                        document: { url: downloadUrl },
                        fileName: `${title}.mp4`,
                        mimetype: "video/mp4",
                        caption: title
                    }, { quoted: mek });
                }

                await conn.sendMessage(from, { react: { text: '✅', key: mekInfo.key } });

                activeReplies.delete(from);
                clearTimeout(timeout);
                conn.ev.off('messages.upsert', handler);

            } catch (error) {
                console.error(error);
                await conn.sendMessage(from, { text: `❌ Error while processing: ${error.message || "Unknown error!"}`, quoted: mek });
                activeReplies.delete(from);
                clearTimeout(timeout);
                conn.ev.off('messages.upsert', handler);
            }
        };

        conn.ev.on('messages.upsert', handler);

    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message || "Unknown error!"}`, quoted: mek });
    }
});
