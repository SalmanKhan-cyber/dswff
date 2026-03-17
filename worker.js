// Cloudflare Worker for DSWF Backend API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qudebdejubackprbarvc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZGViZGVqdWJhY2twcmJhcnZjIiwicm9sZSI6InNlcnZpY2Utcm9sZSIsInVhdCI6MTc2MTc2NDEwMSwiZXhwIjoyMDc3MzQwMTAxfQ.S1Mlr0_RliSCTKIbaMGth4EiVRiUjmxOKwRYu6vQQ1Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Health check endpoint
async function handleHealth() {
  return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Auth endpoints
async function handleAuth(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth', '');

  if (path === '/login' && request.method === 'POST') {
    try {
      const { email, password } = await request.json();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, user: data.user, session: data.session }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  if (path === '/register' && request.method === 'POST') {
    try {
      const { email, password, name, role } = await request.json();
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { name, role } }
      });
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, user: data.user }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Route requests
    if (url.pathname === '/api/health') {
      return handleHealth();
    }
    
    if (url.pathname.startsWith('/api/auth')) {
      return handleAuth(request);
    }

    // Default response
    return new Response(JSON.stringify({ 
      message: 'DSWF Backend API is running on Cloudflare Workers',
      status: 'ok',
      version: '1.0.0'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};
