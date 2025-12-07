const { getH823VideoUrl } = require('./routes/sync');
const axios = require('axios');

async function testSync() {
    const sourceUrl = 'https://h823.sol148.com/view_video.php?viewkey=25950a7c4c3752e2576e'; // Need a valid source URL
    // Let's first get a valid source URL from the DB
    try {
        const res = await axios.get('http://localhost:5000/api/videos?page=1&limit=1');
        const video = res.data.videos[0];
        if (!video) {
            console.log('No video found in DB.');
            return;
        }
        
        // We need the full source URL, but list API doesn't return it.
        // We need to fetch detail first.
        // Or we can just use the video ID to fetch detail.
        
        // Login to get token
         const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'xingtic',
            password: 'Xingtic.0.'
        });
        const token = loginRes.data.token;
        
        const detailRes = await axios.get(`http://localhost:5000/api/videos/${video._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const fullVideo = detailRes.data;
        console.log('Testing refresh for:', fullVideo.title);
        console.log('Source URL:', fullVideo.sourceUrl);
        console.log('Current Video URL:', fullVideo.videoUrl);
        
        if (fullVideo.sourceUrl) {
            console.log('Attempting to refresh URL...');
            const newUrl = await getH823VideoUrl(fullVideo.sourceUrl);
            console.log('Refreshed URL:', newUrl);
            
            if (newUrl === fullVideo.videoUrl) {
                console.log('URL is unchanged.');
            } else {
                console.log('URL has changed!');
            }
        } else {
            console.log('No sourceUrl available.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testSync();