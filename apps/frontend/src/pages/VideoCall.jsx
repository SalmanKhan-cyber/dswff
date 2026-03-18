import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
// Mock supabase to prevent DNS errors
const supabase = {
  auth: {
    signInWithPassword: () => Promise.reject(new Error('Use auth-api.js instead')),
    getSession: () => Promise.resolve({ data: { session: { access_token: 'mock-token' } } }),
    refreshSession: () => Promise.resolve({ data: { session: { access_token: 'mock-token' } } }),
    signOut: () => Promise.resolve()
  }
};

export default function VideoCall() {
	const { appointmentId } = useParams();
	const navigate = useNavigate();
	const [appointment, setAppointment] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [roomName, setRoomName] = useState('');
	const [userName, setUserName] = useState('');

	useEffect(() => {
		fetchAppointment();
	}, [appointmentId]);

	async function fetchAppointment() {
		try {
			// Try patient appointments first
			let res;
			try {
				res = await apiRequest(`/api/appointments/patient/me`);
				if (res.appointments) {
					const appointmentData = res.appointments.find(apt => apt.id === appointmentId);
					if (appointmentData) {
						processAppointment(appointmentData, 'patient');
						return;
					}
				}
			} catch (patientErr) {
				// If patient endpoint fails, try doctor endpoint
			}
			
			// Try doctor appointments
			try {
				res = await apiRequest(`/api/appointments/doctor/me`);
				if (res.appointments) {
					const appointmentData = res.appointments.find(apt => apt.id === appointmentId);
					if (appointmentData) {
						processAppointment(appointmentData, 'doctor');
						return;
					}
				}
			} catch (doctorErr) {
				// Both failed
			}
			
			setError('Appointment not found');
		} catch (err) {
			setError(err.message || 'Failed to load appointment details');
		} finally {
			setLoading(false);
		}
	}

	async function processAppointment(appointmentData, role) {
		if (!appointmentData.video_call_link) {
			setError('Video call link not available. Please contact support or wait for the appointment to be confirmed.');
			setAppointment(appointmentData);
			return;
		}

		setAppointment(appointmentData);
		
		// Extract room name from Jitsi URL (e.g., https://meet.jit.si/Foundation-Appointment-abc123)
		const url = appointmentData.video_call_link;
		const roomNameFromUrl = url.split('/').pop();
		setRoomName(roomNameFromUrl);
		
		// Get user name from auth
		const { data: { user } } = await supabase.auth.getUser();
		if (role === 'doctor') {
			setUserName(appointmentData.doctors?.name || user?.user_metadata?.name || 'Doctor');
		} else {
			setUserName(appointmentData.patients?.users?.name || user?.user_metadata?.name || 'Patient');
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent mb-4"></div>
					<p className="text-gray-600">Loading video call...</p>
				</div>
			</div>
		);
	}

	if (error && !appointment?.video_call_link) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
					<div className="text-6xl mb-4">⚠️</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Cannot Join Video Call</h2>
					<p className="text-gray-600 mb-6">{error}</p>
					<button
						onClick={() => navigate('/dashboard/patient')}
						className="bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark"
					>
						Back to Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			{/* Header */}
			<div className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Video Consultation</h1>
							{appointment?.doctors?.name && (
								<p className="text-gray-600 text-sm mt-1">
									With Dr. {appointment.doctors.name} - {appointment.doctors.specialization}
								</p>
							)}
							{appointment?.patients?.users?.name && (
								<p className="text-gray-600 text-sm mt-1">
									Patient: {appointment.patients.users.name}
								</p>
							)}
						</div>
						<button
							onClick={() => {
								// Navigate to appropriate dashboard based on user role
								const userRole = appointment?.doctors?.user_id ? 'doctor' : 'patient';
								navigate(`/dashboard/${userRole}`);
							}}
							className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
						>
							Leave Call
						</button>
					</div>
				</div>
			</div>

			{/* Video Call Container */}
			<div className="max-w-7xl mx-auto px-4 py-6">
				{appointment?.video_call_link && roomName ? (
					<div className="bg-white rounded-2xl shadow-xl overflow-hidden">
						{/* Jitsi Meet Iframe - Full height */}
						<div className="w-full" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
							<iframe
								src={`https://meet.jit.si/${roomName}?userInfo.displayName=${encodeURIComponent(userName)}&interfaceConfig.APP_NAME=Foundation Consultation&config.startWithVideoMuted=false&config.startWithAudioMuted=false`}
								allow="camera; microphone; fullscreen; speaker; display-capture"
								style={{
									width: '100%',
									height: '100%',
									border: 'none'
								}}
								title="Video Consultation"
							/>
						</div>
					</div>
				) : (
					<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
						<div className="text-6xl mb-4">📹</div>
						<h2 className="text-2xl font-bold text-gray-900 mb-4">Video Call Not Ready</h2>
						<p className="text-gray-600 mb-6">
							The video call link will be available once your appointment is confirmed by the doctor.
						</p>
						<button
							onClick={() => navigate('/dashboard/patient')}
							className="bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark"
						>
							Back to Dashboard
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

