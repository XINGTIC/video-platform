import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';

export default function Membership() {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check login
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch config
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_URL}/payment/config`);
      setAddress(res.data.address);
      setNetwork(res.data.network);
    } catch (err) {
      console.error('Failed to fetch payment config', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    alert('地址已复制');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txHash) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/payment/verify`, 
        { txHash },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(res.data.message || '提交成功，请等待确认');
      
      // Update local user data if successful
      if (res.data.success) {
         // Re-fetch user or update local state
         const updatedUser = { ...user, isMember: true };
         localStorage.setItem('user', JSON.stringify(updatedUser));
         setUser(updatedUser);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || '验证失败，请检查交易哈希');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    maxWidth: '500px',
    textAlign: 'center'
  };

  const addressBoxStyle = {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
    margin: '20px 0',
    border: '1px solid #e9ecef',
    position: 'relative'
  };

  const copyBtnStyle = {
    background: '#0070f3',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginLeft: '10px',
    display: 'inline-block',
    marginTop: '10px'
  };

  return (
    <div style={containerStyle}>
      <Head>
        <title>升级会员 - 视频平台</title>
      </Head>
      
      <div style={{width: '100%', maxWidth: '500px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Link href="/" style={{color: '#0070f3', textDecoration: 'none'}}>← 返回首页</Link>
        {user && <span>当前状态: {user.isMember ? <span style={{color: 'green', fontWeight: 'bold'}}>尊贵会员</span> : '普通用户'}</span>}
      </div>

      <div style={cardStyle}>
        <h1 style={{fontSize: '24px', marginBottom: '20px'}}>升级会员</h1>
        
        {user?.isMember ? (
          <div style={{color: 'green', padding: '20px'}}>
            <h3>您已经是会员</h3>
            <p>享受无限观看权益</p>
          </div>
        ) : (
          <>
            <p style={{color: '#666', marginBottom: '20px'}}>
              请扫描下方二维码或复制地址支付 USDT<br/>
              <span style={{color: 'red', fontSize: '14px'}}>注意: 仅支持 {network} 网络</span>
            </p>

            <div style={{margin: '0 auto 20px', display: 'flex', justifyContent: 'center'}}>
               {address && <QRCodeCanvas value={address} size={200} />}
            </div>

            <div style={addressBoxStyle}>
              {address || '加载中...'}
              <br/>
              <button onClick={handleCopy} style={copyBtnStyle}>复制地址</button>
            </div>

            <form onSubmit={handleSubmit} style={{marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
              <div style={{textAlign: 'left', marginBottom: '10px'}}>
                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>支付完成后请输入交易哈希 (TXID):</label>
                <input 
                  type="text" 
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="请输入64位交易哈希..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {loading ? '验证中...' : '提交验证'}
              </button>
              
              {message && (
                <div style={{
                  marginTop: '15px', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  background: message.includes('成功') ? '#d4edda' : '#f8d7da',
                  color: message.includes('成功') ? '#155724' : '#721c24'
                }}>
                  {message}
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
