const axios = require('axios');
const fs = require('fs');

async function testVideoRequest() {
    const videoUrl = 'https://la.btc620.com//mp43/1155831.mp4?st=WSvdtRwsOVO2SUxICYKesg&e=1765092421&f=50603nloTwGMZ2FNe6U6FirQ5U69rFFu2pWvJ+U8HFvCsnNvzZugEmUMAsfwjI684HUU7tI1pLw59x3ZZjTIBUiYjlV0042wCnNOXQ';
    const referer = 'https://h823.sol148.com/';
    let log = '';

    log += 'Testing without Referer...\n';
    try {
        await axios.get(videoUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            maxRedirects: 5 
        });
        log += 'Success WITHOUT Referer!\n';
    } catch (e) {
        log += `Failed WITHOUT Referer: ${e.response ? e.response.status : e.message}\n`;
    }

    log += 'Testing WITH Referer...\n';
    try {
        await axios.get(videoUrl, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'Referer': referer 
            },
            maxRedirects: 5
        });
        log += 'Success WITH Referer!\n';
    } catch (e) {
        log += `Failed WITH Referer: ${e.response ? e.response.status : e.message}\n`;
    }
    
    fs.writeFileSync('test_result.txt', log);
    console.log(log);
}

testVideoRequest();
