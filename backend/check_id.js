const axios = require('axios');

async function checkId() {
    try {
        const id = '69353da3bc3243167ce88381';
        console.log(`Checking ID: ${id}`);
        const res = await axios.get(`http://localhost:5000/api/videos/${id}`);
        console.log('Video Found:', res.data.title);
    } catch (e) {
        if (e.response) {
            console.log(`Error ${e.response.status}: ${e.response.data.message || e.message}`);
        } else {
            console.log('Error:', e.message);
        }
    }
    
    // Also list current videos to show what IDs are available
    try {
        console.log('\nListing current videos:');
        const listRes = await axios.get('http://localhost:5000/api/videos?limit=5');
        listRes.data.videos.forEach(v => {
            console.log(`${v._id}: ${v.title}`);
        });
    } catch (e) {
        console.log('List Error:', e.message);
    }
}

checkId();