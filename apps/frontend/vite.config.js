import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
	// Dynamic API URL based on mode
	const apiUrl = mode === 'development' 
		? 'http://localhost:4000'
		: 'https://api.drsanaullahwelfarefoundation.com';

	return {
		plugins: [react()],
		define: {
			// Expose environment variables to client
			'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiUrl),
			// Also define process.env for fallback
			'process.env.VITE_API_BASE_URL': JSON.stringify(apiUrl),
		},
		// Add proxy for development
		server: {
			port: 5173,
			host: '0.0.0.0',
			proxy: {
				'/api': {
					target: apiUrl,
					changeOrigin: true,
					secure: true
				}
			}
		}
	};
});
