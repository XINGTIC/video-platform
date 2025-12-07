const axios = require('axios');

const urls = [
    // H823 Thumbnail
    "https://1729130453.rsc.cdn77.org/thumb/1155831.jpg",
    // New Mg621 Domain Thumbnail (constructed)
    "https://vb7bveukvwq.pdawbdq.com/jhimage/20250928/ci/pp/q1/xn/9aa4142d73de417ba255981b1335cfef.gif"
];

async function check() {
    for (const url of urls) {
        try {
            console.log('Testing URL:', url);
            const res = await axios.head(url);
            console.log('Status:', res.status);
        } catch (e) {
            console.log('Error:', e.message);
            if (e.response) console.log('Response Status:', e.response.status);
        }
    }
}

check();
