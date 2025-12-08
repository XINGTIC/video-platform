const axios = require('axios');

const API = 'https://video-platform-3v33.onrender.com/api';

async function test() {
    try {
        console.log('1. Testing debug endpoint...');
        const videoId = '6934fd54062f88eaecbced3b';
        
        const debug = await axios.get(API + '/videos/' + videoId + '/debug', {
            timeout: 30000,
            validateStatus: () => true
        });
        
        console.log('Debug Status:', debug.status);
        console.log('Debug Result:', JSON.stringify(debug.data, null, 2));
        
        if (debug.data.newVideoUrl) {
            console.log('\n=== SUCCESS: Got new video URL! ===');
            console.log('New URL:', debug.data.newVideoUrl.substring(0, 80) + '...');
            
            // Test the stream endpoint
            console.log('\n2. Testing stream endpoint...');
            const login = await axios.post(API + '/auth/login', {
                username: 'xingtic',
                password: 'Xingtic.0.'
            });
            const token = login.data.token;
            
            const stream = await axios.get(API + '/videos/' + videoId + '/stream?token=' + token, {
                responseType: 'arraybuffer',
                headers: { Range: 'bytes=0-1000' },
                timeout: 60000,
                validateStatus: () => true
            });
            
            console.log('Stream Status:', stream.status);
            console.log('Content-Type:', stream.headers['content-type']);
            
            if (stream.status === 200 || stream.status === 206) {
                const data = Buffer.from(stream.data);
                console.log('Data length:', data.length);
                console.log('\n=== VIDEO STREAMING WORKS! ===');
            } else {
                console.log('Stream Error:', Buffer.from(stream.data).toString());
            }
        } else {
            console.log('\n=== FAILED: Could not get new video URL ===');
            console.log('Error:', debug.data.error || 'No error message');
        }
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();

