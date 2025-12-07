const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    const targetUrl = req.query.url;
    const range = req.headers.range;

    if (!targetUrl) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        // Determine Referer and Origin based on target domain
            let referer = '';
            let origin = '';
            if (targetUrl.includes('sol148.com') || targetUrl.includes('h823')) {
                referer = 'https://h823.sol148.com/';
                origin = 'https://h823.sol148.com';
            } else if (targetUrl.includes('xszc666.com') || targetUrl.includes('mg621')) {
                referer = 'https://mg621.x5t5d5a4c.work/';
                origin = 'https://mg621.x5t5d5a4c.work';
            }

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*'
            };
            if (referer) headers['Referer'] = referer;
            if (origin) headers['Origin'] = origin;
            if (range) headers['Range'] = range;

            const response = await axios({
                url: targetUrl,
                method: 'GET',
                responseType: 'stream',
                headers: headers,
                timeout: 20000 // 20s
            });

            // Forward Headers
            if (response.headers['content-range']) {
                res.status(206);
                res.setHeader('Content-Range', response.headers['content-range']);
            } else {
                res.status(200);
            }
            
            if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
            
            let contentType = response.headers['content-type'];
            // Fallback for videos/images if content-type is generic
            if (!contentType || contentType === 'application/octet-stream') {
                 if (targetUrl.includes('.mp4')) contentType = 'video/mp4';
                 else if (targetUrl.includes('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
                 else if (targetUrl.includes('.png')) contentType = 'image/png';
                 else if (targetUrl.includes('.jpg') || targetUrl.includes('.jpeg')) contentType = 'image/jpeg';
                 else if (targetUrl.includes('.gif')) contentType = 'image/gif';
            }
            if (contentType) res.setHeader('Content-Type', contentType);
            
            // Set Cache Control
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Accept-Ranges', 'bytes');
            // Allow CORS for frontend
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            response.data.pipe(res);

    } catch (e) {
        console.error(`Proxy Error for ${targetUrl}:`, e.message);
        if (e.response) {
            res.status(e.response.status).send(e.message);
        } else {
            res.status(500).send(e.message);
        }
    }
});

module.exports = router;
