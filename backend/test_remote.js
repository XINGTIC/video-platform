const axios = require('axios');

const API_URL = 'https://video-platform-3v33.onrender.com/api';

async function check() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'xingtic',
            password: 'Xingtic.0.'
        });
        const token = loginRes.data.token;
        console.log('Logged in. Token length:', token.length);

        // 2. Get List to find an ID
        const res = await axios.get(`${API_URL}/videos?page=1&limit=1`);
        const videoSummary = res.data.videos[0];
        if (!videoSummary) {
            console.log('No videos found.');
            return;
        }
        console.log('Found video ID:', videoSummary._id);
        console.log('Video title:', videoSummary.title);

        // 3. Get Details
        const detailRes = await axios.get(`${API_URL}/videos/${videoSummary._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const video = detailRes.data;
        console.log('Video URL:', video.videoUrl);
        console.log('Source URL:', video.sourceUrl);
        console.log('Provider:', video.provider);
        console.log('Tags:', video.tags);

        if (video.videoUrl) {
            // 4. Test Proxy
            const proxyUrl = `${API_URL}/proxy?url=${encodeURIComponent(video.videoUrl)}&referer=${encodeURIComponent('https://h823.sol148.com/')}`;
            console.log('\nTesting Proxy URL:', proxyUrl);
            
            try {
                const proxyRes = await axios.get(proxyUrl, { 
                    responseType: 'arraybuffer',
                    validateStatus: false,
                    timeout: 30000
                });
                console.log('Proxy Response Status:', proxyRes.status);
                console.log('Content-Type:', proxyRes.headers['content-type']);
                console.log('Content-Length:', proxyRes.headers['content-length']);
                
                if (proxyRes.status === 200 || proxyRes.status === 206) {
                    const data = proxyRes.data;
                    console.log('Data length:', data.length);
                    const asString = Buffer.from(data).subarray(0, 100).toString('utf8');
                    console.log('First 100 bytes:', asString.substring(0, 100));
                    
                    if (asString.includes('#EXTM3U')) {
                        console.log('\nSUCCESS: Valid M3U8 playlist detected!');
                    } else if (asString.includes('ftyp')) {
                        console.log('\nSUCCESS: Valid MP4 data detected!');
                    } else {
                        console.log('\nWARNING: Unknown format');
                    }
                } else {
                    console.log('FAILURE: Proxy returned error');
                    console.log('Body:', Buffer.from(proxyRes.data).toString());
                }
            } catch (err) {
                console.error('Proxy Request Failed:', err.message);
            }
        }
    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}

check();

