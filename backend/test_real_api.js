const axios = require('axios');
const CryptoJS = require('crypto-js');

async function testRealApi() {
  const baseURL = 'https://mg621.x5t5d5a4c.work/api';
  
  // Generate a consistent deviceId
  const deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
  console.log('Using DeviceID:', deviceId);

  // Helper to generate headers
  const getHeaders = (url) => {
    const t = Date.now().toString();
    const c = t.slice(3, 8);
    const s = CryptoJS.SHA1(c).toString();
    
    const headers = {
      't': t,
      's': s,
      'User-Mark': 'xhp',
      'deviceId': deviceId,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://mg621.x5t5d5a4c.work/',
      'Origin': 'https://mg621.x5t5d5a4c.work',
      'Content-Type': 'application/json'
    };

    const whitelist = ["user/v1/key", "user/v1/refresh", "user/v1/traveler"];
    const isWhitelisted = whitelist.some(path => url.includes(path));

    if (!isWhitelisted) {
      headers['X-Nonce'] = (Math.floor(Math.random()*9e5)+1e5).toString();
    }
    
    return headers;
  };

  // Helper to encrypt payload (zg function)
  const encryptPayload = (data, key) => {
    if (!key) throw new Error("Key is missing");
    const keyParsed = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), keyParsed, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return {
        encryptedData: encrypted.toString(),
        key: key
    };
  };

  // Helper to decrypt response (jg function)
  const decryptResponse = (encData, token) => {
    if (!token) throw new Error("Token is missing for decryption");
    const keyStr = token.slice(2, 18);
    const key = CryptoJS.enc.Utf8.parse(keyStr);
    const iv = CryptoJS.enc.Utf8.parse(keyStr);
    
    const decrypted = CryptoJS.AES.decrypt(encData, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    try {
        return JSON.parse(decryptedStr);
    } catch (e) {
        console.error("Failed to parse decrypted JSON:", decryptedStr);
        return null;
    }
  };

  try {
    // Step 1: Get Key
    console.log('Step 1: Getting API Key...');
    const keyUrl = '/user/v1/key';
    const keyHeaders = getHeaders(keyUrl);
    const keyRes = await axios.get(baseURL + keyUrl, { headers: keyHeaders });
    let apiKey = keyRes.data.data.key;
    console.log('Got API Key:', apiKey);

    // Step 2: Get Traveler Token
    console.log('\nStep 2: Requesting traveler token...');
    const travelerUrl = '/user/v1/traveler';
    const travelerHeaders = getHeaders(travelerUrl);
    const travelerPayload = encryptPayload({ deviceId: deviceId }, apiKey);
    const travelerRes = await axios.post(baseURL + travelerUrl, travelerPayload, { headers: travelerHeaders });
    
    let token;
    let decryptionToken;
    
    if (travelerRes.data.encData) {
        console.log("Unexpected traveler response structure:", travelerRes.data);
    } else if (travelerRes.data.data) {
        console.log("Traveler Data Full:", JSON.stringify(travelerRes.data.data, null, 2));
        token = travelerRes.data.data.accessToken;
        decryptionToken = travelerRes.data.data.token;
        console.log('Access Token:', token);
        console.log('Decryption Token:', decryptionToken);
    }
    
    if (!token) throw new Error("Failed to get access token");
    if (!decryptionToken) decryptionToken = token;

    // Step 3: Get Classify List (Tags)
    console.log('\nStep 3: Getting Classify List...');
    const classifyUrl = '/video/classify/classifyList';
    const classifyHeaders = getHeaders(classifyUrl);
    classifyHeaders['accAut'] = `Bearer ${token}`;
    
    try {
        const classifyRes = await axios.get(baseURL + classifyUrl, { headers: classifyHeaders });
        console.log('Classify Status:', classifyRes.status);
        if (classifyRes.data.encData) {
             console.log('Decrypting Classify List...');
             const decrypted = decryptResponse(classifyRes.data.encData, decryptionToken);
             if (decrypted.data && decrypted.data.length > 0) {
                 console.log('First Classify Item:', decrypted.data[0]);
             }
        }
    } catch (e) {
        console.log('Classify Error:', e.message);
    }

    // Step 4: Get Hot Videos (Test)
    console.log('\nStep 4: Getting Hot Videos...');
    const hotUrl = '/video/new/getHot';
    const hotHeaders = getHeaders(hotUrl);
    hotHeaders['accAut'] = `Bearer ${token}`;
    
    try {
        const hotRes = await axios.get(baseURL + hotUrl, { headers: hotHeaders });
        console.log('Hot Status:', hotRes.status);
        if (hotRes.data.encData) {
             console.log('Decrypting Hot Videos...');
             const decrypted = decryptResponse(hotRes.data.encData, decryptionToken);
             if (decrypted.data && decrypted.data.length > 0) {
                 console.log('First Hot Video:', decrypted.data[0]);
             }
        }
    } catch (e) {
        console.log('Hot Error:', e.message);
    }

    // Step 5: Get Videos by Classify
    console.log('\nStep 5: Getting Videos for Classify ID 42...');
    const videoListUrl = '/video/new/queryVideoByClassify';
    const videoListHeaders = getHeaders(videoListUrl);
    videoListHeaders['accAut'] = `Bearer ${token}`;
    
    const videoListParams = {
        classifyId: 42,
        page: 1,
        pageSize: 10
    };

    try {
        const videoListRes = await axios.get(baseURL + videoListUrl, { 
            headers: videoListHeaders,
            params: videoListParams 
        });
        
        console.log('Video List Status:', videoListRes.status);
        if (videoListRes.data.encData) {
            console.log('Decrypting Video List...');
            const decrypted = decryptResponse(videoListRes.data.encData, decryptionToken);
            
            if (decrypted.data && Array.isArray(decrypted.data)) {
                console.log(`Found ${decrypted.data.length} videos.`);
                console.log('First Video:', JSON.stringify(decrypted.data[0], null, 2));
            } else if (decrypted.data && decrypted.data.list) {
                 console.log(`Found ${decrypted.data.list.length} videos.`);
                 console.log('First Video:', JSON.stringify(decrypted.data.list[0], null, 2));
            } else {
                 console.log('Decrypted Video List Structure:', Object.keys(decrypted));
                 console.log('Full Data:', JSON.stringify(decrypted).substring(0, 500));
            }
        } else {
             console.log('Video List Data (Unencrypted):', JSON.stringify(videoListRes.data).substring(0, 200));
        }
    } catch (e) {
        console.log('Video List Error:', e.message);
        if (e.response) console.log(e.response.data);
    }

  } catch (e) {
    console.log('Fatal Error:', e.message);
    if (e.response) {
        console.log('Response Data:', JSON.stringify(e.response.data));
    }
  }
}

testRealApi();
