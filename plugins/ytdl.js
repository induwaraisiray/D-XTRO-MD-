const config = require('../config');
const { cmd } = require('../command');
const { ytsearch, ytmp3 } = require('@dark-yasiya/yt-dl.js'); 

cmd({
    pattern: "song",
    alias: ["yta", "play"],
    react: "🎶",
    desc: "Download Youtube song",
    category: "main",
    use: '.song < Yt url or Name >',
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        const yt = await ytsearch(q);
        if (!yt.results || yt.results.length < 1) return reply("No results found!");

        let yts = yt.results[0];
        let apiUrl = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(yts.url)}`;

        let response = await fetch(apiUrl);
        let data = await response.json();

        if (data.status !== 200 || !data.success || !data.result.downloadUrl) {
            return reply("Failed to fetch the audio. Please try again later.");
        }

        const { url, title, image, timestamp, ago, views, author } = yts;

        let ytmsg = `*🎵 INDUWARA-MD SONG DOWNLOADER*\n\n` +
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
            `> *© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝙸𝙽𝙳𝚄𝚆𝙰𝚁𝙰 〽️𝙳*`;

        // Send song details as image + caption
        await conn.sendMessage(from, { image: { url: image || '' }, caption: ytmsg }, { quoted: mek });

        // Send audio file
        await conn.sendMessage(from, { audio: { url: data.result.downloadUrl }, mimetype: "audio/mpeg" }, { quoted: mek });

        // Send document version
        await conn.sendMessage(from, {
            document: { url: data.result.downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title || "audio"}.mp3`,
            caption: `> *© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝙸𝙽𝙳𝚄𝚆𝙰𝚁𝙰 〽️𝙳*`
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ The misconception has been incorrect. Please try again.");
    }
});

//yt video

cmd({
  pattern: 'video',
  desc: 'Download video from YouTube by title',
  category: 'download',
  react: '🎬',
}, async (darknero, match, m, { text }) => {
  try {
    if (!text) return match.reply('❗ Please enter a video title.\n\nExample: *.video Faded*');

    match.reply('*🔎 Please Wait...*');

    const search = await yts(text);
    if (!search || !search.videos.length) return match.reply('❌ No video results found.');

    const video = search.videos[0];
    const yt = video.url;

    const api = `https://apis.davidcyriltech.my.id/youtube/mp4?url=${encodeURIComponent(yt)}`;
    const { data } = await axios.get(api);

    if (!data || !data.status || !data.result) {
      return match.reply('❌ Failed.');
    }

    const { title, thumbnail, url: downloadLink } = data.result;

    await darknero.sendMessage(m.chat, {
      video: { url: downloadLink },
      caption: `*Done ✅*`,
      mimetype: 'video/mp4',
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    match.reply('❌ Error.');
  }
});
