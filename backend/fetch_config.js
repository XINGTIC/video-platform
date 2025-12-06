const axios = require('axios');
const fs = require('fs');

async function fetchConfig() {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    console.log('Fetching config...');
    const res = await axios.get('https://mg621.x5t5d5a4c.work/_app.config.js', { headers });
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

fetchConfig();