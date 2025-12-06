const axios = require('axios');

async function checkImage() {
    const url = 'https://mg621.x5t5d5a4c.work/jhimage/20250928/h4/bp/58/7i/a1371ea89d2c41c9b1214d197cef4186.gif';
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Body Preview:', res.data.toString().substring(0, 200));
    } catch (e) {
        console.log('Error:', e.message);
        if (e.response) console.log('Status:', e.response.status);
    }
}

checkImage();
