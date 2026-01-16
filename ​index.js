const express = require('express');
const axios = require('axios');
const app = express();

const videoquality = ['1080', '720', '480', '360', '240', '144'];
const audiobitrate = ['128', '320'];

async function search(q) {
  try {
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
  } catch (e) {
    throw new Error('Search failed: ' + e.message);
  }
}

async function download(url, type, quality) {
  const payload = type === 'mp4' 
    ? { url, downloadMode: 'video', brandName: 'ytmp3.gg', videoQuality: String(quality), youtubeVideoContainer: 'mp4' }
    : { url, downloadMode: 'audio', brandName: 'ytmp3.gg', audioFormat: 'mp3', audioBitrate: String(quality) };

  try {
    const r = await axios.post('https://hub.y2mp3.co', payload, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        'content-type': 'application/json',
        origin: 'https://ytmp3.gg',
        referer: 'https://ytmp3.gg/'
      }
    });
    return r.data;
  } catch (e) {
    throw new Error('Download API failed: ' + e.message);
  }
}

// ہوم روٹ (تاکہ مین لنک اوپن کرنے پر 404 نہ آئے)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: "Success", 
    message: "YTDL API is active",
    usage: "/api/download?query=YOUR_SEARCH_OR_URL" 
  });
});

// ڈاؤن لوڈ روٹ
app.get('/api/download', async (req, res) => {
  const { query, type, quality } = req.query;
  
  if (!query) return res.status(400).json({ success: false, error: "Query parameter is required" });

  try {
    let url = query;
    let info = { title: "Unknown", thumbnailUrl: "" };

    // اگر ان پٹ لنک نہیں ہے تو سرچ کریں
    if (!/^https?:\/\//i.test(query)) {
      const searchResult = await search(query);
      url = searchResult.id;
      info = searchResult;
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

// ورسل کے لیے سرور لسننگ اور ایکسپورٹ
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Local server started on port ${PORT}`);
  });
}

module.exports = app;