import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (router.query.invite) {
      setIsRegister(true);
      setInviteCode(router.query.invite);
    }
  }, [router.query]);

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
        ? { username, email, password, inviteCode } 
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
    padding: '20px'
  };

  const cardStyle = {
    background: 'var(--card-bg)',
    color: 'var(--text-main)',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  };

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

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
    fontWeight: 'bold'
  };

  const linkStyle = {
    color: 'var(--primary)',
    cursor: 'pointer',
    marginTop: '20px',
    display: 'block',
    textDecoration: 'none'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{marginBottom: '30px', color: 'var(--text-main)'}}>{isRegister ? '注册账号' : '登录'}</h2>
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
          
          {isRegister && (
            <input 
              style={inputStyle}
              placeholder="邀请码 (选填)" 
              value={inviteCode} 
              onChange={e => setInviteCode(e.target.value)} 
            />
          )}
          
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
