const axios = require('axios');

async function checkRemote() {
    try {
        console.log('Testing connection to https://video-platform-3v33.onrender.com/api/videos ...');
        const res = await axios.get('https://video-platform-3v33.onrender.com/api/videos');
        console.log('Success:', res.data);
    } catch (e) {
        console.error('Status:', e.response?.status);
        console.error('Data:', JSON.stringify(e.response?.data, null, 2));
    }
}

checkRemote();
