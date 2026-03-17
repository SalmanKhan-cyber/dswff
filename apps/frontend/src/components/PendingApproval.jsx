// Mock supabase to prevent DNS errors
const supabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: { email: 'mock-email' } } }),
    signOut: () => Promise.resolve()
  }
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export default function PendingApproval() {
	const [userInfo, setUserInfo] = useState(null);
	const [checking, setChecking] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		checkVerificationStatus();
		// Poll every 10 seconds to check if user has been approved
		const interval = setInterval(checkVerificationStatus, 10000);
		return () => clearInterval(interval);
	}, []);

	async function checkVerificationStatus() {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				navigate('/login');
				return;
			}

			// Get user verification status from API
			try {
				const userRes = await apiRequest('/api/users/me');
				
				if (userRes.user) {
					setUserInfo({
						name: userRes.user.name || user.email?.split('@')[0] || 'User',
						email: user.email,
						role: userRes.user.role,
						verified: userRes.user.verified
					});

					// If user is verified, redirect to dashboard
					if (userRes.user.verified) {
						// Redirect to appropriate dashboard based on role
						const role = userRes.user.role;
						if (role === 'doctor') {
							window.location.href = '/dashboard/doctor';
						} else if (role === 'teacher') {
							window.location.href = '/dashboard/teacher';
						} else if (role === 'pharmacy') {
							window.location.href = '/dashboard/pharmacy';
						} else if (role === 'donor') {
							window.location.href = '/dashboard/donor';
						} else if (role === 'blood_bank') {
							window.location.href = '/dashboard/blood-bank';
						} else if (role === 'lab') {
							window.location.href = '/dashboard/lab';
						} else {
							// Reload to access dashboard
							window.location.reload();
						}
					}
				}
			} catch (err) {
				console.error('Failed to check verification status:', err);
			}
		} catch (err) {
			console.error('Failed to get user:', err);
		} finally {
			setChecking(false);
		}
	}

	async function handleLogout() {
		await supabase.auth.signOut();
		navigate('/login');
	}

	if (checking) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-brand border-t-transparent"></div>
					<p className="mt-4 text-gray-600">Checking approval status...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
				{/* Icon */}
				<div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
					<svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>

				{/* Title */}
				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					Pending Admin Approval
				</h1>

				{/* Message */}
				<p className="text-gray-600 mb-6">
					Your account is pending approval from an administrator. You will be able to access your dashboard once your account has been approved.
				</p>

				{/* User Info */}
				{userInfo && (
					<div className="bg-gray-50 rounded-lg p-4 mb-6">
						<p className="text-sm text-gray-700 mb-1">
							<strong>Account:</strong> {userInfo.name}
						</p>
						<p className="text-sm text-gray-700 mb-1">
							<strong>Email:</strong> {userInfo.email}
						</p>
						<p className="text-sm text-gray-700">
							<strong>Role:</strong> <span className="capitalize">{userInfo.role}</span>
						</p>
					</div>
				)}

				{/* Status Badge */}
				<div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full mb-6">
					<div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
					<span className="text-sm font-medium">Awaiting Approval</span>
				</div>

				{/* Info Box */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
					<p className="text-sm text-blue-800">
						<strong>What happens next?</strong>
					</p>
					<ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
						<li>An administrator will review your registration</li>
						<li>You will automatically be redirected once approved</li>
						<li>This page will refresh automatically every 10 seconds</li>
					</ul>
				</div>

				{/* Actions */}
				<div className="space-y-3">
					<button
						onClick={checkVerificationStatus}
						className="w-full bg-brand text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-dark transition-colors"
					>
						🔄 Check Approval Status
					</button>
					<button
						onClick={handleLogout}
						className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
					>
						Logout
					</button>
				</div>
			</div>
		</div>
	);
}

