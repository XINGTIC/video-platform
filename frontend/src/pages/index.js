import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Head from 'next/head';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest'); // newest | popular
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchVideos = async (pageNum = 1, reset = false) => {
    if (loading && !reset && pageNum === page) return; // Prevent duplicate reqs
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/videos`, {
        params: { q: search, sort, page: pageNum, limit: 20 }
      });
      
      const newVideos = res.data.videos || [];
      const totalPages = res.data.totalPages || 1;

      if (reset) {
        setVideos(newVideos);
      } else {
        setVideos(prev => [...prev, ...newVideos]);
      }
      
      setHasMore(pageNum < totalPages);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(`加载视频失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial load or sort/search change
  useEffect(() => {
    setPage(1);
    fetchVideos(1, true);
  }, [sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVideos(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage, false);
    }
  };

  const getThumbnailSrc = (url) => {
    if (!url) return 'https://via.placeholder.com/300x150';
    // Proxy external images to bypass referrer/CORS issues
    if (url.startsWith('http')) {
        return `${API_URL}/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="referrer" content="no-referrer" />
        <title>视频平台</title>
      </Head>

      {/* Header / Nav */}
      <header className="main-header">
        <div className="logo">视频平台</div>
        <div className="nav-links">
          <Link href="/invite" className="nav-btn" style={{borderColor: 'var(--primary)', color: 'var(--primary)'}}>邀请有礼</Link>
          <Link href="/membership" className="nav-btn" style={{background: 'var(--primary)', color: 'white'}}>会员升级</Link>
          <Link href="/upload" className="nav-btn">上传</Link>
          <Link href="/login" className="nav-btn primary">登录</Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" 
            placeholder="搜索视频..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">搜索</button>
        </form>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${sort === 'newest' ? 'active' : ''}`}
          onClick={() => setSort('newest')}
        >
          最新视频
        </button>
        <button 
          className={`tab-btn ${sort === 'popular' ? 'active' : ''}`}
          onClick={() => setSort('popular')}
        >
          热门视频
        </button>
      </div>

      {/* Content */}
      {error && <div className="error-msg">{error}</div>}
      
      <div className="grid">
        {videos.length === 0 && !loading ? (
          <div className="empty-state">暂无相关视频</div>
        ) : (
          videos.map(video => (
            <div key={video._id} className="card">
              <Link href={`/watch?id=${video._id}`} className="card-link">
                <div className="thumbnail-wrapper">
                  <img 
                    src={getThumbnailSrc(video.thumbnailUrl)}
                    alt={video.title} 
                    className="thumbnail"
                    loading="lazy"
                    onError={(e) => {
                      if (e.target.src.includes('via.placeholder')) return;
                      e.target.src='https://via.placeholder.com/300x150/000000/FFFFFF?text=No+Image'
                    }}
                  />
                  <div className="duration-badge">{formatDuration(video.duration)}</div>
                </div>
                <div className="card-info">
                  <h3 className="video-title">{video.title}</h3>
                  <div className="video-meta">
                    <span>👁️ {video.views || 0}</span>
                    {video.tags && video.tags.length > 0 && (
                      <span className="tag-badge">{video.tags[0]}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Loading & Pagination */}
      {loading && <div className="loading" style={{textAlign: 'center', padding: '20px'}}>加载中...</div>}
      
      {!loading && hasMore && videos.length > 0 && (
        <div style={{textAlign: 'center', padding: '20px', marginBottom: '40px'}}>
          <button 
            onClick={loadMore}
            style={{
              padding: '10px 30px',
              fontSize: '16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            加载更多
          </button>
        </div>
      )}
      
      {!hasMore && videos.length > 0 && (
        <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-sec)', marginBottom: '20px'}}>
          没有更多视频了
        </div>
      )}
    </div>
  );
}
