import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

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
    <div className="container" style={{textAlign: 'center', marginTop: '50px'}}>
      <h2>{error}</h2>
      {error.includes('限额') && (
        <div style={{marginTop: '20px'}}>
            <p>开通会员可享受无限观看权益</p>
            <button 
                className="btn" 
                style={{
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 20px', 
                    borderRadius: '5px', 
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}
                onClick={() => router.push('/membership')}
            >
                立即升级会员
            </button>
            <div style={{marginTop: '20px'}}>
                <button onClick={() => router.push('/')} style={{background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer'}}>
                    返回首页
                </button>
            </div>
        </div>
      )}
    </div>
  );

  if (!video) return <div className="container">加载中...</div>;

  const getVideoSrc = (v) => {
    if (v.provider === 'H823' || (v.tags && v.tags.includes('H823'))) {
        return `${API_URL}/proxy?url=${encodeURIComponent(v.videoUrl)}`;
    }
    return v.videoUrl;
  };

  const getThumbnailSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) {
        return `${API_URL}/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this video: ${video.title}`;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        alert('链接已复制到剪贴板！');
      });
    } else if (platform === 'wechat') {
      // WeChat doesn't support direct web sharing via URL scheme easily without SDK
      // Best practice is to show QR code or copy link
      // For now, we reuse copy link with a specific message or just copy
      navigator.clipboard.writeText(url).then(() => {
        alert('链接已复制！请在微信中粘贴发送。');
      });
    } else if (platform === 'qq') {
       // QQ Web Share
       const shareUrl = `http://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(video.title)}&desc=${encodeURIComponent(video.description || '')}&summary=${encodeURIComponent(text)}&site=VideoPlatform`;
       window.open(shareUrl, '_blank');
    } else if (platform === 'douyin') {
      // Douyin doesn't have a web share URL scheme
      navigator.clipboard.writeText(url).then(() => {
        alert('链接已复制！请在抖音中粘贴或发布。');
      });
    }
  };

  return (
    <div className="container">
      <Head>
        <meta name="referrer" content="no-referrer" />
        <title>{video.title} - 视频平台</title>
        <meta property="og:title" content={video.title} />
        <meta property="og:description" content={video.description || '点击观看视频'} />
        <meta property="og:image" content={getThumbnailSrc(video.thumbnailUrl)} />
        <meta property="og:type" content="video.other" />
      </Head>
      <h1>{video.title}</h1>
      <video width="100%" controls src={getVideoSrc(video)} poster={getThumbnailSrc(video.thumbnailUrl)} />
      
      {/* Display Tags */}
      {video.tags && video.tags.length > 0 && (
        <div style={{marginTop: '10px'}}>
            {video.tags.map((tag, index) => (
                <span key={index} style={{
                    background: 'var(--input-bg)', 
                    color: 'var(--text-sec)',
                    padding: '5px 10px', 
                    borderRadius: '15px', 
                    marginRight: '5px',
                    fontSize: '12px',
                    border: '1px solid var(--border)'
                }}>
                    {tag}
                </span>
            ))}
        </div>
      )}

      {/* Share Buttons */}
      <div style={{marginTop: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '8px'}}>
        <h3 style={{marginTop: 0, fontSize: '16px'}}>分享视频</h3>
        <div style={{display: 'flex', gap: '10px'}}>
          <button onClick={() => handleShare('copy')} style={{padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)'}}>📋 复制链接</button>
          <button onClick={() => handleShare('wechat')} style={{padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: 'none', background: '#07C160', color: 'white'}}>💬 微信</button>
          <button onClick={() => handleShare('qq')} style={{padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: 'none', background: '#12B7F5', color: 'white'}}>🐧 QQ</button>
          <button onClick={() => handleShare('douyin')} style={{padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: 'none', background: '#1c1c1c', color: 'white', border: '1px solid #333'}}>🎵 抖音</button>
        </div>
      </div>

      <p>{video.description}</p>
    </div>
  );
}
