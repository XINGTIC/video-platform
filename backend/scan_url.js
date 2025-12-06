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
        const contentType = res.headers['content-type'];
        const isHtml = contentType && contentType.includes('text/html');
        
        if (res.status === 200 && !isHtml) {
             console.log(`[SUCCESS] ${url} -> ${res.status} (${contentType})`);
        } else {
             console.log(`[FAIL] ${url} -> ${res.status} (${contentType})`);
        }
    } catch (e) {
        console.log(`[ERROR] ${url} -> ${e.message}`);
    }
}

async function scan() {
    const baseUrl = 'https://mg621.x5t5d5a4c.work';
    
    // 1. Test known logo path
    console.log('Testing Logo...');
    const logoPath = 'image/ol/di/bg/i3/c89108632d584f718ade9d274eacc574.png';
    await checkUrl(`${baseUrl}/${logoPath}`);

    // 2. Test jhimage path variants
    console.log('\nTesting Cover Image variants...');
    const coverPath = 'jhimage/20250928/h4/bp/58/7i/a1371ea89d2c41c9b1214d197cef4186.gif';
    const coverSuffix = '20250928/h4/bp/58/7i/a1371ea89d2c41c9b1214d197cef4186.gif';
    
    const prefixes = [
        'jhimage',
        'image',
        'img',
        'assets',
        'upload',
        'file',
        'res'
    ];

    for (const prefix of prefixes) {
        await checkUrl(`${baseUrl}/${prefix}/${coverSuffix}`);
        // Also try replacing the first part of path
        if (coverPath.startsWith(prefix + '/')) continue; 
        await checkUrl(`${baseUrl}/${prefix}/${coverSuffix}`); // This is redundant if I just use suffix
    }
    
    // Try replacing 'jhimage' with 'image' in the full path
    await checkUrl(`${baseUrl}/${coverPath.replace('jhimage', 'image')}`);

    // 3. Test jpe path variants
    console.log('\nTesting Video variants...');
    const videoPath = 'jpe/20250928/fw/ul/7u/lr/76e83c44cb514b619d74b8152576a8c7.m3u8';
    const videoSuffix = '20250928/fw/ul/7u/lr/76e83c44cb514b619d74b8152576a8c7.m3u8';

    const videoPrefixes = [
        'jpe',
        'video',
        'vod',
        'm3u8',
        'hls',
        'stream'
    ];

    for (const prefix of videoPrefixes) {
        await checkUrl(`${baseUrl}/${prefix}/${videoSuffix}`);
        await checkUrl(`${baseUrl}/${videoPath.replace('jpe', prefix)}`);
    }
}

scan();
