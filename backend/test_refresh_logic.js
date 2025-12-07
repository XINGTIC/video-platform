const axios = require('axios');
const cheerio = require('cheerio');

async function getH823VideoUrl(link) {
    console.log(`Fetching ${link}...`);
    try {
        const vRes = await axios.get(link, {
             headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'zh-CN,zh;q=0.9'
             }
        });
        const $v = cheerio.load(vRes.data);
        
        const html = $v('video').parent().html() || '';
        const match = html.match(/strencode2\("([^"]+)"\)/);
        
        let videoUrl = null;
        if (match) {
            console.log('Found strencode2 match');
            const decoded = decodeURIComponent(match[1]);
            const srcMatch = decoded.match(/src='([^']+)'/);
            if (srcMatch) videoUrl = srcMatch[1];
        } else {
            console.log('No strencode2 match');
        }
        
        if (!videoUrl) {
            videoUrl = $v('source').attr('src') || $v('video').attr('src');
        }
        
        return videoUrl;
    } catch (e) {
        console.error(`[Get-H823-URL] Error: ${e.message}`);
        return null;
    }
}

async function test() {
    // 1. Get a fresh source URL from index
    try {
        const res = await axios.get('https://h823.sol148.com/index.php', {
             headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
             }
        });
        const $ = cheerio.load(res.data);
        let sourceUrl = null;
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('view_video.php?viewkey=')) {
                sourceUrl = href.startsWith('http') ? href : 'https://h823.sol148.com/' + href;
                return false; // break
            }
        });

        if (!sourceUrl) {
            console.log('Could not find any video link on index page');
            return;
        }

        console.log(`Testing Source URL: ${sourceUrl}`);
        const videoUrl = await getH823VideoUrl(sourceUrl);
        console.log(`Extracted Video URL: ${videoUrl}`);

        if (videoUrl) {
            // Verify accessibility
             try {
                await axios.head(videoUrl, {
                    headers: {
                        'Referer': 'https://h823.sol148.com/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                console.log('Video URL is accessible (200)');
            } catch (e) {
                console.log(`Video URL is NOT accessible: ${e.response ? e.response.status : e.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

test();
