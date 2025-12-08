// Cloudflare Worker - Video Proxy
// 部署到 Cloudflare Workers 来绕过源网站的 IP 封禁

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
  }
  
  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // Get target URL from query parameter
  const targetUrl = url.searchParams.get('url')
  const referer = url.searchParams.get('referer') || 'https://h823.sol148.com/'
  
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  try {
    // Determine the type of request
    const isVideoPage = targetUrl.includes('view_video.php')
    const isM3u8 = targetUrl.includes('.m3u8')
    const isVideo = targetUrl.includes('.mp4') || targetUrl.includes('.ts')
    
    // Set up headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': referer,
      'Origin': new URL(referer).origin
    }
    
    // Forward Range header for video streaming
    const rangeHeader = request.headers.get('Range')
    if (rangeHeader) {
      headers['Range'] = rangeHeader
    }
    
    // Make request
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers
    })
    
    // If it's a video page, extract the video URL
    if (isVideoPage) {
      const html = await response.text()
      
      // Try to extract video URL from strencode2
      const match = html.match(/strencode2\("([^"]+)"\)/)
      let videoUrl = null
      
      if (match) {
        const decoded = decodeURIComponent(match[1])
        const srcMatch = decoded.match(/src='([^']+)'/)
        if (srcMatch) {
          videoUrl = srcMatch[1]
        }
      }
      
      // Fallback: try direct video/source src
      if (!videoUrl) {
        const srcMatch = html.match(/<source[^>]+src=['"]([^'"]+)['"]/) ||
                        html.match(/<video[^>]+src=['"]([^'"]+)['"]/)
        if (srcMatch) {
          videoUrl = srcMatch[1]
        }
      }
      
      return new Response(JSON.stringify({ 
        success: !!videoUrl,
        videoUrl: videoUrl,
        pageLength: html.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // For m3u8 files, rewrite URLs
    if (isM3u8 || response.headers.get('content-type')?.includes('mpegurl')) {
      let content = await response.text()
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1)
      const workerUrl = url.origin + url.pathname + '?url='
      
      // Rewrite relative URLs in m3u8
      const lines = content.split('\n')
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) {
          // Handle EXT-X-KEY URI rewriting
          if (trimmed.startsWith('#EXT-X-KEY')) {
            return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
              const absoluteUri = uri.startsWith('http') ? uri : baseUrl + uri
              return `URI="${workerUrl}${encodeURIComponent(absoluteUri)}&referer=${encodeURIComponent(referer)}"`
            })
          }
          return line
        }
        // Rewrite segment URLs
        const absoluteUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed
        return `${workerUrl}${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`
      })
      
      return new Response(rewrittenLines.join('\n'), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache'
        }
      })
    }
    
    // For video files, stream through
    const responseHeaders = new Headers(corsHeaders)
    responseHeaders.set('Content-Type', response.headers.get('content-type') || 'video/mp4')
    
    if (response.headers.get('content-length')) {
      responseHeaders.set('Content-Length', response.headers.get('content-length'))
    }
    if (response.headers.get('content-range')) {
      responseHeaders.set('Content-Range', response.headers.get('content-range'))
    }
    responseHeaders.set('Accept-Ranges', 'bytes')
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

