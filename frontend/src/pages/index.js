import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/videos`)
      .then(res => setVideos(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>Video Platform</h1>
        <div>
          <Link href="/login" style={{marginRight: '10px'}}>Login</Link>
          <Link href="/upload">Upload</Link>
        </div>
      </header>

      <div className="grid">
        {videos.map(video => (
          <div key={video._id} className="card">
            <Link href={`/watch/${video._id}`}>
              <img src={video.thumbnailUrl || 'https://via.placeholder.com/300x150'} alt={video.title} />
              <h3>{video.title}</h3>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
