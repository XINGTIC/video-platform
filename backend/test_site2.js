const axios = require('axios');
const cheerio = require('cheerio');

async function testSite2() {
  const url = 'https://h823.sol148.com/index.php';
  
  try {
    console.log(`Fetching ${url}...`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log(`Status: ${res.status}`);
    const $ = cheerio.load(res.data);
    
    const title = $('title').text();
    console.log(`Page Title: ${title}`);
    
    // Check for video links
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('vod') || href.includes('video') || href.includes('play'))) {
        links.push(href);
      }
    });
    
    console.log(`Found ${links.length} potential video links.`);
    if (links.length > 0) {
        console.log('Sample links:', links.slice(0, 5));
        
        // Fetch a video page to find the actual video source
        const videoPageUrl = links[1]; // Pick the first real video link (index 1, index 0 seems to be my_video.php)
        console.log(`\nFetching video page: ${videoPageUrl}...`);
        
        const vRes = await axios.get(videoPageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $v = cheerio.load(vRes.data);
        const videoSrc = $v('source').attr('src') || $v('video').attr('src');
        console.log('Video Src:', videoSrc);
        
        // Sometimes it's in a script
         const scripts = $v('script').map((i, el) => $v(el).html()).get();
         const scriptWithVideo = scripts.find(s => s && (s.includes('.mp4') || s.includes('.m3u8') || s.includes('videojs')));
         
         if (scriptWithVideo) {
             console.log('Found script with video pattern:');
             console.log(scriptWithVideo.trim());
         } else {
             console.log('No script with video pattern found.');
         }
         
         // Check for <video> tag attributes and hidden script
         const videoTag = $v('video');
         if (videoTag.length > 0) {
             console.log('Video Tag HTML:', videoTag.parent().html());
             
             // Extract strencode2 content
             const html = videoTag.parent().html();
             const match = html.match(/strencode2\("([^"]+)"\)/);
             if (match) {
                 console.log('Found strencode2 data.');
                 const encoded = match[1];
                 try {
                     const decoded = decodeURIComponent(encoded);
                     console.log('Decoded:', decoded);
                     
                     // Extract src from decoded string
                     const srcMatch = decoded.match(/src='([^']+)'/);
                     if (srcMatch) {
                         console.log('Extracted Video URL:', srcMatch[1]);
                     }
                 } catch (e) {
                     console.log('Decoding failed:', e.message);
                 }
             }
         }

         // Get Title and Tags
         const vTitle = $v('title').text().trim();
        console.log('Video Title:', vTitle);
        
        // Guessing tag selectors
        const tags = [];
        $v('.tag, .category, .label').each((i, el) => tags.push($v(el).text().trim()));
        console.log('Tags found:', tags);
    }


  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSite2();
