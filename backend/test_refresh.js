require('dotenv').config();
const mongoose = require('mongoose');
const { getH823VideoUrl } = require('./routes/sync');
const Video = require('./models/Video');
const axios = require('axios');

const MONGO_URI = 'mongodb+srv://appuser:appuser123@cluster0.rlv7zxw.mongodb.net/videoplatform?retryWrites=true&w=majority';

async function testRefresh() {
    try {
        await mongoose.connect(MONGO_URI);
        
        // Find H823 video by tag or sourceUrl or provider
        const video = await Video.findOne({ 
            $or: [
                { provider: 'H823' },
                { tags: 'H823' },
                { sourceUrl: { $regex: 'h823' } }
            ]
        });

        if (!video) {
            console.log('No H823 video found');
            return;
        }

        console.log(`Testing Refresh for: ${video.title}`);
        console.log(`Provider: ${video.provider}`);
        console.log(`Tags: ${video.tags}`);
        console.log(`Old URL: ${video.videoUrl}`);
        console.log(`Source URL: ${video.sourceUrl}`);

        const newUrl = await getH823VideoUrl(video.sourceUrl);
        console.log(`New URL: ${newUrl}`);

        if (newUrl) {
            console.log('Testing New URL accessibility...');
            try {
                const res = await axios.head(newUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'no-referrer'
                    }
                });
                console.log(`Status: ${res.status}`);
            } catch (e) {
                console.log(`Error: ${e.message}`);
                if (e.response) console.log(`Response Code: ${e.response.status}`);
            }
        } else {
            console.log('Failed to get new URL');
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

testRefresh();
