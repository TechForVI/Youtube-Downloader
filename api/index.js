const express = require('express');
const axios = require('axios');
const app = express();

// سرچ فنکشن
async function search(q) {
  const r = await axios.get('https://yt-extractor.y2mp3.co/api/youtube/search?q=' + encodeURIComponent(q), {
    headers: {
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
      accept: 'application/json',
      origin: 'https://ytmp3.gg',
      referer: 'https://ytmp3.gg/'
    }
  });
  const i = r.data.items.find(v => v.type === 'stream');
  if (!i) throw new Error('Video not found');
  return i;
}

// ڈاؤن لوڈ فنکشن
async function download(url, type, quality) {
  const payload = type === 'mp4' 
    ? { url, downloadMode: 'video', brandName: 'ytmp3.gg', videoQuality: String(quality), youtubeVideoContainer: 'mp4' }
    : { url, downloadMode: 'audio', brandName: 'ytmp3.gg', audioFormat: 'mp3', audioBitrate: String(quality) };

  const r = await axios.post('https://hub.y2mp3.co', payload, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
      'content-type': 'application/json',
      origin: 'https://ytmp3.gg',
      referer: 'https://ytmp3.gg/'
    }
  });
  return r.data;
}

// مین روٹ
app.get('/', (req, res) => {
  res.status(200).json({ status: "Online", message: "YTDL API is running successfully!" });
});

// ڈاؤن لوڈ اینڈ پوائنٹ
app.get('/api/download', async (req, res) => {
  const { query, type, quality } = req.query;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    let url = query;
    let info = { title: "Unknown", thumbnailUrl: "" };

    if (!/^https?:\/\//i.test(query)) {
      const s = await search(query);
      url = s.id;
      info = s;
    }

    const dl = await download(url, type || 'mp3', quality || '320');
    res.status(200).json({
      success: true,
      title: info.title,
      thumbnail: info.thumbnailUrl,
      downloadUrl: dl.url,
      filename: dl.filename
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = app;