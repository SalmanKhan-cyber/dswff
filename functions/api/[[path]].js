// Cloudflare Pages Functions API Gateway
// Routes all /api/* requests to Cloudflare Worker

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
  
  // Route to Cloudflare Worker
  if (apiPath === 'health' || apiPath === '') {
    return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  // Auth endpoints
  if (apiPath.startsWith('auth/')) {
    const authPath = apiPath.replace('auth/', '');
    
    if (authPath === 'login' && request.method === 'POST') {
      try {
        const { email, password } = await request.json();
        
        // Mock login for now - replace with actual Supabase logic
        if (email && password) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Login successful',
            user: { email, role: 'patient' }
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          });
        } else {
          throw new Error('Invalid credentials');
        }
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
    }
    
    if (authPath === 'register' && request.method === 'POST') {
      try {
        const { email, password, name, role } = await request.json();
        
        // Mock registration for now
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Registration successful',
          user: { email, name, role }
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
    }
  }
  
  // Default response
  return new Response(JSON.stringify({ 
    message: 'DSWF Backend API is running',
    status: 'ok',
    version: '1.0.0',
    endpoint: apiPath
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
