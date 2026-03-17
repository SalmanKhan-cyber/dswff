// Supabase client - DISABLED to prevent DNS resolution errors
// All auth calls now go through our API proxy

// Mock supabase object to prevent initialization errors
export const supabase = {
  auth: {
    signInWithPassword: () => Promise.reject(new Error('Use auth-api.js instead')),
    signUp: () => Promise.reject(new Error('Use auth-api.js instead')),
    signOut: () => Promise.reject(new Error('Use auth-api.js instead')),
    refreshSession: () => Promise.reject(new Error('Use auth-api.js instead')),
    getUser: () => Promise.reject(new Error('Use auth-api.js instead')),
    getSession: () => Promise.reject(new Error('Use auth-api.js instead')),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    })
  }),
  storage: {
    from: () => ({
      upload: () => Promise.reject(new Error('Storage not available')),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};

// Disable console logs
console.log('🔇 Supabase client disabled - using API proxy instead');
