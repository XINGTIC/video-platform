const axios = require('axios');
const fs = require('fs');

async function fetchJS() {
  try {
    console.log('Fetching JS...');
    const res = await axios.get('https://mg621.x5t5d5a4c.work/assets/index.c52759ab.js');
    fs.writeFileSync('bundle.js', res.data);
    console.log('Saved bundle.js');
  } catch (e) { console.error(e); }
}

fetchJS();