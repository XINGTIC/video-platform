const axios = require('axios');

const API = 'https://video-platform-3v33.onrender.com/api';

async function test() {
    try {
        console.log('1. 登录...');
        const login = await axios.post(API + '/auth/login', {
            username: 'xingtic',
            password: 'Xingtic.0.'
        });
        const token = login.data.token;
        console.log('登录成功');
        
        console.log('\n2. 获取视频列表...');
        const list = await axios.get(API + '/videos?limit=1');
        const videoId = list.data.videos[0]._id;
        console.log('视频ID:', videoId);
        
        console.log('\n3. 测试流式端点 (新部署)...');
        const streamUrl = API + '/videos/' + videoId + '/stream?token=' + token;
        console.log('URL:', streamUrl);
        
        const stream = await axios.get(streamUrl, {
            responseType: 'arraybuffer',
            headers: { Range: 'bytes=0-1000' },
            timeout: 60000,
            validateStatus: () => true
        });
        
        console.log('响应状态:', stream.status);
        console.log('Content-Type:', stream.headers['content-type']);
        console.log('Content-Length:', stream.headers['content-length']);
        
        if (stream.status === 200 || stream.status === 206) {
            const data = Buffer.from(stream.data);
            console.log('数据长度:', data.length);
            const header = data.slice(0, 20).toString('hex');
            console.log('文件头(hex):', header);
            
            // MP4 文件通常以 00 00 00 xx 66 74 79 70 (ftyp) 开头
            if (header.includes('66747970') || header.includes('6674')) {
                console.log('\n✅ 成功！检测到有效的 MP4 文件数据！');
            } else {
                console.log('\n数据预览:', data.slice(0, 50).toString());
            }
        } else {
            console.log('\n❌ 请求失败');
            const body = Buffer.from(stream.data).toString();
            console.log('响应内容:', body);
        }
        
    } catch (e) {
        console.error('错误:', e.message);
    }
}

test();

