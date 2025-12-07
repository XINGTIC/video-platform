const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');

router.get('/', async (req, res) => {
    const targetUrl = req.query.url;
    const range = req.headers.range;
    const customReferer = req.query.referer;

    if (!targetUrl) {
        return res.status(400).send('Missing url parameter');
    }

    // console.log(`[Proxy] Requesting: ${targetUrl}`);
    
    try {
        let referer = '';
        let origin = '';
        
        if (targetUrl.includes('sol148.com') || targetUrl.includes('h823') || targetUrl.includes('btc620.com')) {
            referer = 'https://h823.sol148.com/';
            origin = 'https://h823.sol148.com';
        } else if (targetUrl.includes('xszc666.com') || targetUrl.includes('mg621')) {
            referer = 'https://mg621.x5t5d5a4c.work/';
            origin = 'https://mg621.x5t5d5a4c.work';
        } else if (customReferer) {
             referer = customReferer;
             try {
                 const refUrl = new URL(referer);
                 origin = refUrl.origin;
             } catch (e) {}
        }

        const randomIP = `114.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
            'X-Forwarded-For': randomIP,
            'Client-IP': randomIP
        };
        
        if (referer) headers['Referer'] = referer;
        if (origin) headers['Origin'] = origin;
        if (range) headers['Range'] = range;

        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream',
            headers: headers,
            timeout: 0,
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
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
        if (!contentType || contentType === 'application/octet-stream') {
             if (targetUrl.includes('.mp4')) contentType = 'video/mp4';
             else if (targetUrl.includes('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
             else if (targetUrl.includes('.png')) contentType = 'image/png';
             else if (targetUrl.includes('.jpg') || targetUrl.includes('.jpeg')) contentType = 'image/jpeg';
             else if (targetUrl.includes('.gif')) contentType = 'image/gif';
        }
        if (contentType) res.setHeader('Content-Type', contentType);
        
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        
        response.data.pipe(res);

        response.data.on('error', (err) => {
            console.error('[Proxy] Stream Error:', err.message);
            res.end();
        });
    } catch (err) {
        console.error('[Proxy] Request Error:', err.message);
        res.status(500).send('Proxy request failed');
    }
});

module.exports = router;
