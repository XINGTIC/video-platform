import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Hls from 'hls.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

export default function Watch() {
  const router = useRouter();
  const { id } = router.query;
  const [video, setVideo] = useState(null);
  const [error, setError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // 辅助函数 - 获取视频源URL
  const getVideoSrc = (v, useProxy = false) => {
    if (!v || !v.videoUrl) return '';
    
    // 如果视频 URL 是 MP4，尝试直接播放（不使用代理）
    // 因为 <video> 标签在无 crossorigin 时可以直接加载外部视频
    const isMP4 = v.videoUrl.toLowerCase().includes('.mp4');
    
    if (isMP4 && !useProxy) {
      // 直接返回原始 URL，让浏览器直接请求
      console.log('[Video] 使用直接播放模式 (MP4)');
      return v.videoUrl;
    }
    
    // m3u8 或其他格式需要代理（因为需要重写 URL）
    if (v.provider === 'H823' || (v.tags && v.tags.includes('H823'))) {
      const referer = v.sourceUrl || 'https://h823.sol148.com/';
      return `${API_URL}/proxy?url=${encodeURIComponent(v.videoUrl)}&referer=${encodeURIComponent(referer)}`;
    }
    
    if (v.provider === 'MG621' || (v.tags && v.tags.includes('MG621'))) {
      const referer = 'https://mg621.x5t5d5a4c.work/';
      return `${API_URL}/proxy?url=${encodeURIComponent(v.videoUrl)}&referer=${encodeURIComponent(referer)}`;
    }
    
    if (v.videoUrl.startsWith('http')) {
      return `${API_URL}/proxy?url=${encodeURIComponent(v.videoUrl)}`;
    }
    
    return v.videoUrl;
  };
  
  // 检测是否为 HLS 格式（基于实际 URL，不是 provider）
  const isHLSVideo = (v) => {
    if (!v || !v.videoUrl) return false;
    const url = v.videoUrl.toLowerCase();
    // 只有 URL 中包含 m3u8 才是 HLS 格式
    return url.includes('.m3u8') || url.includes('m3u8');
  };

  // 辅助函数 - 获取缩略图URL
  const getThumbnailSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return `${API_URL}/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent('https://h823.sol148.com/')}`;
    }
    return url;
  };

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
        localStorage.removeItem('token'); // Clear invalid token
        router.push('/login');
      } else if (err.response?.status === 404) {
        setError('视频不存在或已被删除');
      } else {
        setError(`加载视频失败: ${err.message} ${err.response?.data?.message || ''}`);
      }
    });
  }, [id]);

  // HLS 播放器初始化
  useEffect(() => {
    if (!video || !videoRef.current) return;

    const videoSrc = getVideoSrc(video);
    const videoElement = videoRef.current;

    console.log('[Video] 视频源:', videoSrc);
    console.log('[Video] 原始URL:', video.videoUrl);
    console.log('[Video] Provider:', video.provider);

    // 清理之前的 HLS 实例
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // 检测是否为 m3u8 格式（基于原始 videoUrl）
    const isHLS = isHLSVideo(video);
    console.log('[Video] 是否HLS:', isHLS);

    if (isHLS) {
      if (Hls.isSupported()) {
        console.log('[Video] 使用 HLS.js 播放');
        // 使用 hls.js 播放
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          startLevel: -1,
          debug: false,
        });
        hlsRef.current = hls;
        
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log('[HLS] Manifest 解析成功, 质量级别:', data.levels.length);
          setVideoLoading(false);
          videoElement.play().catch((e) => {
            console.log('[Video] 自动播放被阻止:', e.message);
          });
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('[HLS] Error:', data.type, data.details);
          console.error('[HLS] Error data:', JSON.stringify(data, null, 2));
          
          if (data.fatal) {
            setVideoLoading(false);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('[HLS] 网络错误，尝试恢复...');
                // 尝试恢复一次
                setTimeout(() => hls.startLoad(), 1000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('[HLS] 媒体错误，尝试恢复...');
                hls.recoverMediaError();
                break;
              default:
                console.error('[HLS] 致命错误，无法恢复');
                setError(`视频播放失败: ${data.details || '未知错误'}`);
                break;
            }
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari 原生支持 HLS
        console.log('[Video] Safari 原生 HLS 播放');
        videoElement.src = videoSrc;
        videoElement.play().catch(() => {});
      } else {
        setError('您的浏览器不支持播放此视频格式');
      }
    } else {
      // 普通 MP4 等格式，直接播放
      console.log('[Video] 直接播放 MP4/其他格式');
      videoElement.src = videoSrc;
      
      videoElement.onloadeddata = () => {
        setVideoLoading(false);
      };
      
      videoElement.onerror = (e) => {
        console.error('[Video] 加载错误:', e);
        setVideoLoading(false);
        setError('视频加载失败，请刷新重试');
      };
      
      videoElement.play().catch((e) => {
        console.log('[Video] 自动播放被阻止:', e.message);
      });
    }

    // 清理函数
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video]);

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
      
      <div style={{ maxWidth: '900px', margin: '0 auto', background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
        {videoLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            zIndex: 10,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div>视频加载中...</div>
          </div>
        )}
        <video 
            ref={videoRef}
            width="100%" 
            height="auto" 
            controls 
            playsInline
            preload="auto"
            poster={getThumbnailSrc(video.thumbnailUrl)} 
            style={{ maxHeight: '80vh', display: 'block', minHeight: '300px' }}
        />
      </div>
      
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
