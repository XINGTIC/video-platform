import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_URL = 'http://localhost:5000/api';

export default function Upload() {
  const [formData, setFormData] = useState({
    title: '', description: '', videoUrl: '', thumbnailUrl: ''
  });
  const router = useRouter();

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/videos`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Uploaded!');
      router.push('/');
    } catch (error) {
      alert('Upload failed');
    }
  };

  // This is for Sync
  const handleSync = async () => {
    const url = prompt('Enter your site URL to scrape:');
    if (url) {
        try {
            const res = await axios.post(`${API_URL}/sync/run`, { targetUrl: url });
            alert(res.data.message);
        } catch (e) {
            alert('Sync error');
        }
    }
  }

  return (
    <div className="container">
      <h2>Upload Video</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" onChange={handleChange} />
        <input name="description" placeholder="Description" onChange={handleChange} />
        <input name="videoUrl" placeholder="Video URL (e.g., R2/S3 Link)" onChange={handleChange} />
        <input name="thumbnailUrl" placeholder="Thumbnail URL" onChange={handleChange} />
        <button className="btn" type="submit">Submit</button>
      </form>

      <hr />
      <h3>Auto Sync</h3>
      <button className="btn" onClick={handleSync}>Sync from my Site</button>
    </div>
  );
}
