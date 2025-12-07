require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Video = require('./models/Video');

// MongoDB Connection
const MONGO_URI = 'mongodb+srv://appuser:appuser123@cluster0.rlv7zxw.mongodb.net/videoplatform?retryWrites=true&w=majority';

async function checkUrl(url, type) {
    if (!url) return { status: 'MISSING', code: 0 };
    try {
        const res = await axios.head(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'no-referrer' // Mimic frontend
            },
            timeout: 5000,
            validateStatus: () => true
        });
        return { status: res.status === 200 ? 'OK' : 'FAIL', code: res.status };
    } catch (e) {
        // HEAD might fail on some servers, try GET with range
        try {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Range': 'bytes=0-100', // Request just first 100 bytes
                    'Referer': 'no-referrer'
                },
                timeout: 5000,
                validateStatus: () => true
            });
            return { status: (res.status === 200 || res.status === 206) ? 'OK' : 'FAIL', code: res.status };
        } catch (e2) {
            return { status: 'ERROR', code: e2.message };
        }
    }
}

async function validate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const videos = await Video.find({});
        console.log(`Found ${videos.length} videos. Checking URLs...`);

        let stats = {
            mg621: { total: 0, thumbOk: 0, videoOk: 0 },
            h823: { total: 0, thumbOk: 0, videoOk: 0 }
        };

        for (const v of videos) {
            const provider = v.provider || (v.sourceUrl && v.sourceUrl.includes('mg621') ? 'MG621' : 'H823');
            
            if (provider === 'MG621') stats.mg621.total++;
            else stats.h823.total++;

            console.log(`Checking [${provider}] ${v.title.substring(0, 20)}...`);
            
            // Check Thumbnail
            const thumbRes = await checkUrl(v.thumbnailUrl, 'thumb');
            if (thumbRes.status === 'OK') {
                if (provider === 'MG621') stats.mg621.thumbOk++;
                else stats.h823.thumbOk++;
            } else {
                console.log(`  [X] Thumbnail Broken: ${v.thumbnailUrl} (${thumbRes.code})`);
            }

            // Check Video
            const videoRes = await checkUrl(v.videoUrl, 'video');
            if (videoRes.status === 'OK') {
                if (provider === 'MG621') stats.mg621.videoOk++;
                else stats.h823.videoOk++;
            } else {
                console.log(`  [X] Video Broken: ${v.videoUrl} (${videoRes.code})`);
            }
        }

        console.log('\n--- Summary ---');
        console.log('MG621:', stats.mg621);
        console.log('H823: ', stats.h823);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

validate();
