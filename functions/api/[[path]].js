// Cloudflare Pages Functions API Gateway
// Routes all /api/* requests to your backend

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  // Extract path after /api/
  const apiPath = params.path || '';
  const backendUrl = `https://dr-sanaullah-welfare-foundation.onrender.com/api/${apiPath}${url.search}`;
  
  console.log(`🔄 Proxying request to: ${backendUrl}`);
  
  try {
    // Create new request with same method, headers, and body
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Return response from backend
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
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
