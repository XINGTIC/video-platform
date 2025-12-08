// Cloudflare Pages Function - Video Proxy
// 自动部署，无需手动操作

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
  };
  
  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Get parameters
  const targetUrl = url.searchParams.get('url');
  const action = url.searchParams.get('action'); // 'geturl' or 'stream'
  const referer = url.searchParams.get('referer') || 'https://h823.sol148.com/';
  
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': referer,
      'Origin': new URL(referer).origin
    };
    
    // Action: geturl - Extract video URL from page
    if (action === 'geturl') {
      const response = await fetch(targetUrl, { headers });
      const html = await response.text();
      
      // Extract video URL
      let videoUrl = null;
      
      // Method 1: strencode2
      const match = html.match(/strencode2\("([^"]+)"\)/);
      if (match) {
        const decoded = decodeURIComponent(match[1]);
        const srcMatch = decoded.match(/src='([^']+)'/);
        if (srcMatch) videoUrl = srcMatch[1];
      }
      
      // Method 2: direct src
      if (!videoUrl) {
        const srcMatch = html.match(/<source[^>]+src=['"]([^'"]+)['"]/) ||
                        html.match(/<video[^>]+src=['"]([^'"]+)['"]/);
        if (srcMatch) videoUrl = srcMatch[1];
      }
      
      return new Response(JSON.stringify({ 
        success: !!videoUrl,
        videoUrl: videoUrl 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Default: Stream video/content
    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }
    
    const response = await fetch(targetUrl, { headers });
    
    // Check if m3u8
    const contentType = response.headers.get('content-type') || '';
    const isM3u8 = targetUrl.includes('.m3u8') || contentType.includes('mpegurl');
    
    if (isM3u8) {
      let content = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const proxyBase = url.origin + '/api/video-proxy?url=';
      
      // Rewrite URLs
      const lines = content.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          if (trimmed.startsWith('#EXT-X-KEY')) {
            return trimmed.replace(/URI="([^"]+)"/, (m, uri) => {
              const abs = uri.startsWith('http') ? uri : baseUrl + uri;
              return `URI="${proxyBase}${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}"`;
            });
          }
          return line;
        }
        const abs = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
        return `${proxyBase}${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}`;
      });
      
      return new Response(lines.join('\n'), {
        headers: { ...corsHeaders, 'Content-Type': 'application/vnd.apple.mpegurl' }
      });
    }
    
    // Stream other content
    const respHeaders = new Headers(corsHeaders);
    respHeaders.set('Content-Type', response.headers.get('content-type') || 'video/mp4');
    if (response.headers.get('content-length')) {
      respHeaders.set('Content-Length', response.headers.get('content-length'));
    }
    if (response.headers.get('content-range')) {
      respHeaders.set('Content-Range', response.headers.get('content-range'));
    }
    respHeaders.set('Accept-Ranges', 'bytes');
    
    return new Response(response.body, {
      status: response.status,
      headers: respHeaders
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

