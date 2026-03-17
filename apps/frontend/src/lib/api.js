// Dynamic API URL configuration based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'development' 
    ? 'http://localhost:4000' 
    : '/api');

// Debug log to verify API URL
console.log('🔍 API URL being used:', API_BASE_URL);

// Simple in-memory cache for API responses (10 minute TTL for better performance)
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes - increased for better performance

function getCacheKey(endpoint, options) {
	return `${endpoint}:${JSON.stringify(options || {})}`;
}

function getCached(key) {
	const cached = cache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}
	cache.delete(key);
	return null;
}

function setCache(key, data) {
	cache.set(key, { data, timestamp: Date.now() });
}

// Clean old cache entries periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, value] of cache.entries()) {
		if (now - value.timestamp >= CACHE_TTL) {
			cache.delete(key);
		}
	}
}, CACHE_TTL);

// Export function to clear cache for specific endpoint
export function clearCache(endpoint) {
	if (endpoint) {
		// Clear all cache entries that match the endpoint
		for (const key of cache.keys()) {
			if (key.startsWith(endpoint)) {
				cache.delete(key);
			}
		}
		console.log(`🗑️ Cleared cache for: ${endpoint}`);
	} else {
		// Clear all cache
		cache.clear();
		console.log('🗑️ Cleared all cache');
	}
}

async function getAuthHeaders() {
	// Mock session - no real Supabase calls
	console.log('� Using mock auth headers');
	return {
		'Content-Type': 'application/json'
	};
}

// Request deduplication - prevent multiple identical requests
const pendingRequests = new Map();

export async function apiRequest(endpoint, options = {}, retryCount = 0) {
	const maxRetries = 1;
	
	// Skip cache for POST, PUT, DELETE, or if explicitly disabled
	const shouldCache = !options.method || (options.method === 'GET' && !options.noCache);
	const cacheKey = shouldCache ? getCacheKey(endpoint, options) : null;
	
	// Check cache first for GET requests
	if (shouldCache && cacheKey) {
		const cached = getCached(cacheKey);
		if (cached) {
			console.log(`💾 Cache hit for: ${endpoint}`);
			return cached;
		}
	}
	
	// Request deduplication - if same request is pending, return the same promise
	const requestKey = `${endpoint}:${JSON.stringify(options)}`;
	if (pendingRequests.has(requestKey)) {
		console.log(`⏳ Request already pending: ${endpoint}, reusing...`);
		return pendingRequests.get(requestKey);
	}
	
	// Create request promise
	const requestPromise = (async () => {
		try {
			// No session check - use mock auth
			console.log('🔐 Using mock authentication');
			
			const authHeaders = await getAuthHeaders();
			// If body is FormData, don't set Content-Type (browser will set it with boundary)
			const isFormData = options.body instanceof FormData;
			const headers = isFormData 
				? { ...authHeaders, ...options.headers }
				: { ...authHeaders, ...options.headers };
			
			// Remove Content-Type for FormData
			if (isFormData && headers['Content-Type']) {
				delete headers['Content-Type'];
			}
			
			// Stringify body if it's an object and not FormData
			let body = options.body;
			if (body && !isFormData && typeof body === 'object') {
				body = JSON.stringify(body);
			}
			
			console.log('🔍 Making request to:', `${API_BASE_URL}${endpoint}`);
			console.log('🔍 Request method:', options.method || 'GET');
			console.log('🔍 Request headers:', headers);
			console.log('🔍 Request body:', body);
			
			const response = await fetch(`${API_BASE_URL}${endpoint}`, {
				...options,
				body,
				headers
			});
			
			console.log('🔍 Response status:', response.status);
			console.log('🔍 Response ok:', response.ok);
			
			// No 401 retry logic - just handle the response
			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Request failed' }));
				const errorObj = new Error(error.error || response.statusText);
				errorObj.status = response.status; // Preserve status code
				throw errorObj;
			}
			
			const data = await response.json();
			
			// Cache successful GET responses
			if (shouldCache && cacheKey && response.ok) {
				setCache(cacheKey, data);
			}
			
			return data;
		} catch (err) {
			// No retry logic - just throw the error
			console.error('❌ API request failed:', err);
			throw err;
		} finally {
			// Remove from pending requests
			pendingRequests.delete(requestKey);
		}
	})();
	
	// Store pending request
	pendingRequests.set(requestKey, requestPromise);
	
	return requestPromise;
}

export async function uploadFile(endpoint, file, additionalData = {}) {
	// Mock session - no real Supabase calls
	console.log('📤 Using mock file upload');
	const formData = new FormData();
	formData.append('file', file);
	Object.entries(additionalData).forEach(([key, value]) => {
		formData.append(key, value);
	});
	
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		method: 'POST',
		body: formData
	});
	
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Upload failed' }));
		throw new Error(error.error || response.statusText);
	}
	
	return response.json();
}

