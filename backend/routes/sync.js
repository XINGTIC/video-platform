const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const Video = require('../models/Video');

// Trigger Sync
router.post('/run', async (req, res) => {
  const { targetUrl } = req.body;
  
  if (!targetUrl) return res.status(400).json({ message: '需要目标网址' });

  try {
    // 1. Fetch the page
    const response = await axios.get(targetUrl);
    const $ = cheerio.load(response.data);
    
    const importedVideos = [];

    // 2. Parse logic (Generic example - User needs to adjust selectors)
    // Searching for common video patterns
    // 提示：你需要根据你目标网站的具体 HTML 结构修改这里的抓取逻辑
    // TIP: You need to adjust the scraping logic below based on your target site's HTML structure
    
    $('a').each((i, el) => {
      const link = $(el).attr('href');
      const title = $(el).attr('title') || $(el).find('.title').text() || $(el).text().trim();
      const img = $(el).find('img').attr('src');
      
      // Attempt to find tags (generic guess)
      const tags = [];
      $(el).closest('.video-card, .item').find('.tags a, .category').each((j, tagEl) => {
        tags.push($(tagEl).text().trim());
      });

      // Very basic heuristic
      if (link && (link.includes('video') || link.includes('watch') || link.includes('.mp4') || link.includes('.m3u8'))) {
        const fullLink = link.startsWith('http') ? link : new URL(link, targetUrl).href;
        const fullImg = img ? (img.startsWith('http') ? img : new URL(img, targetUrl).href) : null;

        importedVideos.push({
          title: title || '未命名视频',
          videoUrl: fullLink,
          thumbnailUrl: fullImg,
          sourceUrl: targetUrl,
          tags: tags // Add scraped tags
        });
      }
    });

    // 3. Save to DB (Avoid duplicates)
    let savedCount = 0;
    for (const v of importedVideos) {
      const exists = await Video.findOne({ videoUrl: v.videoUrl });
      if (!exists) {
        await new Video(v).save();
        savedCount++;
      }
    }

    res.json({ message: `同步完成。发现 ${importedVideos.length} 个，已保存 ${savedCount} 个` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '同步失败：' + error.message });
  }
});

module.exports = router;
