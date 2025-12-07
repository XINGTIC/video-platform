const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    const videoUrl = req.query.url;
    const range = req.headers.range;

    if (!videoUrl) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://h823.sol148.com/',
            'Accept': '*/*'
        };
        if (range) headers['Range'] = range;

        const response = await axios({
            url: videoUrl,
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
        if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
        
        res.setHeader('Accept-Ranges', 'bytes');
        
        response.data.pipe(res);

    } catch (e) {
        console.error('Proxy Error:', e.message);
        if (e.response) {
            res.status(e.response.status).send(e.message);
        } else {
            res.status(500).send(e.message);
        }
    }
});

module.exports = router;
