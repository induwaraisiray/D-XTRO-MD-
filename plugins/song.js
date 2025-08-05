const config = require('../config');
const { cmd } = require('../command');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();

function replaceYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

const activeListeners = new Set();

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
        if (!q) return await reply("❌ Please provide a Query or YouTube URL!");

        let id = q.startsWith("https://") ? replaceYouTubeID(q) : null;

        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return await reply("❌ No results found!");
            id = searchResults.results[0].videoId;
        }

        const data = await dy_scrap.ytsearch(`https://youtube.com/watch?v=${id}`);
        if (!data?.results?.length) return await reply("❌ Failed to fetch video!");

        const { url, title, image, timestamp, ago, views, author } = data.results[0];

        let info = `*🎵INDUWARA-MD SONG DOWNLOADER*\n\n` +
            `🎵 *Title:* ${title || "Unknown"}\n` +
            `⏳ *Duration:* ${timestamp || "Unknown"}\n` +
            `👀 *Views:* ${views || "Unknown"}\n` +
            `🌏 *Released:* ${ago || "Unknown"}\n` +
            `👤 *Author:* ${author?.name || "Unknown"}\n` +
            `🖇 *URL:* ${url || "Unknown"}\n\n` +
            `🔽 *Reply with one of the following:*\n` +
            `1.1 *Audio Type* 🎵\n` +
            `1.2 *Document Type* 📁`;

        const sentMsg = await conn.sendMessage(from, { image: { url: image }, caption: info }, { quoted: mek });
        const messageID = sentMsg.key.id;

        // Avoid multiple listeners
        if (activeListeners.has(messageID)) return;
        activeListeners.add(messageID);

        const listener = async (messageUpdate) => {
            try {
                const mekInfo = messageUpdate?.messages?.[0];
                if (!mekInfo?.message) return;

                const userMsg = mekInfo.message.conversation || mekInfo.message.extendedTextMessage?.text;
                const isReply = mekInfo.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (!isReply) return;

                let trimmed = userMsg.trim();
                let type;
                let msg;
                const response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${id}`);
                const downloadUrl = response?.result?.download?.url;

                if (!downloadUrl) return await reply("❌ Download link not found!");

                if (trimmed === "1.1") {
                    msg = await conn.sendMessage(from, { text: "🎧 Uploading Audio..." }, { quoted: mek });
                    type = { audio: { url: downloadUrl }, mimetype: "audio/mpeg" };

                } else if (trimmed === "1.2") {
                    msg = await conn.sendMessage(from, { text: "📁 Uploading Document..." }, { quoted: mek });
                    type = {
                        document: { url: downloadUrl },
                        fileName: `${title}.mp3`,
                        mimetype: "audio/mpeg",
                        caption: title
                    };

                } else {
                    return await reply("❌ Invalid choice! Reply with 1.1 or 1.2.");
                }

                await conn.sendMessage(from, type, { quoted: mek });
                await conn.sendMessage(from, { text: '✅ Upload Complete!', edit: msg.key });

                // Clean up
                conn.ev.off('messages.upsert', listener);
                activeListeners.delete(messageID);

            } catch (err) {
                console.error(err);
                await reply("❌ Error occurred while processing your request.");
                conn.ev.off('messages.upsert', listener);
                activeListeners.delete(messageID);
            }
        };

        conn.ev.on('messages.upsert', listener);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ *An error occurred:* ${err.message || "Error!"}`);
    }
});
