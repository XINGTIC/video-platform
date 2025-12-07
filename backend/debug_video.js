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
            // Use the same logic as frontend: hardcoded referer if H823
            const proxyUrl = `http://localhost:5000/api/proxy?url=${encodeURIComponent(video.videoUrl)}&referer=${encodeURIComponent('https://h823.sol148.com/')}`;
            console.log('Testing Proxy URL:', proxyUrl);
            
            try {
                const proxyRes = await axios.get(proxyUrl, { 
                    responseType: 'arraybuffer', // Get raw bytes
                    validateStatus: false,
                    headers: {
                        Range: 'bytes=0-100' // Get first 100 bytes
                    }
                });
                console.log('Proxy Response Status:', proxyRes.status);
                console.log('Proxy Response Headers:', proxyRes.headers);
                
                // Check content
                if (proxyRes.status === 200 || proxyRes.status === 206) {
                    const data = proxyRes.data;
                    console.log('Data length:', data.length);
                    // Print first 20 bytes as hex
                    const hex = Buffer.from(data).subarray(0, 20).toString('hex');
                    console.log('First 20 bytes (Hex):', hex);
                    // Check for MP4 magic number (ftyp => 66 74 79 70)
                    const asString = Buffer.from(data).subarray(0, 20).toString('utf8');
                    console.log('First 20 bytes (String):', asString);

                    if (asString.includes('ftyp') || hex.startsWith('000000')) {
                         console.log('SUCCESS: Valid video data detected.');
                    } else {
                         console.log('WARNING: Data does not look like typical MP4 header.');
                    }

                } else {
                    console.log('FAILURE: Proxy returned error status.');
                    console.log('Body:', proxyRes.data.toString());
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
