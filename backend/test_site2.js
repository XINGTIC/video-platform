const axios = require('axios');
const cheerio = require('cheerio');

async function testSite2() {
  const baseURL = 'https://h823.sol148.com';
  const url = baseURL + '/index.php';
  
  try {
    console.log(`Fetching ${url}...`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    });
    
    const $ = cheerio.load(res.data);
    
    const videoLinks = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('view_video.php?viewkey=')) {
            if (!videoLinks.includes(href)) {
                videoLinks.push(href.startsWith('http') ? href : baseURL + '/' + href);
            }
        }
    });
    
    console.log(`Found ${videoLinks.length} video links.`);
    
    if (videoLinks.length > 0) {
        const link = videoLinks[0];
        console.log(`Testing Link: ${link}`);
        
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
            const decoded = decodeURIComponent(match[1]);
            console.log('Decoded HTML Snippet:', decoded);
            const srcMatch = decoded.match(/src='([^']+)'/);
            if (srcMatch) videoUrl = srcMatch[1];
        }
        
        if (!videoUrl) {
            videoUrl = $v('source').attr('src') || $v('video').attr('src');
        }
        
        console.log(`Extracted Video URL: ${videoUrl}`);
        
        if (videoUrl) {
            console.log('Testing Video URL accessibility...');
            try {
                const headRes = await axios.head(videoUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'no-referrer'
                    }
                });
                console.log(`Video URL Status (No Referer): ${headRes.status}`);
            } catch (e) {
                console.log(`Video URL Error (No Referer): ${e.message}`);
                if (e.response) console.log('Status:', e.response.status);
            }

            try {
                const headRes2 = await axios.head(videoUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'https://h823.sol148.com/'
                    }
                });
                console.log(`Video URL Status (With Referer): ${headRes2.status}`);
            } catch (e) {
                console.log(`Video URL Error (With Referer): ${e.message}`);
                if (e.response) console.log('Status:', e.response.status);
            }
        }
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSite2();
