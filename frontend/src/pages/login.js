import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    
    // Validation
    if (isRegister) {
        if (!email) return alert('请输入邮箱');
        if (password.length < 8) return alert('密码长度至少8位');
    }

    try {
      const payload = isRegister 
        ? { username, email, password } 
        : { username, password };

      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        router.push('/');
      } else {
        alert('注册成功！请登录。');
        setIsRegister(false);
        setPassword('');
      }
    } catch (error) {
      alert(error.response?.data?.message || '错误');
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '20px'
  };

  const cardStyle = {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    background: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
    fontWeight: 'bold'
  };

  const linkStyle = {
    color: '#0070f3',
    cursor: 'pointer',
    marginTop: '20px',
    display: 'block',
    textDecoration: 'none'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{marginBottom: '30px', color: '#333'}}>{isRegister ? '注册账号' : '登录'}</h2>
        <form onSubmit={handleSubmit}>
          <input 
            style={inputStyle}
            placeholder="用户名" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required
          />
          
          {isRegister && (
            <input 
              style={inputStyle}
              type="email"
              placeholder="邮箱地址" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
          )}

          <input 
            style={inputStyle}
            type="password" 
            placeholder={isRegister ? "密码 (至少8位)" : "密码"}
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
            minLength={isRegister ? 8 : undefined}
          />
          
          <button style={buttonStyle} type="submit">
            {isRegister ? '立即注册' : '登录'}
          </button>
        </form>
        
        <a style={linkStyle} onClick={() => {
            setIsRegister(!isRegister);
            setPassword('');
        }}>
          {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </a>
      </div>
    </div>
  );
}
