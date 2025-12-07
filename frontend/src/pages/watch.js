import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Watch() {
  const router = useRouter();
  const { id } = router.query;
  const [video, setVideo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    
    const token = localStorage.getItem('token');
    
    axios.get(`${API_URL}/videos/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setVideo(res.data))
    .catch(err => {
      if (err.response?.status === 403) {
        setError('今日观看限额已用完，请升级会员。');
      } else if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError('加载视频失败');
      }
    });
  }, [id]);

  const handlePayment = async () => {
    const tx = prompt('请输入您的 USDT 交易哈希 (0x...):');
    if (tx) {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.post(`${API_URL}/payment/verify`, { txHash: tx }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
            alert('支付成功！正在刷新...');
            window.location.reload();
        }
      } catch (e) {
        alert('支付验证失败');
      }
    }
  };

  if (error) return (
    <div className="container">
      <h2>{error}</h2>
      {error.includes('限额') && (
        <div>
            <p>请支付 10 USDT 到地址: 0x123...ABC</p>
            <button className="btn" onClick={handlePayment}>我已支付</button>
        </div>
      )}
    </div>
  );

  if (!video) return <div className="container">加载中...</div>;

  return (
    <div className="container">
      <Head>
        <meta name="referrer" content="no-referrer" />
        <title>{video.title} - 视频平台</title>
      </Head>
      <h1>{video.title}</h1>
      <video width="100%" controls src={video.videoUrl} poster={video.thumbnailUrl} />
      
      {/* Display Tags */}
      {video.tags && video.tags.length > 0 && (
        <div style={{marginTop: '10px'}}>
            {video.tags.map((tag, index) => (
                <span key={index} style={{
                    background: '#eee', 
                    padding: '5px 10px', 
                    borderRadius: '15px', 
                    marginRight: '5px',
                    fontSize: '12px'
                }}>
                    {tag}
                </span>
            ))}
        </div>
      )}

      <p>{video.description}</p>
    </div>
  );
}