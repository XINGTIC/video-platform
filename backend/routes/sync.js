const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const Video = require('../models/Video');
const CryptoJS = require('crypto-js');

// --- MG621 Helpers ---
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

function decryptResponse(encData, token) {
    if (!token) throw new Error("Token is missing for decryption");
    const keyStr = token.slice(2, 18);
    const key = CryptoJS.enc.Utf8.parse(keyStr);
    const iv = CryptoJS.enc.Utf8.parse(keyStr);
    
    const decrypted = CryptoJS.AES.decrypt(encData, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    try {
        return JSON.parse(decryptedStr);
    } catch (e) {
        console.error("Failed to parse decrypted JSON:", decryptedStr);
        return null;
    }
}

// --- Sync Functions ---

async function syncMg621(limit = 10) {
    console.log(`[Sync-MG621] Starting sync (Limit: ${limit})...`);
    const baseURL = 'https://mg621.x5t5d5a4c.work/api';
    
    try {
        const deviceId = generateDeviceId();
        let savedCount = 0;
        console.log(`[Sync-MG621] Device ID: ${deviceId}`);

        // 1. Get Key
        console.log('[Sync-MG621] Step 1: Get Key');
        const keyUrl = '/user/v1/key';
        const keyRes = await axios.get(baseURL + keyUrl, { headers: getMgHeaders(keyUrl, deviceId) });
        const apiKey = keyRes.data.data.key;
        console.log('[Sync-MG621] Got API Key');

        // 2. Traveler Token
        console.log('[Sync-MG621] Step 2: Traveler Token');
        const travelerUrl = '/user/v1/traveler';
        const travelerPayload = encryptPayload({ deviceId: deviceId }, apiKey);
        const travelerRes = await axios.post(baseURL + travelerUrl, travelerPayload, { headers: getMgHeaders(travelerUrl, deviceId) });
        
        const token = travelerRes.data.data.accessToken;
        const decryptionToken = travelerRes.data.data.token || token;
        let imgDomain = travelerRes.data.data.imgDomain;
        if (imgDomain && !imgDomain.endsWith('/')) imgDomain += '/';

        // 3. Fetch Classify List to get a valid ID
        console.log('[Sync-MG621] Step 3: Fetch Classify List');
        const classifyUrl = '/video/classify/classifyList';
        const classifyHeaders = getMgHeaders(classifyUrl, deviceId);
        classifyHeaders['accAut'] = `Bearer ${token}`;
        
        const classifyRes = await axios.get(baseURL + classifyUrl, { headers: classifyHeaders });
        let classifyList = [];
        
        if (classifyRes.data.encData) {
            const d = decryptResponse(classifyRes.data.encData, decryptionToken);
            if (d && d.data) classifyList = d.data;
        }

        console.log(`[Sync-MG621] Found ${classifyList.length} classifications.`);
        
        let videos = [];
        if (classifyList.length > 0) {
            // Use the first classification ID
            const firstClass = classifyList[0];
            const classId = firstClass.id || firstClass.classifyId;
            console.log(`[Sync-MG621] Using Classify ID: ${classId} (${firstClass.name || 'Unknown'})`);
            
            const listUrl = '/video/new/queryVideoByClassify';
            const listHeaders = getMgHeaders(listUrl, deviceId);
            listHeaders['accAut'] = `Bearer ${token}`;
            
            const listRes = await axios.get(baseURL + listUrl, { 
                headers: listHeaders,
                params: { classifyId: classId, page: 1, pageSize: limit }
            });
            
            if (listRes.data.encData) {
                const d = decryptResponse(listRes.data.encData, decryptionToken);
                if (d && d.data) {
                    if (Array.isArray(d.data)) {
                        videos = d.data;
                    } else if (d.data.list) {
                        videos = d.data.list;
                    }
                }
            }
        } else {
            console.warn('[Sync-MG621] No classifications found. Cannot fetch videos.');
        }

        console.log(`[Sync-MG621] Found ${videos.length} videos.`);

        for (const v of videos) {
            if (savedCount >= limit) break;
            
            if (!v.videoUrl) {
                 v.videoUrl = v.playUrl || v.m3u8Url || v.url; 
                 if (!v.videoUrl) continue;
            }

            const exists = await Video.findOne({ 
                $or: [{ title: v.title }, { videoUrl: { $regex: v.videoUrl.split('/').pop() } }] 
            });

            if (!exists) {
                const fullVideoUrl = v.videoUrl.startsWith('http') ? v.videoUrl : imgDomain + v.videoUrl;
                let fullCoverUrl = null;
                if (v.coverImg) {
                     const imgPath = Array.isArray(v.coverImg) ? v.coverImg[0] : v.coverImg;
                     fullCoverUrl = imgPath.startsWith('http') ? imgPath : imgDomain + imgPath;
                }

                let tagList = v.tagTitles || [];
                
                await new Video({
                    title: v.title,
                    description: v.subtitle || v.title,
                    videoUrl: fullVideoUrl,
                    thumbnailUrl: fullCoverUrl,
                    duration: v.playTime,
                    sourceUrl: 'https://mg621.x5t5d5a4c.work',
                    tags: tagList,
                    views: v.fakeWatchNum || 0
                }).save();
                console.log(`[Sync-MG621] Saved: ${v.title}`);
                savedCount++;
            }
        }
        return savedCount;
    } catch (e) {
        console.error('[Sync-MG621] Error:', e.message);
        return 0;
    }
}

async function syncH823(limit = 10) {
    console.log(`[Sync-H823] Starting sync (Limit: ${limit})...`);
    const baseURL = 'https://h823.sol148.com';
    let savedCount = 0;
    
    try {
        // 1. Fetch Index
        const res = await axios.get(baseURL + '/index.php', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(res.data);
        
        const videoLinks = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('view_video.php?viewkey=')) {
                if (!videoLinks.includes(href)) {
                    videoLinks.push(href.startsWith('http') ? href : baseURL + '/' + href);
                }
            }
        });
        
        console.log(`[Sync-H823] Found ${videoLinks.length} video links.`);
        
        for (const link of videoLinks) {
            if (savedCount >= limit) break;
            
            try {
                // 2. Fetch Video Page
                const vRes = await axios.get(link, {
                     headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
                });
                const $v = cheerio.load(vRes.data);
                const title = $v('title').text().trim();
                
                // Check duplicate
                const exists = await Video.findOne({ title: title });
                if (exists) continue;

                // 3. Extract Video URL
                const html = $v('video').parent().html() || '';
                const match = html.match(/strencode2\("([^"]+)"\)/);
                
                let videoUrl = null;
                if (match) {
                    const decoded = decodeURIComponent(match[1]);
                    const srcMatch = decoded.match(/src='([^']+)'/);
                    if (srcMatch) videoUrl = srcMatch[1];
                }
                
                // Fallback: look for direct source
                if (!videoUrl) {
                    videoUrl = $v('source').attr('src') || $v('video').attr('src');
                }

                if (videoUrl) {
                    const poster = $v('video').attr('poster');
                    
                    await new Video({
                        title: title,
                        description: title,
                        videoUrl: videoUrl,
                        thumbnailUrl: poster,
                        sourceUrl: link,
                        tags: ['Imported', 'H823'], // Default tags
                        views: 0
                    }).save();
                    console.log(`[Sync-H823] Saved: ${title}`);
                    savedCount++;
                }

            } catch (vErr) {
                console.error(`[Sync-H823] Error processing ${link}:`, vErr.message);
            }
        }
        return savedCount;
    } catch (e) {
        console.error('[Sync-H823] Error:', e.message);
        return 0;
    }
}

// Route
router.post('/run', async (req, res) => {
    const limit = req.body.limit || 10;
    
    try {
        const count1 = await syncMg621(limit);
        const count2 = await syncH823(limit);
        
        res.json({
            message: 'Sync completed',
            mg621_saved: count1,
            h823_saved: count2,
            total_saved: count1 + count2
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
