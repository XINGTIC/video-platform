import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://video-platform-3v33.onrender.com/api';
const FALLBACK_ADDRESS = 'TFdSk3jPR3XysH3AhYMXyHioSE6nH8pj3L';

const PLANS = [
  { id: 'monthly', name: '月度会员', priceCNY: 19, priceUSDT: 2.6, days: 30 },
  { id: 'quarterly', name: '季度会员', priceCNY: 49, priceUSDT: 6.8, days: 90, recommend: true },
  { id: 'yearly', name: '年度会员', priceCNY: 199, priceUSDT: 27.3, days: 365 },
];

export default function Membership() {
  const [address, setAddress] = useState(FALLBACK_ADDRESS);
  const [network, setNetwork] = useState('TRON (TRC20)');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]); // Default to quarterly
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

    // Fetch config (try to get latest, otherwise use fallback)
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_URL}/payment/config`);
      if (res.data.address) setAddress(res.data.address);
      if (res.data.network) setNetwork(res.data.network);
    } catch (err) {
      console.log('Using fallback config');
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
        { 
          txHash,
          planType: selectedPlan.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(res.data.message || '提交成功，请等待确认');
      
      // Update local user data if successful
      if (res.data.success) {
         const updatedUser = { ...user, isMember: true };
         localStorage.setItem('user', JSON.stringify(updatedUser));
         setUser(updatedUser);
         setTimeout(() => window.location.reload(), 2000);
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
    maxWidth: '800px', // Wider for plans
    textAlign: 'center'
  };

  const planContainerStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '15px',
    margin: '20px 0'
  };

  const getPlanStyle = (plan) => ({
    border: selectedPlan.id === plan.id ? '2px solid #0070f3' : '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    width: '30%',
    minWidth: '140px',
    cursor: 'pointer',
    background: selectedPlan.id === plan.id ? '#f0f9ff' : 'white',
    position: 'relative',
    transition: 'all 0.2s'
  });

  return (
    <div style={containerStyle}>
      <Head>
        <title>升级会员 - 视频平台</title>
      </Head>
      
      <div style={{width: '100%', maxWidth: '800px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Link href="/" style={{color: '#0070f3', textDecoration: 'none'}}>← 返回首页</Link>
        {user && <span>当前状态: {user.isMember ? <span style={{color: 'green', fontWeight: 'bold'}}>尊贵会员</span> : '普通用户'}</span>}
      </div>

      <div style={cardStyle}>
        <h1 style={{fontSize: '24px', marginBottom: '10px'}}>选择会员套餐</h1>
        <p style={{color: '#666', marginBottom: '30px'}}>开通会员，畅享无限观看</p>
        
        {/* Plan Selection */}
        <div style={planContainerStyle}>
            {PLANS.map(plan => (
                <div 
                    key={plan.id} 
                    style={getPlanStyle(plan)}
                    onClick={() => setSelectedPlan(plan)}
                >
                    {plan.recommend && (
                        <div style={{
                            position: 'absolute', top: '-10px', right: '-10px', 
                            background: '#ff4d4f', color: 'white', 
                            fontSize: '12px', padding: '2px 8px', borderRadius: '10px'
                        }}>
                            推荐
                        </div>
                    )}
                    <h3 style={{margin: '10px 0', color: '#333'}}>{plan.name}</h3>
                    <div style={{fontSize: '20px', fontWeight: 'bold', color: '#0070f3'}}>
                        {plan.priceUSDT} USDT
                    </div>
                    <div style={{fontSize: '12px', color: '#999', textDecoration: 'line-through'}}>
                        ¥{plan.priceCNY}
                    </div>
                </div>
            ))}
        </div>

        <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '30px 0'}} />

        {user?.isMember ? (
          <div style={{color: 'green', padding: '20px'}}>
            <h3>您已经是会员</h3>
            <p>有效期至: {user.memberExpireDate ? new Date(user.memberExpireDate).toLocaleDateString() : '永久'}</p>
            <p style={{fontSize: '14px', color: '#666'}}>您可以继续充值延长有效期</p>
          </div>
        ) : null}

        <div style={{textAlign: 'left', background: '#f8f9fa', padding: '20px', borderRadius: '8px'}}>
            <h3 style={{marginTop: 0, fontSize: '18px'}}>支付详情</h3>
            <p>应付金额: <span style={{color: '#d32f2f', fontWeight: 'bold', fontSize: '20px'}}>{selectedPlan.priceUSDT} USDT</span></p>
            <p style={{fontSize: '14px'}}>请扫描下方二维码或复制地址支付</p>
            <p style={{color: 'red', fontSize: '14px', fontWeight: 'bold'}}>注意: 仅支持 {network} 网络</p>

            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0'}}>
               {address ? (
                   <QRCodeCanvas value={address} size={180} />
               ) : (
                   <div style={{width: 180, height: 180, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                       加载中...
                   </div>
               )}
               
               <div style={{
                   background: 'white', border: '1px solid #ddd', padding: '10px', 
                   marginTop: '15px', borderRadius: '4px', wordBreak: 'break-all',
                   fontFamily: 'monospace', display: 'flex', alignItems: 'center'
               }}>
                   {address}
                   <button onClick={handleCopy} style={{
                       marginLeft: '10px', background: 'none', border: '1px solid #ddd', 
                       borderRadius: '4px', padding: '2px 8px', cursor: 'pointer'
                   }}>复制</button>
               </div>
            </div>

            <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
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
                  fontSize: '14px',
                  marginBottom: '15px'
                }}
                required
              />
              
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
            </form>
            
            {message && (
                <div style={{
                  marginTop: '15px', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  background: message.includes('成功') ? '#d4edda' : '#f8d7da',
                  color: message.includes('成功') ? '#155724' : '#721c24',
                  textAlign: 'center'
                }}>
                  {message}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
