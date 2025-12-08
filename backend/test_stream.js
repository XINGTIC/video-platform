const axios = require('axios');
const cheerio = require('cheerio');

const API = 'https://video-platform-3v33.onrender.com/api';

async function getH823VideoUrl(link) {
    console.log('访问源页面:', link);
    try {
        const vRes = await axios.get(link, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'zh-CN,zh;q=0.9'
            },
            timeout: 15000
        });
        console.log('页面响应状态:', vRes.status);
        console.log('页面长度:', vRes.data.length);
        
        const $ = cheerio.load(vRes.data);
        
        // 查找 video 标签
        const videoTag = $('video');
        console.log('找到 video 标签:', videoTag.length > 0);
        
        // 方法1: 查找 strencode2
        const html = $('video').parent().html() || '';
        console.log('video父元素HTML长度:', html.length);
        
        const match = html.match(/strencode2\("([^"]+)"\)/);
        
        let videoUrl = null;
        if (match) {
            console.log('找到 strencode2 编码');
            const decoded = decodeURIComponent(match[1]);
            console.log('解码后:', decoded.substring(0, 150));
            const srcMatch = decoded.match(/src='([^']+)'/);
            if (srcMatch) {
                videoUrl = srcMatch[1];
                console.log('从 strencode2 提取 URL 成功');
            }
        } else {
            console.log('未找到 strencode2 编码');
        }
        
        // 方法2: 直接查找 source/video src
        if (!videoUrl) {
            videoUrl = $('source').attr('src') || $('video').attr('src');
            if (videoUrl) {
                console.log('从 source/video 标签直接获取 URL');
            }
        }
        
        console.log('提取的视频URL:', videoUrl ? videoUrl.substring(0, 100) + '...' : 'null');
        return videoUrl;
    } catch (e) {
        console.error('获取视频URL错误:', e.message);
        return null;
    }
}

async function testVideoAccess(videoUrl) {
    console.log('\n测试视频URL是否可访问...');
    try {
        const res = await axios.head(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://h823.sol148.com/',
                'Origin': 'https://h823.sol148.com'
            },
            timeout: 10000,
            maxRedirects: 5
        });
        console.log('视频URL可访问! 状态:', res.status);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Content-Length:', res.headers['content-length']);
        return true;
    } catch (e) {
        console.error('视频URL访问失败:', e.message);
        if (e.response) {
            console.error('响应状态:', e.response.status);
        }
        return false;
    }
}

async function main() {
    console.log('=== 测试 H823 视频获取流程 ===\n');
    
    const sourceUrl = 'https://h823.sol148.com/view_video.php?viewkey=f2334846db2f7b566344&c=piktl&viewtype=&category=';
    
    // 步骤1: 从源页面获取视频URL
    const videoUrl = await getH823VideoUrl(sourceUrl);
    
    if (videoUrl) {
        // 步骤2: 测试视频URL是否可访问
        await testVideoAccess(videoUrl);
    } else {
        console.log('\n无法获取视频URL');
    }
}

main();

