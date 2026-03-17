// Cloudflare Pages Functions API Gateway
// Routes all /api/* requests to your backend

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // Extract path after /api/
  const apiPath = params.path || '';
  const backendUrl = `https://dr-sanaullah-welfare-foundation.onrender.com/api/${apiPath}${url.search}`;
  
  console.log(`🔄 Proxying ${request.method} to: ${backendUrl}`);
  
  try {
    // Create headers object
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      headers[key] = value;
    }
    
    // Create new request with same method, headers, and body
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });
    
    // Create response headers
    const responseHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      responseHeaders[key] = value;
    }
    
    // Add CORS headers
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    // Return response from backend
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return new Response(JSON.stringify({
      error: 'Backend proxy error',
      message: error.message,
      backend: 'https://dr-sanaullah-welfare-foundation.onrender.com'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}
