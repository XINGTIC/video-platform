require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Video = require('./models/Video');
const CryptoJS = require('crypto-js');

// Helper functions from sync.js/test_real_api.js
function generateDeviceId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getMgHeaders(url, deviceId) {
    const t = Date.now().toString();
    const c = t.slice(3, 8);
    const s = CryptoJS.SHA1(c).toString();
    
    const headers = {
        't': t,
        's': s,
        'User-Mark': 'xhp',
        'deviceId': deviceId,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://mg621.x5t5d5a4c.work/',
        'Origin': 'https://mg621.x5t5d5a4c.work',
        'Content-Type': 'application/json'
    };
    
    const whitelist = ["user/v1/key", "user/v1/refresh", "user/v1/traveler"];
    const isWhitelisted = whitelist.some(path => url.includes(path));
    
    if (!isWhitelisted) {
        headers['X-Nonce'] = (Math.floor(Math.random()*9e5)+1e5).toString();
    }
    
    return headers;
}

function encryptPayload(data, key) {
    if (!key) throw new Error("Key is missing");
    const keyParsed = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), keyParsed, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return {
        encryptedData: encrypted.toString(),
        key: key
    };
}

// Connect to DB
const MONGO_URI = 'mongodb+srv://appuser:appuser123@cluster0.rlv7zxw.mongodb.net/videoplatform?retryWrites=true&w=majority';

async function fixDomains() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB Connected');

        // 1. Get current valid domain
        console.log('Fetching current imgDomain...');
        const baseURL = 'https://mg621.x5t5d5a4c.work/api';
        const deviceId = generateDeviceId();
        
        // Get Key
        const keyUrl = '/user/v1/key';
        const keyRes = await axios.get(baseURL + keyUrl, { headers: getMgHeaders(keyUrl, deviceId) });
        const apiKey = keyRes.data.data.key;
        
        // Get Traveler Token
        const travelerUrl = '/user/v1/traveler';
        const travelerPayload = encryptPayload({ deviceId: deviceId }, apiKey);
        const travelerRes = await axios.post(baseURL + travelerUrl, travelerPayload, { headers: getMgHeaders(travelerUrl, deviceId) });
        
        let newDomain = travelerRes.data.data.imgDomain;
        if (newDomain && !newDomain.endsWith('/')) newDomain += '/';
        
        console.log('Current Valid Domain:', newDomain);

        if (!newDomain) {
            console.error('Failed to get new domain');
            return;
        }

        // 2. Update Videos
        const videos = await Video.find({ provider: 'MG621' });
        // Fallback for older syncs that might lack 'provider' field but have the old domain
        const allVideos = await Video.find();
        
        let updatedCount = 0;

        for (const v of allVideos) {
            let needsSave = false;
            
            // Check Thumbnail
            if (v.thumbnailUrl && v.thumbnailUrl.includes('/jhimage/')) {
                const parts = v.thumbnailUrl.split('/jhimage/');
                const currentDomain = parts[0] + '/';
                const path = 'jhimage/' + parts[1];
                
                if (currentDomain !== newDomain) {
                    v.thumbnailUrl = newDomain + path;
                    needsSave = true;
                }
            }

            // Check Video URL
            if (v.videoUrl && v.videoUrl.includes('/jpe/')) {
                const parts = v.videoUrl.split('/jpe/');
                const currentDomain = parts[0] + '/';
                const path = 'jpe/' + parts[1];
                
                if (currentDomain !== newDomain) {
                    v.videoUrl = newDomain + path;
                    needsSave = true;
                }
            }
            
            // Ensure provider is set
            if ((v.thumbnailUrl && v.thumbnailUrl.includes('jhimage')) || (v.videoUrl && v.videoUrl.includes('jpe'))) {
                if (v.provider !== 'MG621') {
                    v.provider = 'MG621';
                    needsSave = true;
                }
            }

            if (needsSave) {
                await v.save();
                updatedCount++;
                console.log(`Updated video: ${v.title}`);
            }
        }
        
        console.log(`Finished! Updated ${updatedCount} videos.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

fixDomains();
