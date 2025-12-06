const axios = require('axios');

async function runSync() {
    try {
        console.log('Triggering Sync (Limit: 10)...');
        const res = await axios.post('http://localhost:5000/api/sync/run', {
            limit: 10
        }, {
            timeout: 300000 // 5 minutes timeout
        });
        console.log('Sync Result:', res.data);
    } catch (e) {
        console.log('Sync Error:', e.message);
        if (e.response) {
            console.log('Response:', e.response.data);
        }
    }
}

runSync();
