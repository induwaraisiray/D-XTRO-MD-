const config = require('../config');
const { cmd } = require('../command');
const { ytsearch, ytmp3, ytmp4, song, video } = require('@dark-yasiya/yt-dl.js');
const fetch = require('node-fetch');

// 🎵 Fast Song Downloader (No external API)
cmd({
    pattern: "song",
    alias: ["yta", "play"],
    react: "🎧",
    desc: "Download Youtube song fast",
    category: "main",
    use: '.song < Yt url or Name >',
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a YouTube URL or song name!");

        const yt = await ytsearch(q);
        if (!yt.results || yt.results.length < 1) return reply("No results found!");

        let yts = yt.results[0];
        let mp3 = await ytmp3(yts.url); // Direct download link

        const { url, title, image, timestamp, ago, views, author } = yts;

        let ytmsg = `*🎵 INDUWARA MD SONG DOWNLOADER*\n\n` +
            `╭━━━━━━━━━━━━━━━┈⊷\n` +
            `│ 🎵 *Title:* ${title || "Unknown"}\n` +
            `│ ⏳ *Duration:* ${timestamp || "Unknown"}\n` +
            `│ 👀 *Views:* ${views || "Unknown"}\n` +
            `│ 🌏 *Release Ago:* ${ago || "Unknown"}\n` +
            `│ 👤 *Author:* ${author?.name || "Unknown"}\n` +
            `│ 🖇 *Url:* ${url || "Unknown"}\n` +
            `│\n` +
            `│ 🔽 *Auto downloading....*\n` +
            `╰──────────────┈⊷\n` +
            `> *© POWERED BY INDUWARA 〽️MD*`;

        // Send song details
        await conn.sendMessage(from, { image: { url: image || '' }, caption: ytmsg }, { quoted: mek });

        // Send audio fast (buffer method)
        let res = await fetch(mp3.dl_link);
        let buffer = await res.buffer();
        await conn.sendMessage(from, { audio: buffer, mimetype: "audio/mpeg" }, { quoted: mek });

        // Optional: Send as document
        await conn.sendMessage(from, {
            document: buffer,
            mimetype: "audio/mpeg",
            fileName: `${title || "audio"}.mp3`,
            caption: `> *© POWERED BY INDUWARA 〽️MD*`
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Something went wrong. Please try again.");
    }
});

// 🎥 Fast Video Downloader (No external API)
cmd({
    pattern: "mp4",
    alias: ["video", "ytv"],
    react: "🎥",
    desc: "Download Youtube video fast",
    category: "main",
    use: '.video < Yt url or Name >',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a YouTube URL or video name!");

        const yt = await ytsearch(q);
        if (!yt.results || yt.results.length < 1) return reply("No results found!");

        let yts = yt.results[0];
        let mp4 = await ytmp4(yts.url); // Direct download link

        const { url, title, image, timestamp, ago, views, author } = yts;

        let ytmsg = `*🎬 INDUWARA MD VIDEO DOWNLOADER*\n\n` +
            `╭━━━━━━━━━━━━━━━┈⊷\n` +
            `│ 🎬 *Title:* ${title || "Unknown"}\n` +
            `│ ⏳ *Duration:* ${timestamp || "Unknown"}\n` +
            `│ 👀 *Views:* ${views || "Unknown"}\n` +
            `│ 🌏 *Release Ago:* ${ago || "Unknown"}\n` +
            `│ 👤 *Author:* ${author?.name || "Unknown"}\n` +
            `│ 🖇 *Url:* ${url || "Unknown"}\n` +
            `│\n` +
            `│ 🔽 *Auto downloading....*\n` +
            `╰──────────────┈⊷\n` +
            `> *© POWERED BY INDUWARA 〽️MD*`;

        // Send video details
        await conn.sendMessage(from, { image: { url: image || '' }, caption: ytmsg }, { quoted: mek });

        // Send video fast (buffer method)
        let res = await fetch(mp4.dl_link);
        let buffer = await res.buffer();
        await conn.sendMessage(from, { video: buffer, mimetype: "video/mp4" }, { quoted: mek });

        // Optional: Send as document
        await conn.sendMessage(from, {
            document: buffer,
            mimetype: "video/mp4",
            fileName: `${title || "video"}.mp4`,
            caption: `> *© POWERED BY INDUWARA 〽️MD*`
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Something went wrong. Please try again.");
    }
});    
