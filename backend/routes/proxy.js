const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');
const urlModule = require('url');

router.get('/', async (req, res) => {
    const targetUrl = req.query.url;
    const range = req.headers.range;
    const customReferer = req.query.referer;

    if (!targetUrl) {
        return res.status(400).send('Missing url parameter');
    }

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

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        };
        
        if (referer) headers['Referer'] = referer;
        if (origin) headers['Origin'] = origin;
        if (range) headers['Range'] = range;

        // Check if it is m3u8 request to decide responseType
        const isM3u8 = targetUrl.includes('.m3u8');
        
        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: isM3u8 ? 'text' : 'stream',
            headers: headers,
            timeout: 0,
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        // Determine content type
        let contentType = response.headers['content-type'];
        if (!contentType || contentType === 'application/octet-stream') {
             if (targetUrl.includes('.mp4')) contentType = 'video/mp4';
             else if (targetUrl.includes('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
             else if (targetUrl.includes('.png')) contentType = 'image/png';
             else if (targetUrl.includes('.jpg') || targetUrl.includes('.jpeg')) contentType = 'image/jpeg';
             else if (targetUrl.includes('.gif')) contentType = 'image/gif';
        }
        
        // Handle m3u8 rewriting
        if (isM3u8 || (contentType && (contentType.includes('mpegurl') || contentType.includes('m3u8')))) {
            const m3u8Content = response.data;
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
            
            // Construct Proxy Base URL
            // Force HTTPS if on Render/Cloudflare or if X-Forwarded-Proto is https
            let protocol = req.protocol;
            if (req.get('host').includes('render') || req.headers['x-forwarded-proto'] === 'https') {
                protocol = 'https';
            }
            const proxyBaseUrl = `${protocol}://${req.get('host')}${req.baseUrl}?url=`;
            
            // Function to encode URL properly
            const encodeProxyUrl = (sourceUrl) => {
                // Resolve relative URLs
                const absoluteUrl = urlModule.resolve(baseUrl, sourceUrl);
                return `${proxyBaseUrl}${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
            };

            // Replace TS and Key URLs
            // Logic: look for lines not starting with #, these are file paths
            const lines = m3u8Content.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;
                if (trimmed.startsWith('#')) {
                    // Check for URI="..." in #EXT-X-KEY
                    if (trimmed.startsWith('#EXT-X-KEY')) {
                        return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
                            return `URI="${encodeProxyUrl(uri)}"`;
                        });
                    }
                    return line;
                }
                // It's a file path (ts segment)
                return encodeProxyUrl(trimmed);
            });

            const finalM3u8 = rewrittenLines.join('\n');
            
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=60'); // Short cache for m3u8
            res.send(finalM3u8);
            return;
        }

        // Standard stream handling for non-m3u8
        if (response.headers['content-range']) {
            res.status(206);
            res.setHeader('Content-Range', response.headers['content-range']);
        } else {
            res.status(200);
        }
        
        if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
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
