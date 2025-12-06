const axios = require('axios');
const fs = require('fs');

async function downloadVendor() {
  try {
    const url = 'https://mg621.x5t5d5a4c.work/assets/vendor.f18d8642.js';
    const response = await axios.get(url);
    fs.writeFileSync('vendor.js', response.data);
    console.log('Vendor file downloaded');
  } catch (error) {
    console.error('Error downloading vendor:', error.message);
  }
}

downloadVendor();