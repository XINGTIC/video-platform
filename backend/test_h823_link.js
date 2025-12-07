const axios = require('axios');

const url = 'https://la.btc620.com//mp43/1155831.mp4?st=3Gj_luVZBSk-akhA7NLqNQ&e=1765074413&f=8a4f5/zm/PmqVEYTj876qbFBr1ZGICE/NgKDR9ClOEY2j/d97ykwZBZbJ9tEobaj4eFThCa5Uv8p+nNWVxyLed26DuzNUhp/U+cU';

async function test(referer) {
    try {
        console.log(`Testing with Referer: ${referer || 'NONE'}`);
        const res = await axios.head(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': referer
            },
            validateStatus: () => true
        });
        console.log(`Status: ${res.status}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function run() {
    await test(undefined); // No Referer
    await test('https://h823.sol148.com/'); // Original Site
    await test('https://www.google.com/'); // Random Site
}

run();
