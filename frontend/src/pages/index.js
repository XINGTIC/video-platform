import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Head from 'next/head';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/videos`)
      .then(res => setVideos(res.data))
      .catch(err => {
        console.error(err);
        setError(`加载视频失败: ${err.message}. API URL: ${API_URL}`);
      });
  }, []);

  return (
    <div className="container">
      <Head>
        <meta name="referrer" content="no-referrer" />
        <title>视频平台</title>
      </Head>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>视频平台</h1>
        <div>
          <Link href="/login" style={{marginRight: '10px'}}>登录</Link>
          <Link href="/upload">上传</Link>
        </div>
      </header>

      {error && <div style={{color: 'red', padding: '20px'}}>{error}</div>}
      

      <div className="grid">
        {videos.map(video => (
          <div key={video._id} className="card">
            <Link href={`/watch?id=${video._id}`}>
              <img src={video.thumbnailUrl || 'https://via.placeholder.com/300x150'} alt={video.title} />
              <h3>{video.title}</h3>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
