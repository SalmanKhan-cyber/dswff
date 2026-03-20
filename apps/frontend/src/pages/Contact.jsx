import { useEffect, useState, useMemo } from 'react';
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

export default function Contact() {
	const navigate = useNavigate();
	const mapAddress = " Pak Medical Center & Hospital, PTCL Colony, Khyber Bazar Stop, Peshawar";
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const mapUrl = apiKey 
		? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(mapAddress)}`
		: `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

	// Doctor search state
	const [doctors, setDoctors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
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
		age: '',
		gender: 'male',
		cnic: '',
		history: ''
	});
	const [bookingLoading, setBookingLoading] = useState(false);
	const [showProfileForm, setShowProfileForm] = useState(false);

	// Load doctors
	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const { data } = await supabase.from('doctors').select('*').order('name', { ascending: true });
				setDoctors(data || []);
			} catch (err) {
				console.error('Error loading doctors:', err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	// Check authentication
	useEffect(() => {
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
			if (res.profile) {
				setHasPatientProfile(true);
				setPatientProfileForm({
					age: res.profile.age || '',
					gender: res.profile.gender || 'male',
					cnic: res.profile.cnic || '',
					history: res.profile.history || ''
				});
			} else {
				setHasPatientProfile(false);
				setShowProfileForm(true);
			}
		} catch (err) {
			setHasPatientProfile(false);
			setShowProfileForm(true);
		} finally {
			setCheckingProfile(false);
		}
	}

	const filtered = useMemo(() => {
		let list = doctors;
		if (search.trim()) {
			const s = search.toLowerCase();
			list = list.filter(d => {
				const name = (d.name || '').toLowerCase();
				const specialization = (d.specialization || '').toLowerCase();
				const degrees = (d.degrees || '').toLowerCase();
				return name.includes(s) || specialization.includes(s) || degrees.includes(s);
			});
		}
		return list;
	}, [doctors, search]);

	function handleBookAppointment(doctor) {
		setSelectedDoctor(doctor);
		setAppointmentForm({ appointment_date: '', appointment_time: '', reason: '' });
		setShowProfileForm(false);
	}

	async function handlePatientProfileSubmit(e) {
		e.preventDefault();
		
		if (!patientProfileForm.age || !patientProfileForm.gender || !patientProfileForm.cnic) {
			alert('Please fill in all required fields (Age, Gender, CNIC)');
			return;
		}

		setBookingLoading(true);
		try {
			await apiRequest('/api/patients/profile', {
				method: 'POST',
				body: JSON.stringify({
					age: parseInt(patientProfileForm.age),
					gender: patientProfileForm.gender,
					cnic: patientProfileForm.cnic,
					history: patientProfileForm.history || null
				})
			});
			
			setHasPatientProfile(true);
			setShowProfileForm(false);
		} catch (err) {
			alert(err.message || 'Failed to create profile');
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
			
			alert('Appointment booked successfully!');
			setSelectedDoctor(null);
			setAppointmentForm({ appointment_date: '', appointment_time: '', reason: '' });
			setShowProfileForm(false);
		} catch (err) {
			// Only show profile form for authenticated users with profile issues
			if (isAuthenticated && err.message?.includes('Patient profile not found')) {
				setHasPatientProfile(false);
				setShowProfileForm(true);
				setBookingLoading(false);
			} else {
				alert(err.message || 'Failed to book appointment');
				setBookingLoading(false);
			}
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			<div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
				{/* Doctor Search Section */}
				<div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Search & Book Doctors</h1>
					<p className="text-gray-600 mb-6">Find and book appointments with our verified doctors</p>
					
					{/* Search Bar */}
					<div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
						<div className="relative">
							<input
								type="text"
								value={search}
								onChange={e => setSearch(e.target.value)}
								className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-11 focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
								placeholder="Search doctors by name, specialization, or degrees..."
							/>
							<span className="absolute left-3 top-3.5 text-gray-400 text-xl">🔍</span>
							{search && (
								<button
									onClick={() => setSearch('')}
									className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 text-xl"
								>
									×
								</button>
							)}
						</div>
						{search && (
							<p className="text-sm text-gray-600 mt-3">
								{filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
							</p>
						)}
					</div>

					{/* Doctors Grid */}
					{loading ? (
						<div className="text-center py-12">
							<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
							<p className="text-gray-500 mt-4">Loading doctors...</p>
						</div>
					) : filtered.length === 0 ? (
						<div className="text-center py-12 bg-white rounded-2xl shadow-lg">
							<div className="text-6xl mb-4">👨‍⚕️</div>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								{search ? 'No doctors found' : 'No doctors available'}
							</h3>
							<p className="text-gray-600">
								{search ? 'Try adjusting your search' : 'Check back later'}
							</p>
						</div>
					) : (
						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filtered.map((doctor) => (
								<div key={doctor.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-200 overflow-hidden transition-all transform hover:-translate-y-1">
									<div className="p-6">
										{/* Avatar */}
										<div className="mx-auto mb-4 relative w-24 h-24">
											{doctor.image_url ? (
												<div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-white">
													<img src={doctor.image_url} alt={doctor.name} className="w-full h-full object-cover" />
												</div>
											) : (
												<div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-4xl shadow-lg">
													👨‍⚕️
												</div>
											)}
											<div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white">
												<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
												</svg>
											</div>
										</div>

										{/* Content */}
										<div className="text-center">
											<div className="flex items-center justify-center gap-2 mb-1">
												<h2 className="text-xl font-bold text-gray-800">{doctor.name}</h2>
												<span className="bg-gradient-to-r from-green-400 to-green-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
													✓ VERIFIED
												</span>
											</div>
											<p className="text-brand font-semibold">{doctor.specialization}</p>
											{doctor.degrees && (
												<p className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
													<span>🎓</span>
													<span>{doctor.degrees}</span>
												</p>
											)}
											
											{/* Stats */}
											<div className="grid grid-cols-2 gap-3 mt-4">
												<div className="bg-blue-50 rounded-xl p-3 text-center">
													<div className="text-2xl font-bold text-blue-600">
														{doctor.discount_rate || 50}%
													</div>
													<div className="text-xs text-gray-600">Discount</div>
												</div>
												<div className="bg-purple-50 rounded-xl p-3 text-center">
													<div className="text-2xl font-bold text-purple-600">5⭐</div>
													<div className="text-xs text-gray-600">Rating</div>
												</div>
											</div>

											{/* Book Button */}
											<button
												onClick={() => handleBookAppointment(doctor)}
												className="mt-6 w-full bg-gradient-to-r from-brand to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
											>
												Book Appointment
											</button>
										</div>
									</div>

									{/* Bottom Bar */}
									<div className="bg-gradient-to-r from-brand-light to-blue-100 px-6 py-3 flex items-center justify-between text-sm">
										<span className="text-gray-700 font-medium">Available Today</span>
										<span className="flex items-center text-brand">
											<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
											Online
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Contact Form Section */}
				<div>
					<h2 className="text-2xl font-semibold mb-6">Contact Us</h2>
					<form className="bg-white p-6 rounded-2xl shadow-lg grid gap-4">
						<input className="border-2 border-gray-200 p-3 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20" placeholder="Name" />
						<input type="email" className="border-2 border-gray-200 p-3 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20" placeholder="Email" />
						<textarea className="border-2 border-gray-200 p-3 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none" placeholder="Message" rows={5}></textarea>
						<button className="bg-brand text-white px-6 py-3 rounded-xl w-fit font-semibold hover:bg-brand-dark transition">Send</button>
					</form>
				</div>

				{/* Map Section */}
				<div>
					<h2 className="text-2xl font-semibold mb-6">Our Location</h2>
					<div className="bg-white p-6 rounded-2xl shadow-lg">
						<div className="h-96 w-full rounded-xl overflow-hidden">
							<iframe
								width="100%"
								height="100%"
								style={{ border: 0 }}
								loading="lazy"
								allowFullScreen
								referrerPolicy="no-referrer-when-downgrade"
								src={mapUrl}
								title="Location Map"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Booking Modal */}
			{selectedDoctor && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDoctor(null)}>
					<div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-50" onClick={(e) => e.stopPropagation()}>
						<div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
							<h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
							<button onClick={() => setSelectedDoctor(null)} className="text-gray-500 hover:text-gray-900 text-2xl">✕</button>
						</div>
						
						<div className="p-6">
							{!isAuthenticated ? (
								<div className="text-center space-y-4">
									<div className="text-6xl mb-4">🔒</div>
									<h3 className="text-xl font-semibold text-gray-900">Login Required</h3>
									<p className="text-gray-600">Please login or register to book an appointment</p>
									<div className="flex gap-3 mt-6">
										<Link
											to={`/login?redirect=/contact`}
											className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark text-center"
										>
											Login
										</Link>
										<Link
											to={`/login?redirect=/contact`}
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
										<p className="text-gray-600 text-sm mt-1">Please provide your information to book an appointment</p>
									</div>

									<form onSubmit={handlePatientProfileSubmit} className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium mb-1">Age *</label>
												<input
													type="number"
													className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20"
													value={patientProfileForm.age}
													onChange={e => setPatientProfileForm({...patientProfileForm, age: e.target.value})}
													required
													min="1"
													max="120"
													disabled={bookingLoading}
												/>
											</div>
											<div>
												<label className="block text-sm font-medium mb-1">Gender *</label>
												<select
													className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
													value={patientProfileForm.gender}
													onChange={e => setPatientProfileForm({...patientProfileForm, gender: e.target.value})}
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
												className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20"
												placeholder="12345-6789012-3"
												value={patientProfileForm.cnic}
												onChange={e => setPatientProfileForm({...patientProfileForm, cnic: e.target.value})}
												required
												pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
												disabled={bookingLoading}
											/>
											<p className="text-xs text-gray-500 mt-1">Format: 12345-6789012-3</p>
										</div>

										<div>
											<label className="block text-sm font-medium mb-1">Medical History</label>
											<textarea
												className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
												rows="3"
												value={patientProfileForm.history}
												onChange={e => setPatientProfileForm({...patientProfileForm, history: e.target.value})}
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
											<label className="block text-sm font-medium mb-1">Appointment Date *</label>
											<input
												type="date"
												className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20"
												value={appointmentForm.appointment_date}
												onChange={e => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
												required
												min={new Date().toISOString().split('T')[0]}
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-1">Appointment Time *</label>
											<input
												type="time"
												className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20"
												value={appointmentForm.appointment_time}
												onChange={e => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium mb-1">Reason for Visit</label>
											<textarea
												className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
												rows="3"
												value={appointmentForm.reason}
												onChange={e => setAppointmentForm({...appointmentForm, reason: e.target.value})}
												placeholder="Brief description of your symptoms or concern..."
											/>
										</div>

										<div className="flex gap-3 mt-6">
											<button
												type="submit"
												disabled={bookingLoading}
												className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-50"
											>
												{bookingLoading ? 'Booking...' : 'Confirm Booking'}
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
