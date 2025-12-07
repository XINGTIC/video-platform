const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://h823.sol148.com/index.php';
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'zh-CN,zh;q=0.9'
            }
        });
        const $ = cheerio.load(res.data);
        const title = $('title').text().trim();
        console.log('Page Title:', title);
        
        const firstLink = $('a[href*="view_video.php"]').first().attr('href');
        if(firstLink) {
            const fullLink = firstLink.startsWith('http') ? firstLink : 'https://h823.sol148.com/' + firstLink;
            console.log('Testing Link:', fullLink);
            
            const vRes = await axios.get(fullLink, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'zh-CN,zh;q=0.9'
                }
            });
            const $v = cheerio.load(vRes.data);
            const vTitle = $v('title').text().trim();
            console.log('Video Title:', vTitle);
        }
    } catch (e) {
        console.error(e.message);
    }
}

test();