import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  return (
    <div className="container">
      <h2>上传视频</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="标题" onChange={handleChange} />
        <input name="description" placeholder="描述" onChange={handleChange} />
        <input name="videoUrl" placeholder="视频地址 (例如 R2/S3 链接)" onChange={handleChange} />
        <input name="thumbnailUrl" placeholder="缩略图地址" onChange={handleChange} />
        <button className="btn" type="submit">提交</button>
      </form>

      <hr />
      <h3>自动同步</h3>
      <button className="btn" onClick={handleSync}>从我的网站同步</button>
    </div>
  );
}