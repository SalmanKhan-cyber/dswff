// Auth API wrapper - calls our Cloudflare Functions instead of Supabase directly
import { supabase } from './supabase.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Sign in using our API proxy
export async function signInWithPassword(credentials) {
  try {
    console.log('🔐 Using API proxy for login...');
    
    // First try our API proxy
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    console.log('✅ API proxy login successful:', data);

    // For now, return mock data that matches Supabase format
    return {
      data: {
        user: {
          id: data.user?.id || 'mock-user-id',
          email: credentials.email,
          user_metadata: {
            role: data.user?.role || 'patient',
            name: data.user?.name || 'Test User'
          }
        },
        session: {
          access_token: data.session?.access_token || 'mock-token-' + Date.now(),
          user: {
            id: data.user?.id || 'mock-user-id',
            email: credentials.email
          }
        }
      },
      error: null
    };

  } catch (error) {
    console.error('❌ API proxy login failed, falling back to Supabase:', error);
    
    // Fallback to direct Supabase call
    return await supabase.auth.signInWithPassword(credentials);
  }
}

// Sign up using our API proxy
export async function signUp(credentials) {
  try {
    console.log('📝 Using API proxy for registration...');
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    console.log('✅ API proxy registration successful:', data);

    return {
      data: {
        user: {
          id: data.user?.id || 'mock-user-id',
          email: credentials.email,
          user_metadata: {
            role: credentials.role || 'patient',
            name: credentials.name
          }
        }
      },
      error: null
    };

  } catch (error) {
    console.error('❌ API proxy registration failed, falling back to Supabase:', error);
    
    // Fallback to direct Supabase call
    return await supabase.auth.signUp(credentials);
  }
}

// Refresh session (still use Supabase for this)
export async function refreshSession() {
  return await supabase.auth.refreshSession();
}

// Get user (still use Supabase for this)
export async function getUser() {
  return await supabase.auth.getUser();
}

// Sign out (still use Supabase for this)
export async function signOut() {
  return await supabase.auth.signOut();
}
