import { useState, useEffect } from 'react';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function HomeServices() {
	const [serviceType, setServiceType] = useState('doctor');
	const [doctors, setDoctors] = useState([]);
	const [labs, setLabs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [user, setUser] = useState(null);
	
	const [formData, setFormData] = useState({
		doctor_id: '',
		lab_id: '',
		patient_name: '',
		patient_phone: '',
		patient_email: '',
		address: '',
		city: '',
		preferred_date: '',
		preferred_time: '',
		urgency: 'normal',
		description: ''
	});

	useEffect(() => {
		checkUser();
		fetchDoctors();
		fetchLabs();
	}, []);

	useEffect(() => {
		// Reset selected doctor/lab when service type changes
		setFormData(prev => ({
			...prev,
			doctor_id: '',
			lab_id: ''
		}));
	}, [serviceType]);

	const checkUser = async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (user) {
			setUser(user);
			// Pre-fill form if user is logged in
			const { data: profile } = await supabase
				.from('users')
				.select('name, email, phone')
				.eq('id', user.id)
				.single();
			
			if (profile) {
				setFormData(prev => ({
					...prev,
					patient_name: profile.name || '',
					patient_email: profile.email || '',
					patient_phone: profile.phone || ''
				}));
			}
		}
	};

	const fetchDoctors = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_URL}/api/home-services/doctors`);
			const data = await response.json();
			if (data.doctors) {
				setDoctors(data.doctors);
			}
		} catch (error) {
			console.error('Error fetching doctors:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchLabs = async () => {
		try {
			const response = await fetch(`${API_URL}/api/home-services/labs`);
			const data = await response.json();
			if (data.labs) {
				setLabs(data.labs);
			}
		} catch (error) {
			console.error('Error fetching labs:', error);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Validate required fields
		if (!formData.patient_name || !formData.patient_phone || !formData.address) {
			alert('Please fill in all required fields');
			return;
		}
		
		if (serviceType === 'doctor' && !formData.doctor_id) {
			alert('Please select a doctor');
			return;
		}
		
		if (serviceType === 'lab_test' && !formData.lab_id) {
			alert('Please select a lab');
			return;
		}

		setSubmitting(true);
		
		try {
			// Get auth token if user is logged in
			const { data: { session } } = await supabase.auth.getSession();
			const headers = {
				'Content-Type': 'application/json'
			};
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`;
			}

			const response = await fetch(`${API_URL}/api/home-services/request`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					service_type: serviceType,
					...formData
				})
			});

			const data = await response.json();
			
			if (response.ok) {
				setSubmitted(true);
				setFormData({
					doctor_id: '',
					lab_id: '',
					patient_name: '',
					patient_phone: '',
					patient_email: '',
					address: '',
					city: '',
					preferred_date: '',
					preferred_time: '',
					urgency: 'normal',
					description: ''
				});
			} else {
				alert(data.error || 'Failed to submit request');
			}
		} catch (error) {
			console.error('Error submitting request:', error);
			alert('Failed to submit request. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	const serviceTypes = [
		{ value: 'doctor', label: '👨‍⚕️ Doctor Consultation', description: 'Get a doctor to visit your home' },
		{ value: 'nurse', label: '👩‍⚕️ Nurse Care', description: 'Professional nursing care at home' },
		{ value: 'lab_test', label: '🧪 Lab Test', description: 'Lab tests and sample collection at home' },
		{ value: 'phlebotomist', label: '🩸 Blood Sample Collection', description: 'Professional blood sample collection' },
		{ value: 'physiotherapist', label: '💪 Physiotherapy', description: 'Physical therapy sessions at home' },
		{ value: 'other', label: '🏥 Other Service', description: 'Other medical services at home' }
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			{/* Hero Section */}
			<div className="bg-gradient-to-r from-brand to-brand-dark text-white py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl md:text-5xl font-bold mb-4">Home Healthcare Services</h1>
						<p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
							Professional medical care delivered to your doorstep
						</p>
					</div>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{submitted ? (
					<div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
						<div className="text-6xl mb-4">✅</div>
						<h2 className="text-2xl font-bold text-green-900 mb-2">Request Submitted!</h2>
						<p className="text-green-700 mb-6 text-lg font-semibold">
							You will be contacted soon to confirm your appointment.
						</p>
						<p className="text-green-600 mb-6">
							Our team will review your request and get back to you shortly.
						</p>
						<button
							onClick={() => {
								setSubmitted(false);
								setServiceType('doctor');
							}}
							className="inline-block bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition-colors"
						>
							Request Another Service
						</button>
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Request Home Service</h2>
						
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Service Type Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-3">
									Service Type <span className="text-red-500">*</span>
								</label>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{serviceTypes.map((type) => (
										<button
											key={type.value}
											type="button"
											onClick={() => setServiceType(type.value)}
											className={`p-4 rounded-lg border-2 text-left transition-all ${
												serviceType === type.value
													? 'border-brand bg-brand/10'
													: 'border-gray-200 hover:border-brand/50'
											}`}
										>
											<div className="font-semibold text-gray-900">{type.label}</div>
											<div className="text-sm text-gray-600 mt-1">{type.description}</div>
										</button>
									))}
								</div>
							</div>

							{/* Doctor Selection (for doctor service) */}
							{serviceType === 'doctor' && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Select Doctor <span className="text-red-500">*</span>
									</label>
									{loading ? (
										<p className="text-gray-500">Loading doctors...</p>
									) : doctors.length === 0 ? (
										<p className="text-yellow-600">No doctors offering home services at the moment.</p>
									) : (
										<select
											required
											value={formData.doctor_id}
											onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
										>
											<option value="">Select a doctor...</option>
											{doctors.map((doctor) => (
												<option key={doctor.id} value={doctor.id}>
													{doctor.name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
												</option>
											))}
										</select>
									)}
								</div>
							)}

							{/* Lab Selection (for lab_test service) */}
							{serviceType === 'lab_test' && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Select Lab <span className="text-red-500">*</span>
									</label>
									{labs.length === 0 ? (
										<p className="text-yellow-600">No labs offering home services at the moment.</p>
									) : (
										<select
											required
											value={formData.lab_id}
											onChange={(e) => setFormData({ ...formData, lab_id: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
										>
											<option value="">Select a lab...</option>
											{labs.map((lab) => (
												<option key={lab.id} value={lab.id}>
													{lab.name} {lab.location ? `- ${lab.location}` : ''}
												</option>
											))}
										</select>
									)}
								</div>
							)}

							{/* Patient Information */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Full Name <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										required
										value={formData.patient_name}
										onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Phone Number <span className="text-red-500">*</span>
									</label>
									<input
										type="tel"
										required
										value={formData.patient_phone}
										onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email
								</label>
								<input
									type="email"
									value={formData.patient_email}
									onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								/>
							</div>

							{/* Address */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Complete Address <span className="text-red-500">*</span>
								</label>
								<textarea
									rows={3}
									required
									value={formData.address}
									onChange={(e) => setFormData({ ...formData, address: e.target.value })}
									placeholder="House number, street, area..."
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										City
									</label>
									<input
										type="text"
										value={formData.city}
										onChange={(e) => setFormData({ ...formData, city: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Preferred Date
									</label>
									<input
										type="date"
										value={formData.preferred_date}
										onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
										min={new Date().toISOString().split('T')[0]}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Preferred Time
									</label>
									<input
										type="time"
										value={formData.preferred_time}
										onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Urgency Level
								</label>
								<select
									value={formData.urgency}
									onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								>
									<option value="normal">Normal</option>
									<option value="urgent">Urgent</option>
									<option value="emergency">Emergency</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Additional Details / Description
								</label>
								<textarea
									rows={4}
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									placeholder="Please provide any additional information about the service needed..."
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								/>
							</div>

							<button
								type="submit"
								disabled={submitting}
								className="w-full bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{submitting ? 'Submitting...' : 'Submit Request'}
							</button>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}


