const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const https = require('https');
const { getH823VideoUrl } = require('./sync');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// Middleware to extract user (optional)
const getUser = (req, res, next) => {
  // 支持从 header 或 query 参数获取 token
  let token = req.headers.authorization?.split(' ')[1];
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      console.log('[Auth] Token verification failed:', e.message);
    }
  }
  next();
};

// List Videos with Search, Sort, and Pagination
router.get('/', async (req, res) => {
  try {
    const { q, sort, page = 1, limit = 20 } = req.query;
    let query = {};
    
    // Search Filter
    if (q) {
      query = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      };
    }

    // Sort Logic
    let sortOption = { createdAt: -1 }; // Default: Newest
    if (sort === 'popular') {
      sortOption = { views: -1 };
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Fetch videos with projection to reduce payload size
    const videos = await Video.find(query)
      .select('title thumbnailUrl duration views createdAt tags isMemberOnly') 
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
      
    const total = await Video.countDocuments(query);

    res.json({
      videos,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalVideos: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Video (with Limit Logic)
router.get('/:id', getUser, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: '视频未找到' });

    // Refresh H823 Link
    if ((video.provider === 'H823' || (video.tags && video.tags.includes('H823'))) && video.sourceUrl) {
        try {
            const newUrl = await getH823VideoUrl(video.sourceUrl);
            if (newUrl && newUrl !== video.videoUrl) {
                video.videoUrl = newUrl;
                await video.save();
                console.log(`[Video] Refreshed URL for ${video.title}`);
            }
        } catch (e) {
            console.error(`[Video] Failed to refresh URL for ${video.title}: ${e.message}`);
        }
    }

    // If user is not logged in, assume they are a guest (non-member)
    // Implementation choice: Should guests watch 1 video? Or must register?
    // Prompt says "User registered ... non-member 1 video".
    // So we assume user MUST be logged in to watch even the free one.
    
    if (!req.user) {
      return res.status(401).json({ message: '请登录观看' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: '用户不存在或会话已过期，请重新登录' });
    }
    
    if (!user.isMember && !user.isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      
      if (user.dailyWatch.date !== today) {
        // Reset for new day
        user.dailyWatch = { date: today, count: 0 };
      }

      if (user.dailyWatch.count >= 1) {
        return res.status(403).json({ message: '今日观看限额已用完，请升级会员。' });
      }

      // Increment count
      user.dailyWatch.count += 1;
      await user.save();
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Video (Metadata)
router.post('/', getUser, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: '未授权' });
  try {
    const video = new Video({
      ...req.body,
      uploader: req.user.id
    });
    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 实时流式代理 - 获取最新URL并直接转发视频流
router.get('/:id/stream', getUser, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: '视频未找到' });

    // 验证用户权限
    if (!req.user) {
      return res.status(401).json({ message: '请登录观看' });
    }

    let videoUrl = null;
    let referer = 'https://h823.sol148.com/';

    // 总是实时获取最新的视频 URL（因为旧 URL 可能已过期）
    if ((video.provider === 'H823' || (video.tags && video.tags.includes('H823'))) && video.sourceUrl) {
      try {
        console.log('[Stream] Fetching fresh URL from:', video.sourceUrl);
        videoUrl = await getH823VideoUrl(video.sourceUrl);
        if (videoUrl) {
          console.log('[Stream] Got fresh URL:', videoUrl.substring(0, 80) + '...');
          // 更新数据库
          video.videoUrl = videoUrl;
          await video.save();
        } else {
          console.error('[Stream] getH823VideoUrl returned null');
        }
      } catch (e) {
        console.error('[Stream] Failed to get fresh URL:', e.message);
      }
    }

    // 如果无法获取新 URL，使用数据库中的旧 URL
    if (!videoUrl) {
      videoUrl = video.videoUrl;
      console.log('[Stream] Using stored URL:', videoUrl ? videoUrl.substring(0, 80) + '...' : 'null');
    }

    if (!videoUrl) {
      return res.status(404).json({ message: '视频URL不可用' });
    }

    console.log('[Stream] Starting stream for:', video.title);

    // 设置请求头
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': referer,
      'Origin': 'https://h823.sol148.com',
    };

    // 处理 Range 请求
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
      console.log('[Stream] Range request:', req.headers.range);
    }

    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream',
      headers: headers,
      timeout: 60000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    console.log('[Stream] Got response:', response.status, response.headers['content-type']);

    // 设置响应头
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-range']) {
      res.status(206);
      res.setHeader('Content-Range', response.headers['content-range']);
    }

    // 流式转发
    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('[Stream] Pipe error:', err.message);
      res.end();
    });

  } catch (error) {
    console.error('[Stream] Request failed:', error.message);
    if (error.response) {
      console.error('[Stream] Response status:', error.response.status);
      console.error('[Stream] Response headers:', JSON.stringify(error.response.headers));
    }
    res.status(500).json({ error: '视频流获取失败: ' + error.message });
  }
});

// 调试端点 - 测试从源网站获取视频URL
router.get('/:id/debug', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: '视频未找到' });

    const result = {
      videoId: video._id,
      title: video.title,
      provider: video.provider,
      sourceUrl: video.sourceUrl,
      storedVideoUrl: video.videoUrl,
      newVideoUrl: null,
      error: null
    };

    if (video.sourceUrl) {
      try {
        console.log('[Debug] Fetching URL from:', video.sourceUrl);
        const newUrl = await getH823VideoUrl(video.sourceUrl);
        result.newVideoUrl = newUrl;
        console.log('[Debug] Got URL:', newUrl ? newUrl.substring(0, 80) + '...' : 'null');
      } catch (e) {
        result.error = e.message;
        console.error('[Debug] Error:', e.message);
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
