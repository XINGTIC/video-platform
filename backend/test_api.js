const axios = require('axios');

async function testApi() {
  const baseURL = 'https://mg621.x5t5d5a4c.work/api';
  const endpoints = ['/video/list', '/videos', '/home', '/index', '/vod/list'];
  
  for (const ep of endpoints) {
    try {
      console.log(`Testing ${baseURL}${ep}...`);
      const res = await axios.get(`${baseURL}${ep}`, { 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          validateStatus: () => true 
      });
      console.log(`Status: ${res.status}`);
      if (res.status === 200) {
        console.log('Preview:', JSON.stringify(res.data).substring(0, 200));
        return; // Found one!
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

testApi();