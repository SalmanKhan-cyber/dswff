// Cloudflare Pages Functions API Gateway
// Routes all /api/* requests with proper error handling

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  console.log(`🔍 API Request: ${request.method} ${url.pathname}`);
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
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
  console.log(`📡 API Path: "${apiPath}"`);
  
  try {
    // Health check endpoint
    if (apiPath === 'health' || apiPath === '') {
      console.log('✅ Health check response');
      return new Response(JSON.stringify({ 
        ok: true, 
        timestamp: new Date().toISOString(),
        source: 'Cloudflare Pages Functions'
      }), {
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
      console.log(`🔐 Auth endpoint: "${authPath}"`);
      
      if (authPath === 'login' && request.method === 'POST') {
        try {
          const body = await request.json();
          console.log('📧 Login request:', { email: body.email, hasPassword: !!body.password });
          
          // Mock successful login for testing
          if (body.email && body.password) {
            console.log('✅ Login successful');
            return new Response(JSON.stringify({ 
              success: true, 
              message: 'Login successful',
              user: { 
                email: body.email, 
                name: 'Test User',
                role: 'patient',
                id: 'test-user-id'
              },
              session: {
                access_token: 'mock-token-' + Date.now(),
                user: { email: body.email }
              }
            }), {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              },
            });
          } else {
            throw new Error('Email and password are required');
          }
        } catch (error) {
          console.error('❌ Login error:', error.message);
          return new Response(JSON.stringify({ 
            error: error.message,
            success: false
          }), {
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
          const body = await request.json();
          console.log('📝 Register request:', { email: body.email, name: body.name, role: body.role });
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Registration successful',
            user: { email: body.email, name: body.name, role: body.role || 'patient' }
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          });
        } catch (error) {
          console.error('❌ Register error:', error.message);
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
    
    // Default response for unknown endpoints
    console.log(`❓ Unknown endpoint: "${apiPath}"`);
    return new Response(JSON.stringify({ 
      message: 'DSWF Backend API is running',
      status: 'ok',
      version: '1.0.0',
      endpoint: apiPath,
      availableEndpoints: ['health', 'auth/login', 'auth/register']
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      endpoint: apiPath
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
