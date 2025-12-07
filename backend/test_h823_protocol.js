const axios = require('axios');
const cheerio = require('cheerio');

async function checkH823VideoProtocol() {
    const baseURL = 'https://h823.sol148.com';
    try {
        const res = await axios.get(baseURL + '/index.php', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'zh-CN,zh;q=0.9'
            }
        });
        const $ = cheerio.load(res.data);
        const link = $('a[href*="view_video.php"]').first().attr('href');
        
        if (!link) {
            console.log('No video link found');
            return;
        }
        
        const fullLink = link.startsWith('http') ? link : baseURL + '/' + link;
        console.log('Testing Link:', fullLink);
        
        const vRes = await axios.get(fullLink, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'zh-CN,zh;q=0.9'
            }
        });
        
        const $v = cheerio.load(vRes.data);
        const html = $v('video').parent().html() || '';
        const match = html.match(/strencode2\("([^"]+)"\)/);
        
        if (match) {
            const decoded = decodeURIComponent(match[1]);
            const srcMatch = decoded.match(/src='([^']+)'/);
            if (srcMatch) {
                console.log('Extracted Video URL:', srcMatch[1]);
            }
        } else {
            const src = $v('source').attr('src') || $v('video').attr('src');
            console.log('Direct Video URL:', src);
        }
        
    } catch (e) {
        console.error(e.message);
    }
}

checkH823VideoProtocol();
