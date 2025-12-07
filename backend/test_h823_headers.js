const axios = require('axios');

async function testUrl() {
    const url = 'https://la.btc620.com//mp43/1155831.mp4?st=3Gj_luVZBSk-akhA7NLqNQ&e=1765074413&f=8a4f5/zm/PmqVEYTj876qbFBr1ZGICE/NgKDR9ClOEY2j/d97ykwZBZbJ9tEobaj4eFThCa5Uv8p+nNWVxyLed26DuzNUhp/U+cU';
    
    try {
        console.log('Testing without headers...');
        try {
            await axios.head(url);
            console.log('Without headers: OK (200)');
        } catch (e) {
            console.log(`Without headers: Failed (${e.response ? e.response.status : e.message})`);
        }

        console.log('\nTesting with Referer header...');
        try {
            await axios.head(url, {
                headers: {
                    'Referer': 'https://h823.sol148.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            console.log('With Referer: OK (200)');
        } catch (e) {
            console.log(`With Referer: Failed (${e.response ? e.response.status : e.message})`);
        }

    } catch (e) {
        console.error('Script Error:', e.message);
    }
}

testUrl();
