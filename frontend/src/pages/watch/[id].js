import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_URL = 'http://localhost:5000/api';

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
        setError('Daily limit reached. Please upgrade.');
      } else if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError('Error loading video');
      }
    });
  }, [id]);

  const handlePayment = async () => {
    const tx = prompt('Enter your USDT transaction hash (0x...):');
    if (tx) {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.post(`${API_URL}/payment/verify`, { txHash: tx }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
            alert('Success! Reloading...');
            window.location.reload();
        }
      } catch (e) {
        alert('Payment failed');
      }
    }
  };

  if (error) return (
    <div className="container">
      <h2>{error}</h2>
      {error.includes('limit') && (
        <div>
            <p>Pay 10 USDT to address: 0x123...ABC</p>
            <button className="btn" onClick={handlePayment}>I have paid</button>
        </div>
      )}
    </div>
  );

  if (!video) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>{video.title}</h1>
      <video width="100%" controls src={video.videoUrl} poster={video.thumbnailUrl} />
      <p>{video.description}</p>
    </div>
  );
}
