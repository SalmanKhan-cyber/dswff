import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function ConsultOnline() {
	const navigate = useNavigate();
	const [doctors, setDoctors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedSpecialty, setSelectedSpecialty] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedDoctor, setSelectedDoctor] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [hasPatientProfile, setHasPatientProfile] = useState(false);
	const [checkingProfile, setCheckingProfile] = useState(false);
	const [appointmentForm, setAppointmentForm] = useState({
		appointment_date: '',
		appointment_time: '',
		reason: ''
	});
	const [patientProfileForm, setPatientProfileForm] = useState({
		name: '',
		phone: '',
		age: '',
		gender: 'male',
		cnic: '',
		history: ''
	});
	const [bookingLoading, setBookingLoading] = useState(false);
	const [showProfileForm, setShowProfileForm] = useState(false);

	useEffect(() => {
		fetchDoctors();
		checkAuth();
	}, []);

	useEffect(() => {
		if (isAuthenticated && selectedDoctor) {
			checkPatientProfile();
		}
	}, [isAuthenticated, selectedDoctor]);

	async function checkAuth() {
		const { data: { session } } = await supabase.auth.getSession();
		setIsAuthenticated(!!session);
	}

	async function checkPatientProfile() {
		setCheckingProfile(true);
		setShowProfileForm(false);
		try {
			const res = await apiRequest('/api/patients/me');
			// Check if profile exists and has required fields
			if (res.profile && res.profile.user_id) {
				// Verify profile has minimum required fields
				const hasRequiredFields = res.profile.name && res.profile.phone && res.profile.age && res.profile.gender && res.profile.cnic;
				if (hasRequiredFields) {
					setHasPatientProfile(true);
					setPatientProfileForm({
						name: res.profile.name || '',
						phone: res.profile.phone || '',
						age: res.profile.age || '',
						gender: res.profile.gender || 'male',
						cnic: res.profile.cnic || '',
						history: res.profile.history || ''
					});
				} else {
					// Profile exists but incomplete
					console.log('⚠️ Profile exists but incomplete:', res.profile);
					setHasPatientProfile(false);
					setShowProfileForm(true);
					// Pre-fill form with existing data
					setPatientProfileForm({
						name: res.profile.name || '',
						phone: res.profile.phone || '',
						age: res.profile.age || '',
						gender: res.profile.gender || 'male',
						cnic: res.profile.cnic || '',
						history: res.profile.history || ''
					});
				}
			} else {
				setHasPatientProfile(false);
				setShowProfileForm(true);
			}
		} catch (err) {
			console.error('Error checking patient profile:', err);
			setHasPatientProfile(false);
			setShowProfileForm(true);
		} finally {
			setCheckingProfile(false);
		}
	}

	async function fetchDoctors() {
		try {
			const { data, error } = await supabase
				.from('doctors')
				.select('*')
				.order('name', { ascending: true });
			
			if (!error) {
				setDoctors(data || []);
			}
		} catch (err) {
			console.error('Error fetching doctors:', err);
		} finally {
			setLoading(false);
		}
	}

	const specialties = ['All', ...new Set(doctors.map(d => d.specialization))].filter(Boolean);

	const filteredDoctors = doctors.filter(doctor => {
		const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesSpecialty = selectedSpecialty === 'All' || !selectedSpecialty || doctor.specialization === selectedSpecialty;
		return matchesSearch && matchesSpecialty;
	});

	const getSpecialtyIcon = (specialty) => {
		const icons = {
			'Cardiologist': '❤️',
			'Dermatologist': '👋',
			'Gynecologist': '🤰',
			'Urologist': '🫁',
			'Dentist': '🪥',
			'ENT Specialist': '👂',
			'Orthopedic Surgeon': '🦴',
			'Neurologist': '🧠',
			'Child Specialist': '👶',
			'Pulmonologist': '🩺',
			'Eye Specialist': '👓',
			'General Physician': '🩹'
		};
		return icons[specialty] || '👨‍⚕️';
	};

	function handleBookAppointment(doctor) {
		setSelectedDoctor(doctor);
		setAppointmentForm({ appointment_date: '', appointment_time: '', reason: '' });
		setShowProfileForm(false);
	}

	async function handlePatientProfileSubmit(e) {
		e.preventDefault();
		
		if (!patientProfileForm.name || !patientProfileForm.phone || !patientProfileForm.age || !patientProfileForm.gender || !patientProfileForm.cnic) {
			alert('Please fill in all required fields (Name, Phone, Age, Gender, CNIC)');
			return;
		}

		setBookingLoading(true);
		try {
			// Create/update profile - use upsert (handles both create and update)
			await apiRequest('/api/patients/profile', {
				method: 'POST',
				body: JSON.stringify({
					name: patientProfileForm.name,
					phone: patientProfileForm.phone,
					age: parseInt(patientProfileForm.age),
					gender: patientProfileForm.gender,
					cnic: patientProfileForm.cnic,
					history: patientProfileForm.history || null
				})
			});
			
			setHasPatientProfile(true);
			setShowProfileForm(false);
			
			// If appointment form is filled, automatically book after a short delay
			// This ensures the database has committed the profile creation
			if (appointmentForm.appointment_date && appointmentForm.appointment_time && selectedDoctor) {
				// Wait 500ms to ensure profile is fully saved before booking
				setTimeout(() => {
					handleBookingSubmit(null);
				}, 500);
			} else {
				setBookingLoading(false);
			}
		} catch (err) {
			console.error('Profile save error:', err);
			alert(err.message || 'Failed to save profile. Please try again.');
			setBookingLoading(false);
		}
	}

	async function handleBookingSubmit(e) {
		if (e) e.preventDefault();
		if (!selectedDoctor) return;

		if (!appointmentForm.appointment_date || !appointmentForm.appointment_time) {
			alert('Please fill in appointment date and time');
			return;
		}

		if (!hasPatientProfile) {
			setShowProfileForm(true);
			alert('Please complete your patient profile first. Fill in all required fields (Name, Phone, Age, Gender, CNIC).');
			return;
		}

		setBookingLoading(true);
		try {
			await apiRequest('/api/appointments', {
				method: 'POST',
				body: JSON.stringify({
					doctor_id: selectedDoctor.id,
					appointment_date: appointmentForm.appointment_date,
					appointment_time: appointmentForm.appointment_time,
					reason: appointmentForm.reason || null
				})
			});
			
			alert('Video consultation booked successfully!');
			setSelectedDoctor(null);
			setAppointmentForm({ appointment_date: '', appointment_time: '', reason: '' });
			setShowProfileForm(false);
			navigate('/dashboard/patient');
		} catch (err) {
			console.error('Booking error:', err);
			const errorMsg = err.message || 'Failed to book consultation';
			
			// Only show profile form for authenticated users with profile issues
			if (isAuthenticated && (errorMsg.includes('Patient profile not found') || errorMsg.includes('incomplete'))) {
				setHasPatientProfile(false);
				setShowProfileForm(true);
				alert(errorMsg + '\n\nPlease complete your profile and try again.');
			} else {
				alert(errorMsg);
			}
			setBookingLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			{/* Hero Section */}
			<section className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-16">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center">
						<h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
							Consult <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-600">Online</span>
						</h1>
						<p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
							Get expert medical advice from certified doctors via video consultation
						</p>
						
						{/* Search Bar */}
						<div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-2">
							<div className="flex items-center gap-2">
								<span className="text-2xl ml-2">🔍</span>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="flex-1 px-4 py-3 outline-none text-gray-700"
									placeholder="Search doctors by name or specialty..."
								/>
								<button className="bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition">
									Search
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className="py-16">
				<div className="max-w-7xl mx-auto px-4">
					<div className="grid lg:grid-cols-4 gap-8">
						{/* Specialties Sidebar */}
						<div className="lg:col-span-1">
							<div className="bg-white rounded-3xl shadow-xl p-6 sticky top-24">
								<h3 className="text-xl font-bold text-gray-900 mb-4">Specialties</h3>
								<div className="space-y-2">
									{specialties.map((specialty, idx) => (
										<button
											key={idx}
											onClick={() => setSelectedSpecialty(specialty)}
											className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${
												selectedSpecialty === specialty
													? 'bg-brand text-white font-semibold'
													: 'bg-gray-50 text-gray-700 hover:bg-brand-lighter'
											}`}
										>
											<span className="text-2xl">
												{specialty === 'All' ? '👥' : getSpecialtyIcon(specialty)}
											</span>
											<span>{specialty}</span>
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Doctors Grid */}
						<div className="lg:col-span-3">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-900">
									Available Doctors ({filteredDoctors.length})
								</h2>
							</div>

							{loading ? (
								<div className="text-center py-12">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
									<p className="mt-4 text-gray-600">Loading doctors...</p>
								</div>
							) : filteredDoctors.length === 0 ? (
								<div className="bg-white rounded-3xl shadow-xl p-12 text-center">
									<div className="text-6xl mb-4">👨‍⚕️</div>
									<h3 className="text-2xl font-bold text-gray-900 mb-2">No doctors found</h3>
									<p className="text-gray-600">Try adjusting your search or specialty filter</p>
								</div>
							) : (
								<div className="grid sm:grid-cols-2 gap-6">
									{filteredDoctors.map((doctor) => (
										<div key={doctor.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group">
											<div className="p-6">
												<div className="text-center mb-4">
													<div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
														{getSpecialtyIcon(doctor.specialization)}
													</div>
													<h3 className="text-xl font-bold text-gray-900 mb-1">{doctor.name}</h3>
													<p className="text-sm text-gray-500 mb-2">{doctor.specialization}</p>
													{doctor.degrees && (
														<p className="text-xs text-gray-600 mb-2">{doctor.degrees}</p>
													)}
												</div>

												<div className="space-y-3">
													<div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full inline-block">
														{doctor.discount_rate || 50}% OFF
													</div>

													<div className="flex items-center justify-center gap-4 text-sm">
														<div className="flex items-center gap-1">
															<span className="text-yellow-500">⭐</span>
															<span className="font-semibold">4.8</span>
														</div>
														<div className="flex items-center gap-1">
															<span>⏱️</span>
															<span className="font-semibold">15 min</span>
														</div>
														<div className="flex items-center gap-1 text-green-600">
															<span>✓</span>
															<span className="font-semibold">Available</span>
														</div>
													</div>

													<button
														onClick={() => handleBookAppointment(doctor)}
														className="block w-full text-center bg-gradient-to-r from-brand to-brand-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
													>
														Book Video Consultation
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className="py-16 bg-white">
				<div className="max-w-7xl mx-auto px-4">
					<h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose Online Consultation?</h2>
					<div className="grid md:grid-cols-3 gap-8">
						{[
							{ icon: '🏠', title: 'From Your Home', desc: 'Consult from the comfort of your home without traveling' },
							{ icon: '⏰', title: 'Save Time', desc: 'No waiting in queues or traffic, get instant appointment' },
							{ icon: '💰', title: 'Affordable', desc: 'Get quality consultation at 50% discount' }
						].map((benefit, idx) => (
							<div key={idx} className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
								<div className="text-6xl mb-4">{benefit.icon}</div>
								<h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
								<p className="text-gray-700">{benefit.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Back to Home */}
			<div className="max-w-7xl mx-auto px-4 pb-16 text-center">
				<Link to="/" className="text-brand hover:underline font-semibold inline-flex items-center gap-2">
					← Back to Home
				</Link>
			</div>

			{/* Booking Modal */}
			{selectedDoctor && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDoctor(null)}>
					<div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-50" onClick={(e) => e.stopPropagation()}>
						<div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
							<h2 className="text-2xl font-bold text-gray-900">Book Video Consultation</h2>
							<button onClick={() => setSelectedDoctor(null)} className="text-gray-500 hover:text-gray-900 text-2xl">✕</button>
						</div>
						
						<div className="p-6">
							{!isAuthenticated ? (
								<div className="text-center space-y-4">
									<div className="text-6xl mb-4">🔒</div>
									<h3 className="text-xl font-semibold text-gray-900">Login Required</h3>
									<p className="text-gray-600">Please login or register to book a video consultation</p>
									<div className="flex gap-3 mt-6">
										<Link
											to={`/login?redirect=/consult-online&doctor=${selectedDoctor.id}`}
											className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark text-center"
										>
											Login
										</Link>
										<Link
											to={`/login?redirect=/consult-online&doctor=${selectedDoctor.id}`}
											className="flex-1 border-2 border-brand text-brand px-6 py-3 rounded-lg font-semibold hover:bg-brand-light text-center"
										>
											Register
										</Link>
									</div>
								</div>
							) : checkingProfile ? (
								<div className="text-center py-8">
									<div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand border-t-transparent mb-4"></div>
									<p className="text-gray-600">Checking profile...</p>
								</div>
							) : !hasPatientProfile || showProfileForm ? (
								<>
									<div className="text-center mb-6">
										<div className="text-5xl mb-3">📋</div>
										<h3 className="text-xl font-bold text-gray-900">Complete Your Profile</h3>
										<p className="text-gray-600 text-sm mt-1">Please provide your information to book a video consultation</p>
									</div>

									<form onSubmit={handlePatientProfileSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
										<div>
											<label className="block text-sm font-medium mb-1">Name *</label>
											<input
												type="text"
												className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand"
												placeholder="Your full name"
												value={patientProfileForm.name}
												onChange={e => setPatientProfileForm({...patientProfileForm, name: e.target.value})}
												onClick={(e) => e.stopPropagation()}
												required
												disabled={bookingLoading}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-1">Phone Number *</label>
											<input
												type="tel"
												className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand"
												placeholder="0300-1234567"
												value={patientProfileForm.phone}
												onChange={e => setPatientProfileForm({...patientProfileForm, phone: e.target.value})}
												onClick={(e) => e.stopPropagation()}
												required
												disabled={bookingLoading}
											/>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium mb-1">Age *</label>
												<input
													type="number"
													className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand"
													value={patientProfileForm.age}
													onChange={e => setPatientProfileForm({...patientProfileForm, age: e.target.value})}
													onClick={(e) => e.stopPropagation()}
													required
													min="1"
													max="120"
													disabled={bookingLoading}
												/>
											</div>
											<div>
												<label className="block text-sm font-medium mb-1">Gender *</label>
												<select
													className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
													value={patientProfileForm.gender}
													onChange={e => setPatientProfileForm({...patientProfileForm, gender: e.target.value})}
													onClick={(e) => e.stopPropagation()}
													required
													disabled={bookingLoading}
												>
													<option value="male">Male</option>
													<option value="female">Female</option>
													<option value="other">Other</option>
												</select>
											</div>
										</div>

										<div>
											<label className="block text-sm font-medium mb-1">CNIC Number *</label>
											<input
												type="text"
												className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand"
												placeholder="12345-6789012-3"
												value={patientProfileForm.cnic}
												onChange={e => setPatientProfileForm({...patientProfileForm, cnic: e.target.value})}
												onClick={(e) => e.stopPropagation()}
												required
												pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
												disabled={bookingLoading}
											/>
											<p className="text-xs text-gray-500 mt-1">Format: 12345-6789012-3</p>
										</div>

										<div>
											<label className="block text-sm font-medium mb-1">Medical History</label>
											<textarea
												className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand resize-none"
												rows="3"
												value={patientProfileForm.history}
												onChange={e => setPatientProfileForm({...patientProfileForm, history: e.target.value})}
												onClick={(e) => e.stopPropagation()}
												placeholder="Any allergies, chronic conditions, previous surgeries..."
												disabled={bookingLoading}
											/>
										</div>

										<div className="flex gap-3 mt-6">
											<button
												type="submit"
												disabled={bookingLoading}
												className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-50"
											>
												{bookingLoading ? 'Saving...' : 'Save & Continue Booking'}
											</button>
											<button
												type="button"
												onClick={() => {
													setSelectedDoctor(null);
													setShowProfileForm(false);
												}}
												className="flex-1 bg-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
											>
												Cancel
											</button>
										</div>
									</form>
								</>
							) : (
								<>
									<div className="text-center mb-6">
										<h3 className="text-xl font-bold text-gray-900">{selectedDoctor.name}</h3>
										<p className="text-gray-600">{selectedDoctor.specialization}</p>
										{selectedDoctor.degrees && (
											<p className="text-sm text-gray-500 mt-1">{selectedDoctor.degrees}</p>
										)}
									</div>

									<form onSubmit={handleBookingSubmit} className="space-y-4">
										<div>
											<label className="block text-sm font-medium mb-1">Consultation Date *</label>
											<input
												type="date"
												className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand"
												value={appointmentForm.appointment_date}
												onChange={e => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
												onClick={(e) => e.stopPropagation()}
												required
												min={new Date().toISOString().split('T')[0]}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-1">Consultation Time *</label>
											<input
												type="time"
												className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand"
												value={appointmentForm.appointment_time}
												onChange={e => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
												onClick={(e) => e.stopPropagation()}
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-1">Reason for Consultation</label>
											<textarea
												className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand resize-none"
												rows="3"
												value={appointmentForm.reason}
												onChange={e => setAppointmentForm({...appointmentForm, reason: e.target.value})}
												onClick={(e) => e.stopPropagation()}
												placeholder="Brief description of your symptoms or concern..."
											/>
										</div>

										<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
											<p className="text-sm text-gray-700 mb-2">
												<span className="font-semibold">Type:</span> Video Consultation (Online)
											</p>
											{selectedDoctor.consultation_fee && (
												<>
													<div className="flex justify-between items-center">
														<span className="text-gray-700">Consultation Fee:</span>
														<span className="font-semibold">PKR {selectedDoctor.consultation_fee}</span>
													</div>
													{selectedDoctor.discount_rate > 0 && (
														<div className="flex justify-between items-center mt-2">
															<span className="text-gray-700">Discount ({selectedDoctor.discount_rate}%):</span>
															<span className="text-green-600 font-semibold">
																- PKR {((selectedDoctor.consultation_fee * selectedDoctor.discount_rate) / 100).toFixed(2)}
															</span>
														</div>
													)}
													<div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-300">
														<span className="font-bold text-gray-900">Final Fee:</span>
														<span className="font-bold text-brand text-lg">
															PKR {(
																selectedDoctor.consultation_fee - 
																((selectedDoctor.consultation_fee * (selectedDoctor.discount_rate || 0)) / 100)
															).toFixed(2)}
														</span>
													</div>
												</>
											)}
										</div>

										<div className="flex gap-3 mt-6">
											<button
												type="submit"
												disabled={bookingLoading}
												className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-50"
											>
												{bookingLoading ? 'Booking...' : 'Confirm Video Consultation'}
											</button>
											<button
												type="button"
												onClick={() => {
													setSelectedDoctor(null);
													setAppointmentForm({ appointment_date: '', appointment_time: '', reason: '' });
												}}
												className="flex-1 bg-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
											>
												Cancel
											</button>
										</div>
									</form>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

