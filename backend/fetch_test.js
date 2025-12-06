const axios = require('axios');
const fs = require('fs');

async function fetchSite() {
  try {
    // Mock a browser user agent to avoid basic blocking
    const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    };
    console.log('Fetching...');
    const res = await axios.get('https://mg621.x5t5d5a4c.work/', { headers });
    console.log('Status:', res.status);
    fs.writeFileSync('site_home.html', res.data);
    console.log('Saved to site_home.html');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

fetchSite();