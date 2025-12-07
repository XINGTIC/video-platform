const axios = require('axios');

async function testRemoteProxy() {
    const videoUrl = 'https://la.btc620.com//mp43/1155831.mp4?st=OGJ9Fov7w81i2pyTNyDEwA&e=1765078541&f=31d5oKQD+skmpXc7MLurtFOLYYbDsOvrZjxRWlMc0m2CkErAYIE8CKGwgNWGG6EVqQ+eqI2Hb0IBlESP+iPRuRnrY2M5FdFUM9aG';
    const proxyBase = 'https://video-platform-3v33.onrender.com/api/proxy';
    
    const targetUrl = `${proxyBase}?url=${encodeURIComponent(videoUrl)}`;
    
    console.log(`Testing Remote Proxy: ${targetUrl}`);
    
    try {
        const res = await axios.get(targetUrl, {
            headers: {
                'Range': 'bytes=0-100'
            },
            responseType: 'arraybuffer' // Just get raw bytes
        });
        
        console.log(`Status: ${res.status}`);
        console.log(`Headers:`, res.headers);
        console.log(`Data Length: ${res.data.length}`);
        
        if (res.status === 200 || res.status === 206) {
            console.log('Proxy test SUCCESS!');
        } else {
            console.log('Proxy test FAILED (Unexpected Status)');
        }
        
    } catch (e) {
        console.error('Proxy test FAILED:', e.message);
        if (e.response) {
            console.error('Response Status:', e.response.status);
            console.error('Response Data:', e.response.data.toString());
        }
    }
}

testRemoteProxy();
