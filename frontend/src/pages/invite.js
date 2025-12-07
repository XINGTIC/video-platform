import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

export default function Invite() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    axios.get(`${API_URL}/auth/invite-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setUser(res.data);
      setLoading(false);
    })
    .catch(err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
      setLoading(false);
    });
  }, []);

  const handleCopy = () => {
    const link = `${window.location.origin}/login?invite=${user.inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('邀请链接已复制！发送给好友即可。');
    });
  };

  if (loading) return <div className="container" style={{textAlign:'center', marginTop: '50px'}}>加载中...</div>;
  if (!user) return null;

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/login?invite=${user.inviteCode}`;

  return (
    <div className="container">
      <Head>
        <title>邀请好友 - 视频平台</title>
      </Head>

      <div className="main-header">
        <Link href="/" className="logo">视频平台</Link>
        <div className="nav-links">
          <Link href="/" className="nav-btn">返回首页</Link>
        </div>
      </div>

      <div style={{maxWidth: '600px', margin: '40px auto', textAlign: 'center'}}>
        <h1 style={{color: 'var(--primary)', marginBottom: '10px'}}>邀请好友，免费领会员</h1>
        <p style={{color: 'var(--text-sec)', marginBottom: '30px'}}>
          每邀请一位好友注册，您将获得 <strong style={{color: '#ff4d4f'}}>3天</strong> VIP会员，<br/>
          您的好友也将获得 <strong style={{color: '#ff4d4f'}}>1天</strong> 免费VIP体验！
        </p>

        <div className="card-base" style={{padding: '30px', marginBottom: '30px'}}>
          <h3 style={{marginTop: 0}}>您的专属邀请码</h3>
          <div style={{
            fontSize: '32px', 
            fontWeight: 'bold', 
            letterSpacing: '5px',
            color: 'var(--primary)',
            margin: '20px 0'
          }}>
            {user.inviteCode}
          </div>
          
          <div style={{
            background: 'var(--input-bg)',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid var(--border)',
            wordBreak: 'break-all',
            marginBottom: '20px',
            color: 'var(--text-sec)'
          }}>
            {inviteLink}
          </div>

          <button 
            onClick={handleCopy}
            className="btn-primary"
            style={{
              padding: '12px 40px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            复制邀请链接
          </button>
        </div>

        <div style={{display: 'flex', gap: '20px', justifyContent: 'center'}}>
          <div className="card-base" style={{padding: '20px', flex: 1}}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)'}}>
              {user.inviteCount || 0}
            </div>
            <div style={{color: 'var(--text-sec)', fontSize: '14px'}}>已邀请好友</div>
          </div>
          
          <div className="card-base" style={{padding: '20px', flex: 1}}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)'}}>
              {user.isMember ? 'VIP会员' : '普通用户'}
            </div>
            <div style={{color: 'var(--text-sec)', fontSize: '14px'}}>当前身份</div>
          </div>
        </div>
        
        {user.memberExpireDate && (
           <p style={{marginTop: '20px', color: 'var(--text-sec)', fontSize: '12px'}}>
             您的会员将在 {new Date(user.memberExpireDate).toLocaleDateString()} 到期
           </p>
        )}
      </div>
    </div>
  );
}
