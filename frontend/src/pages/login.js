import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    
    try {
      const res = await axios.post(`${API_URL}${endpoint}`, { username, password });
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        router.push('/');
      } else {
        alert('注册成功！请登录。');
        setIsRegister(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || '发生错误');
    }
  };

  return (
    <div className="container">
      <h2>{isRegister ? '注册' : '登录'}</h2>
      <form onSubmit={handleSubmit} style={{maxWidth: '400px'}}>
        <input 
          placeholder="用户名" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="密码" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        <button className="btn" type="submit">{isRegister ? '注册' : '登录'}</button>
      </form>
      <p onClick={() => setIsRegister(!isRegister)} style={{cursor: 'pointer', marginTop: '10px'}}>
        {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
      </p>
    </div>
  );
}