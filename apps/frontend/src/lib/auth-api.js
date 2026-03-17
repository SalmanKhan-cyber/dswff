// Auth API wrapper - calls our Cloudflare Functions instead of Supabase directly

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Sign in using our API proxy
export async function signInWithPassword(credentials) {
  try {
    console.log('🔐 Using API proxy for login...');
    
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

    // Return data that matches Supabase format
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
    console.error('❌ API proxy login failed:', error);
    throw error;
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
    console.error('❌ API proxy registration failed:', error);
    throw error;
  }
}

// Mock refresh session - no actual Supabase calls
export async function refreshSession() {
  console.log('🔄 Mock refresh session (no Supabase)');
  return {
    data: { session: null },
    error: null
  };
}

// Mock get user - return mock data
export async function getUser() {
  console.log('👤 Mock get user (no Supabase)');
  return {
    data: { user: null },
    error: null
  };
}

// Mock sign out - no actual Supabase calls
export async function signOut() {
  console.log('🚪 Mock sign out (no Supabase)');
  return { error: null };
}
