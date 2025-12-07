const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getH823VideoUrl } = require('./sync');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// Middleware to extract user (optional)
const getUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {}
  }
  next();
};

// List Videos with Search and Sort
router.get('/', async (req, res) => {
  try {
    const { q, sort } = req.query;
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

    const videos = await Video.find(query).sort(sortOption).limit(50);
    res.json(videos);
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
    
    if (!user.isMember) {
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

module.exports = router;
