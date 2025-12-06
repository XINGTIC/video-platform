const axios = require('axios');

async function checkUrl(url) {
    try {
        const res = await axios.get(url, { 
            validateStatus: false,
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log(`[${res.status}] ${url}`);
        console.log('Content-Type:', res.headers['content-type']);
    } catch (e) {
        console.log(`[ERROR] ${url}: ${e.message}`);
    }
}

async function run() {
    const domain = 'https://zve3vyn8mbr.xszc666.com';
    
    const logo = 'image/ol/di/bg/i3/c89108632d584f718ade9d274eacc574.png';
    const cover = 'jhimage/20250928/h4/bp/58/7i/a1371ea89d2c41c9b1214d197cef4186.gif';
    const video = 'jpe/20250928/fw/ul/7u/lr/76e83c44cb514b619d74b8152576a8c7.m3u8';

    console.log('Testing Logo...');
    await checkUrl(`${domain}/${logo}`);

    console.log('\nTesting Cover...');
    await checkUrl(`${domain}/${cover}`);

    console.log('\nTesting Video...');
    await checkUrl(`${domain}/${video}`);
}

run();
