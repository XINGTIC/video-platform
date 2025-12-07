const axios = require('axios');

async function check() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'xingtic',
            password: 'Xingtic.0.'
        });
        const token = loginRes.data.token;
        console.log('Logged in. Token length:', token.length);

        // 2. Get List to find an ID
        const res = await axios.get('http://localhost:5000/api/videos?page=1&limit=1');
        const videoSummary = res.data.videos[0];
        if (!videoSummary) {
            console.log('No videos found.');
            return;
        }
        console.log('Found video ID:', videoSummary._id);

        // 3. Get Details
        const detailRes = await axios.get(`http://localhost:5000/api/videos/${videoSummary._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const video = detailRes.data;
        console.log('Video URL:', video.videoUrl);
        console.log('Provider:', video.provider);

        if (video.videoUrl) {
            // 4. Test Proxy
            const proxyUrl = `http://localhost:5000/api/proxy?url=${encodeURIComponent(video.videoUrl)}&referer=${encodeURIComponent('https://h823.sol148.com/')}`;
            console.log('Testing Proxy URL:', proxyUrl);
            
            try {
                const proxyRes = await axios.get(proxyUrl, { 
                    responseType: 'stream',
                    validateStatus: false,
                    headers: {
                        Range: 'bytes=0-1024' // Try to get the first 1KB
                    }
                });
                console.log('Proxy Response Status:', proxyRes.status);
                console.log('Proxy Response Headers:', proxyRes.headers);
                
                // If 200 or 206, it works
                if (proxyRes.status === 200 || proxyRes.status === 206) {
                    console.log('SUCCESS: Video stream is accessible via proxy.');
                } else {
                    console.log('FAILURE: Proxy returned error status.');
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