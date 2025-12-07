import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

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
      alert('上传成功！');
      router.push('/');
    } catch (error) {
      alert('上传失败');
    }
  };

  // This is for Sync
  const handleSync = async () => {
    const url = prompt('请输入你要抓取的网站链接：');
    if (url) {
      try {
        const res = await axios.post(`${API_URL}/sync/run`, { targetUrl: url });
        alert(res.data.message);
      } catch (e) {
        alert('同步错误');
      }
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    background: 'var(--input-bg)',
    color: 'var(--text-main)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: '16px'
  };

  const btnStyle = {
    padding: '10px 20px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px'
  };

  return (
    <div className="container" style={{paddingTop: '20px'}}>
      <div style={{
          background: 'var(--card-bg)', 
          padding: '30px', 
          borderRadius: '10px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{marginTop: 0}}>上传视频</h2>
        <form onSubmit={handleSubmit}>
          <input style={inputStyle} name="title" placeholder="标题" onChange={handleChange} />
          <input style={inputStyle} name="description" placeholder="描述" onChange={handleChange} />
          <input style={inputStyle} name="videoUrl" placeholder="视频地址 (例如 R2/S3 链接)" onChange={handleChange} />
          <input style={inputStyle} name="thumbnailUrl" placeholder="缩略图地址" onChange={handleChange} />
          <button style={btnStyle} type="submit">提交</button>
        </form>

        <hr style={{margin: '30px 0', border: 'none', borderTop: '1px solid var(--border)'}} />
        
        <h3>自动同步</h3>
        <button style={btnStyle} onClick={handleSync}>从我的网站同步</button>
      </div>
    </div>
  );
}