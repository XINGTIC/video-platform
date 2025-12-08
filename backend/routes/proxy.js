const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');
const urlModule = require('url');

// 处理 OPTIONS 预检请求
router.options('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept, Accept-Encoding');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
});

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
        
        if (customReferer) {
             referer = customReferer;
             try {
                 const refUrl = new URL(referer);
                 origin = refUrl.origin;
             } catch (e) {}
        } else if (targetUrl.includes('sol148.com') || targetUrl.includes('h823') || targetUrl.includes('btc620.com')) {
            referer = 'https://h823.sol148.com/';
            origin = 'https://h823.sol148.com';
        } else if (targetUrl.includes('xszc666.com') || targetUrl.includes('mg621')) {
            referer = 'https://mg621.x5t5d5a4c.work/';
            origin = 'https://mg621.x5t5d5a4c.work';
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        };
        
        if (referer) headers['Referer'] = referer;
        if (origin) headers['Origin'] = origin;
        
        // Remove Range for m3u8 to avoid partial content issues
        const isM3u8Like = targetUrl.includes('.m3u8') || targetUrl.includes('mpegurl');
        if (range && !isM3u8Like) {
            headers['Range'] = range;
        }

        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream', // Always stream initially
            headers: headers,
            timeout: 30000, // Increased timeout
            maxRedirects: 5,
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        // Determine content type
        let contentType = response.headers['content-type'];
        if (!contentType || contentType === 'application/octet-stream') {
             if (targetUrl.includes('.mp4')) contentType = 'video/mp4';
             else if (targetUrl.includes('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
             else if (targetUrl.includes('.ts')) contentType = 'video/mp2t';
             else if (targetUrl.includes('.png')) contentType = 'image/png';
             else if (targetUrl.includes('.jpg') || targetUrl.includes('.jpeg')) contentType = 'image/jpeg';
             else if (targetUrl.includes('.gif')) contentType = 'image/gif';
             else if (targetUrl.includes('.key')) contentType = 'application/octet-stream';
        }
        
        // 检测是否是 ts 分片文件
        const isTsFile = targetUrl.includes('.ts') || (contentType && contentType.includes('video/mp2t'));
        
        // Handle m3u8 rewriting
        if (isM3u8Like || (contentType && (contentType.includes('mpegurl') || contentType.includes('m3u8')))) {
            // Convert stream to string
            const chunks = [];
            for await (const chunk of response.data) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            const m3u8Content = buffer.toString('utf8');

            // Handle Redirects for Base URL
            // response.request.res.responseUrl works in Node environment with Axios
            let finalUrl = targetUrl;
            if (response.request && response.request.res && response.request.res.responseUrl) {
                finalUrl = response.request.res.responseUrl;
            }
            const baseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);
            
            // Construct Proxy Base URL
            let protocol = req.protocol;
            if (req.get('host').includes('render') || req.headers['x-forwarded-proto'] === 'https') {
                protocol = 'https';
            }
            const proxyBaseUrl = `${protocol}://${req.get('host')}${req.baseUrl}?url=`;
            
            const encodeProxyUrl = (sourceUrl) => {
                if (!sourceUrl) return '';
                const absoluteUrl = urlModule.resolve(baseUrl, sourceUrl);
                return `${proxyBaseUrl}${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
            };

            const lines = m3u8Content.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;
                if (trimmed.startsWith('#')) {
                    if (trimmed.startsWith('#EXT-X-KEY')) {
                        return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
                            return `URI="${encodeProxyUrl(uri)}"`;
                        });
                    }
                    return line;
                }
                return encodeProxyUrl(trimmed);
            });

            const finalM3u8 = rewrittenLines.join('\n');
            
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=60');
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
        
        // 设置缓存时间：ts 分片较短，m3u8 更短
        if (isTsFile) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        
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
