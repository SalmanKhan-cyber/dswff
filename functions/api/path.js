export async function onRequest(context) {
  const { request, env, params } = context;
  const path = params.path || '';
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`API Path: ${path}`);

  if (path === 'health') {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Auth endpoints
  if (path.startsWith('auth/')) {
    const authPath = path.replace('auth/', '');
    
    if (authPath === 'login' && request.method === 'POST') {
      try {
        const body = await request.json();
        return new Response(JSON.stringify({
          success: true,
          user: { id: 'mock-user-id', email: body.email, role: 'patient' },
          session: { access_token: 'mock-token-' + Date.now() }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (authPath === 'user-roles') {
      return new Response(JSON.stringify({
        roles: ['patient', 'doctor', 'admin']
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Public endpoints
  if (path === 'doctors/public') {
    return new Response(JSON.stringify({
      doctors: [
        { id: '1', name: 'Dr. Test Doctor', specialization: 'General Practice' },
        { id: '2', name: 'Dr. Sample Doctor', specialization: 'Cardiology' }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === 'conditions/public') {
    return new Response(JSON.stringify({
      conditions: [
        { id: '1', name: 'Hypertension', description: 'High blood pressure' },
        { id: '2', name: 'Diabetes', description: 'Blood sugar disorder' }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === 'specialties/public') {
    return new Response(JSON.stringify({
      specialties: [
        { id: '1', name: 'General Practice' },
        { id: '2', name: 'Cardiology' },
        { id: '3', name: 'Neurology' }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    message: 'API endpoint', path, method: request.method
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
