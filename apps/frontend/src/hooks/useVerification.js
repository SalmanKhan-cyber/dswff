import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../lib/api';
// Mock supabase to prevent DNS errors
const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: { access_token: 'mock-token' } } })
  }
};

/**
 * Hook to check user verification status
 * Returns { verified, checking, userInfo }
 * Redirects to pending approval if not verified (except patients, donors, labs, pharmacy, blood_bank)
 */
export function useVerification(role = null) {
	const [verified, setVerified] = useState(null);
	const [checking, setChecking] = useState(true);
	const [userInfo, setUserInfo] = useState(null);
	const navigate = useNavigate();
	const location = useLocation();

	// Roles that don't need approval (can access immediately)
	const NO_APPROVAL_ROLES = ['patient', 'donor', 'lab', 'pharmacy', 'blood_bank'];

	useEffect(() => {
		checkVerification();
	}, [location.pathname]); // Re-check when route changes

	async function checkVerification() {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				navigate('/login');
				return;
			}

			// Get user verification status
			try {
				const userRes = await apiRequest('/api/users/me');
				
				if (userRes.user) {
					setUserInfo(userRes.user);
					const userRole = userRes.user.role;
					const isVerified = userRes.user.verified;
					
					console.log(`🔍 User verification check: role=${userRole}, verified=${isVerified}`);
					
					// CORRECT LOGIC: Check user role and approval status
					if (userRole === 'admin') {
						console.log('✅ Admin user - allowing access to admin dashboard');
						setVerified(true);
						setChecking(false);
						return;
					}
					
					// CORRECT LOGIC: Check if user is pending approval
					if (!isVerified && !NO_APPROVAL_ROLES.includes(userRole)) {
						console.log(`⚠️ User role ${userRole} is pending approval. Redirecting to waiting page.`);
						setVerified(false);
						setChecking(false);
						navigate('/pending-approval');
						return;
					}
					
					// CORRECT LOGIC: Approved users can access their dashboard
					if (isVerified) {
						console.log(`✅ Approved user - allowing access to ${userRole} dashboard`);
						setVerified(true);
						setChecking(false);
						return;
					}
					
					// CORRECT LOGIC: Roles that don't need approval
					if (NO_APPROVAL_ROLES.includes(userRole)) {
						console.log(`✅ User role ${userRole} doesn't need approval. Allowing access.`);
						setVerified(true);
						setChecking(false);
						return;
					}
					
					// CORRECT LOGIC: If we get here, user is not verified and needs approval
					console.log(`⚠️ User role ${userRole} requires approval but is not verified. Redirecting to waiting page.`);
					setVerified(false);
					setChecking(false);
					navigate('/pending-approval');
				}
			} catch (err) {
				console.error('Failed to check verification:', err);
				// If API fails, redirect to login for security
				navigate('/login');
			}
		} catch (err) {
			console.error('Failed to get user:', err);
			navigate('/login');
		} finally {
			setChecking(false);
		}
	}

	return { verified, checking, userInfo, checkVerification };
}

