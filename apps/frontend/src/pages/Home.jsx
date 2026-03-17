import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export default function Home() {
	const navigate = useNavigate();
	const [doctors, setDoctors] = useState([]);
	const [specialties, setSpecialties] = useState([]);
	const [conditions, setConditions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [displayedText, setDisplayedText] = useState('');
	const currentIndexRef = useRef(0);
	const timeoutRef = useRef(null);
	const [currentStatIndex, setCurrentStatIndex] = useState(0);
	const [searchLocation, setSearchLocation] = useState('Lahore');
	const [searchQuery, setSearchQuery] = useState('');
	
	// Lab selection modal state
	const [selectedTest, setSelectedTest] = useState(null);
	const [labs, setLabs] = useState([]);
	const [labsLoading, setLabsLoading] = useState(false);
	const [selectedLab, setSelectedLab] = useState(null);
	const [labSearchQuery, setLabSearchQuery] = useState('');
	
	// Booking modal state
	const [showBookingModal, setShowBookingModal] = useState(false);
	const [bookingForm, setBookingForm] = useState({
		test_description: '',
		remarks: '',
		prescription_file: null
	});
	const [uploadingPrescription, setUploadingPrescription] = useState(false);
	const [booking, setBooking] = useState(false);

	const fullText = "Find and Book the Best Doctors near you";
	const highlightedText = "Best Doctors";
	const beforeHighlight = "Find and Book the ";
	const afterHighlight = " near you";

	// Map configuration - same as Contact page
	const mapAddress = "Pak Medical Center & Hospital, PTCL Colony, Khyber Bazar Stop, Peshawar";
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const mapUrl = apiKey 
		? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(mapAddress)}`
		: `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

	// Statistics slideshow
	const stats = [
		{ text: '100+ Partner Clinics', icon: '🏥' },
		{ text: '500K+ Tests Conducted', icon: '🧪' },
		{ text: '10K+ Surgeries Supported', icon: '⚕️' },
		{ text: '5K+ Students Trained', icon: '🎓' },
		{ text: '70% Student Discount', icon: '💰' },
		{ text: 'Hands-on Health Training', icon: '✋' },
		{ text: 'Next-Gen Health Experts', icon: '⭐' },
		{ text: '1M+ Lives Impacted', icon: '❤️' },
		{ text: 'Serving All Pakistan', icon: '🇵🇰' },
		{ text: 'Thousands Benefiting Monthly', icon: '📈' }
	];

	// Lab services offered
	const labServices = [
		{ id: 1, name: 'Blood Tests', icon: '🩸', desc: 'Complete blood count, sugar, cholesterol', discount: '50%', price: 'PKR 500' },
		{ id: 2, name: 'X-Ray', icon: '🦴', desc: 'Digital X-ray imaging for bones and organs', discount: '50%', price: 'PKR 800' },
		{ id: 3, name: 'Ultrasound', icon: '📡', desc: 'Abdominal, pelvic, and pregnancy ultrasound', discount: '50%', price: 'PKR 1,200' },
		{ id: 4, name: 'ECG', icon: '💓', desc: 'Electrocardiogram for heart health', discount: '50%', price: 'PKR 600' },
		{ id: 5, name: 'Urine Test', icon: '🧪', desc: 'Complete urine analysis', discount: '50%', price: 'PKR 300' },
		{ id: 6, name: 'CT Scan', icon: '🔬', desc: 'Advanced imaging for detailed diagnosis', discount: '50%', price: 'PKR 3,500' },
	];

	useEffect(() => {
		// Load all data in parallel for better performance
		Promise.all([
			fetchDoctors(),
			fetchSpecialties(),
			fetchConditions()
		]).catch(err => {
			console.error('Error loading initial data:', err);
		});
	}, []);

	async function fetchSpecialties() {
		try {
			const response = await fetch(`${import.meta.env.MODE === 'development' ? 'http://localhost:4000' : 'https://api.drsanaullahwelfarefoundation.com'}/api/specialties/public`);
			const data = await response.json();
			setSpecialties(data.specialties || []);
		} catch (err) {
			console.error('Error fetching specialties:', err);
		}
	}

	async function fetchConditions() {
		try {
			const response = await fetch(`${import.meta.env.MODE === 'development' ? 'http://localhost:4000' : 'https://api.drsanaullahwelfarefoundation.com'}/api/conditions/public`);
			const data = await response.json();
			setConditions(data.conditions || []);
		} catch (err) {
			console.error('Error fetching conditions:', err);
		}
	}

	// Typing animation effect
	useEffect(() => {
		const typeText = () => {
			if (currentIndexRef.current < fullText.length) {
				setDisplayedText(fullText.substring(0, currentIndexRef.current + 1));
				currentIndexRef.current++;
				timeoutRef.current = setTimeout(typeText, 150); // Type each character every 150ms
			} else {
				// Wait 5 seconds after typing is complete, then reset
				setTimeout(() => {
					setDisplayedText('');
					currentIndexRef.current = 0;
					setTimeout(typeText, 500); // Small delay before restarting
				}, 5000);
			}
		};

		// Start typing animation
		typeText();

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [fullText]);

	// Statistics slideshow effect
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentStatIndex((prevIndex) => (prevIndex + 1) % stats.length);
		}, 3000); // Change every 3 seconds

		return () => clearInterval(interval);
	}, [stats.length]);

	async function fetchDoctors() {
		try {
			const API_BASE_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:4000' 
  : 'https://api.drsanaullahwelfarefoundation.com';
			const response = await fetch(`${API_BASE_URL}/api/doctors/public`);
			const data = await response.json();
			setDoctors(data.doctors || []);
		} catch (err) {
			console.error('Error fetching doctors:', err);
		} finally {
			setLoading(false);
		}
	}

	async function handleViewDetails(test) {
		setSelectedTest(test);
		setLabsLoading(true);
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/labs/public`);
			if (response.ok) {
				const data = await response.json();
				setLabs(data.labs || []);
			} else {
				alert('Failed to load labs. Please try again.');
			}
		} catch (err) {
			console.error('Error fetching labs:', err);
			alert('Failed to load labs. Please try again.');
		} finally {
			setLabsLoading(false);
		}
	}

	function closeLabModal() {
		setSelectedTest(null);
		setLabs([]);
		setSelectedLab(null);
		setLabSearchQuery('');
	}

	// Filter labs based on search query
	const filteredLabs = labs.filter(lab => {
		if (!labSearchQuery.trim()) return true;
		const query = labSearchQuery.toLowerCase();
		return (
			lab.name?.toLowerCase().includes(query) ||
			lab.location?.toLowerCase().includes(query) ||
			lab.contact_info?.toLowerCase().includes(query) ||
			lab.services?.some(service => service.toLowerCase().includes(query))
		);
	});

	function handleSelectLab(lab) {
		setSelectedLab(lab);
		// Lab selection is now handled by visual state - no alert needed
		// The "Proceed" button will handle the final action
	}

	async function handlePrescriptionUpload(file) {
		try {
			setUploadingPrescription(true);
			const formData = new FormData();
			formData.append('file', file);
			
			// Mock session check - no real Supabase calls
			console.log('🔐 Using mock session for prescription upload');
			const session = { access_token: 'mock-token' };
			if (!session) {
				throw new Error('Please log in to upload prescription');
			}
			
			const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/test-bookings/upload-prescription`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${session.access_token}`
				},
				body: formData
			});
			
			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Upload failed' }));
				throw new Error(error.error || 'Upload failed');
			}
			
			const data = await response.json();
			setBookingForm(prev => ({ ...prev, prescription_file: file, prescription_url: data.path }));
			return data.path;
		} catch (err) {
			alert('Failed to upload prescription: ' + err.message);
			throw err;
		} finally {
			setUploadingPrescription(false);
		}
	}

	async function handleConfirmBooking() {
		try {
			if (!selectedLab || !selectedTest) {
				alert('Please select a lab and test');
				return;
			}
			
			// Mock session check - no real Supabase calls
			console.log('🔐 Using mock session for test booking');
			const session = { access_token: 'mock-token' };
			if (!session) {
				alert('Please log in to book a test');
				navigate('/login');
				return;
			}
			
			setBooking(true);
			
			const response = await apiRequest('/api/test-bookings', {
				method: 'POST',
				body: JSON.stringify({
					lab_id: selectedLab.id,
					test_name: selectedTest.name,
					test_description: bookingForm.test_description || selectedTest.desc,
					prescription_url: bookingForm.prescription_url,
					remarks: bookingForm.remarks
				})
			});
			
			alert(`Booking confirmed! Your tracking number is: ${response.booking.tracking_number}\n\nShare this number to track your test.`);
			closeLabModal();
			setShowBookingModal(false);
			setBookingForm({ test_description: '', remarks: '', prescription_file: null, prescription_url: '' });
			
			// Navigate to patient dashboard if available
			if (window.location.pathname.includes('/dashboard')) {
				window.location.reload();
			} else {
				navigate('/dashboard/patient');
			}
		} catch (err) {
			alert('Failed to book test: ' + (err.message || 'Unknown error'));
		} finally {
			setBooking(false);
		}
	}

	function openBookingModal() {
		if (!selectedLab) {
			alert('Please select a lab first');
			return;
		}
		setShowBookingModal(true);
	}

	function closeBookingModal() {
		setShowBookingModal(false);
		setBookingForm({ test_description: '', remarks: '', prescription_file: null, prescription_url: '' });
	}

	function handleSearch() {
		// If search query is provided, navigate to doctors page with search params
		if (searchQuery.trim()) {
			// Check if it looks like a condition/specialty
			const query = searchQuery.trim().toLowerCase();
			
			// Map common conditions to specialties
			const conditionMap = {
				'fever': 'General Physician',
				'heart': 'Cardiologist',
				'cardiac': 'Cardiologist',
				'pregnancy': 'Gynecologist',
				'pregnant': 'Gynecologist',
				'blood pressure': 'Cardiologist',
				'pressure': 'Cardiologist',
				'acne': 'Dermatologist',
				'skin': 'Dermatologist',
				'piles': 'General Physician',
				'diarrhea': 'Gastroenterologist',
				'stomach': 'Gastroenterologist',
				'teeth': 'Dentist',
				'tooth': 'Dentist',
				'eye': 'Ophthalmologist',
				'vision': 'Ophthalmologist',
				'ear': 'ENT Specialist',
				'nose': 'ENT Specialist',
				'throat': 'ENT Specialist',
				'bone': 'Orthopedic Surgeon',
				'joint': 'Orthopedic Surgeon',
				'child': 'Pediatrician',
				'kid': 'Pediatrician',
				'brain': 'Neurologist',
				'nerve': 'Neurologist',
				'lung': 'Pulmonologist',
				'breathing': 'Pulmonologist'
			};

			// Find matching specialty
			let specialty = null;
			for (const [keyword, spec] of Object.entries(conditionMap)) {
				if (query.includes(keyword)) {
					specialty = spec;
					break;
				}
			}

			// Navigate to doctors page with search parameters
			const params = new URLSearchParams();
			if (specialty) {
				params.set('specialty', specialty);
			} else {
				// Search by doctor name or specialization
				params.set('search', searchQuery.trim());
			}
			if (searchLocation && searchLocation !== 'All') {
				params.set('location', searchLocation);
			}

			navigate(`/doctors?${params.toString()}`);
		} else {
			// Just navigate to doctors page with location if provided
			const params = new URLSearchParams();
			if (searchLocation && searchLocation !== 'All') {
				params.set('location', searchLocation);
			}
			navigate(`/doctors${params.toString() ? '?' + params.toString() : ''}`);
		}
	}

	return (
		<>
			{/* Hero Section */}
			<section className="bg-gradient-to-r from-[#3b1e68] via-[#2c6e49] to-[#15803d] text-white">
				<div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
					<div className="grid md:grid-cols-2 items-center gap-8">
						<div className="order-2 md:order-1 text-center md:text-left">
							<h1 className="text-4xl md:text-5xl font-extrabold leading-tight min-h-[120px] md:min-h-[140px]">
								{displayedText ? (
									<span>
										{displayedText.substring(0, beforeHighlight.length)}
										{displayedText.length > beforeHighlight.length && (
											<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
												{displayedText.substring(beforeHighlight.length, Math.min(displayedText.length, beforeHighlight.length + highlightedText.length))}
											</span>
										)}
										{displayedText.length > beforeHighlight.length + highlightedText.length && (
											displayedText.substring(beforeHighlight.length + highlightedText.length)
										)}
										{displayedText.length < fullText.length && (
											<span className="animate-pulse text-yellow-300 ml-1">|</span>
										)}
									</span>
								) : (
									<span className="text-yellow-300 animate-pulse">|</span>
								)}
							</h1>
							<div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-3 mt-4 min-h-[48px]">
								<span className="text-2xl">{stats[currentStatIndex].icon}</span>
								<span className="text-sm md:text-base font-semibold transition-all duration-500">
									{stats[currentStatIndex].text}
								</span>
							</div>

							{/* Search Bar */}
							<div className="max-w-3xl md:max-w-none bg-white text-gray-800 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-2 p-2 mt-6">
								<select 
									className="px-4 py-3 rounded-lg border focus:ring-2 focus:ring-brand focus:border-transparent text-sm w-full"
									value={searchLocation}
									onChange={e => setSearchLocation(e.target.value)}
								>
									<optgroup label="Punjab">
										<option>Lahore</option>
										<option>Multan</option>
										<option>Rawalpindi</option>
										<option>Faisalabad</option>
										<option>Gujranwala</option>
										<option>Sialkot</option>
										<option>Bahawalpur</option>
										<option>Sargodha</option>
										<option>Gujrat</option>
									</optgroup>
									<optgroup label="Sindh">
										<option>Karachi</option>
										<option>Hyderabad</option>
										<option>Sukkur</option>
										<option>Larkana</option>
										<option>Nawabshah</option>
									</optgroup>
									<optgroup label="Khyber Pakhtunkhwa">
										<option>Peshawar</option>
										<option>Mardan</option>
										<option>Abbottabad</option>
										<option>Saidu Sharif</option>
										<option>Kohat</option>
									</optgroup>
									<optgroup label="Balochistan">
										<option>Quetta</option>
										<option>Turbat</option>
										<option>Chaman</option>
										<option>Gwadar</option>
									</optgroup>
									<optgroup label="Federal">
										<option>Islamabad</option>
									</optgroup>
									<optgroup label="Azad Jammu & Kashmir">
										<option>Muzaffarabad</option>
										<option>Mirpur</option>
									</optgroup>
									<optgroup label="Gilgit-Baltistan">
										<option>Gilgit</option>
										<option>Skardu</option>
									</optgroup>
								</select>
								<div className="flex items-center gap-2 px-3 py-3 rounded-lg border focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent">
									<span className="text-lg">📍</span>
									<input
										className="outline-none flex-1"
										placeholder="Doctors, Hospital, Conditions"
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') {
												handleSearch();
											}
										}}
									/>
								</div>
								<button 
									onClick={handleSearch}
									className="bg-[#f59e0b] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#d97706] transition w-full md:w-auto"
								>
									Search
								</button>
							</div>

							<div className="flex flex-col sm:flex-row gap-4 mt-6 md:mt-8 justify-center md:justify-start">
								<Link 
									to="/login" 
									className="bg-white text-brand px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition text-center"
								>
									Get Started
								</Link>
								<Link 
									to="/donation" 
									className="bg-transparent border-2 border-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand transition text-center"
								>
									Donate Now
								</Link>
							</div>
						</div>

					{/* Doctor Image */}
					<Link to="/about" className="order-1 md:order-2 relative group cursor-pointer">
						<div className="relative flex items-center justify-center overflow-hidden rounded-2xl">
							<img
								src="/doctor-hero.png"
								alt="Doctor"
								className="w-full max-w-lg h-auto object-contain drop-shadow-2xl rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:brightness-105"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-brand/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
								<span className="bg-white/90 backdrop-blur-sm text-brand font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
									👤 View Portfolio
								</span>
							</div>
						</div>
					</Link>
					</div>
				</div>
			</section>

			{/* Service Cards Section */}
			<section className="py-8 md:py-16 bg-white">
				<div className="max-w-7xl mx-auto px-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
						{[
							{ title: 'Consult Online', desc: 'Connect with Specialists through Video call.', icon: '📱', bg: 'bg-purple-50', image: '/online-consultation.jpg', link: '/consult-online' },
							{ title: 'In-Clinic Appointments', desc: 'Book an In-Person visit to doctor\'s clinic.', icon: '🏥', bg: 'bg-amber-50', image: '/in-clinic.jpg', link: '/in-clinic' },
							{ title: 'Laboratory Tests', desc: 'Avail Exclusive discounts on lab tests.', icon: '🧪', bg: 'bg-green-50', image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=800&auto=format&fit=crop', link: '/lab-tests' },
							{ title: 'Blood Bank', desc: 'Request blood units and manage donations.', icon: '🩸', bg: 'bg-red-50', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=800&auto=format&fit=crop', link: '/blood-request' },
							{ title: 'Procedures & Surgeries', desc: 'Plan your surgeries at discounted rates.', icon: '⚕️', bg: 'bg-blue-50', image: '/surgery.jpg', link: '/surgery' },
							{ title: 'Medicines', desc: 'Know your medicines better', icon: '💊', bg: 'bg-cyan-50', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop', link: '/pharmacy' },
						].map((service, idx) => (
							<Link 
								key={idx} 
								to={service.link || "/login"}
								className={`${service.bg} rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer`}
							>
								<div className="aspect-square mb-4 rounded-xl overflow-hidden bg-gray-100">
									<img src={service.image} alt={service.title} className="w-full h-full object-cover" />
								</div>
								<h3 className="font-bold text-lg mb-2 text-gray-800">{service.title}</h3>
								<p className="text-sm text-gray-600">{service.desc}</p>
							</Link>
						))}
					</div>
				</div>
			</section>

			{/* Specialties like "Consult best doctors online" */}
			<section className="py-8 md:py-14 bg-white">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Consult best doctors online</h2>
						<Link to="/doctors" className="text-brand hover:underline font-semibold text-sm md:text-base">View All</Link>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
						{specialties.length > 0 ? (
							specialties.map((s) => (
								<Link key={s.id} to={`/doctors?specialty=${encodeURIComponent(s.label)}`} className="flex flex-col items-center bg-gray-50 rounded-xl p-5 hover:shadow-md transition">
									<div className="text-5xl mb-3">{s.icon}</div>
									<div className="text-sm font-medium text-gray-700 text-center">{s.label}</div>
								</Link>
							))
						) : (
							// Fallback to hardcoded if API fails
							[
								{ label: 'Dermatologist', icon: '👋' },
								{ label: 'Gynecologist', icon: '🤰' },
								{ label: 'Urologist', icon: '🫁' },
								{ label: 'Gastroenterologist', icon: '🫃' },
								{ label: 'Dentist', icon: '🪥' },
								{ label: 'ENT Specialist', icon: '👂' },
								{ label: 'Orthopedic Surgeon', icon: '🦴' },
								{ label: 'Neurologist', icon: '🧠' },
								{ label: 'Child Specialist', icon: '👶' },
								{ label: 'Pulmonologist', icon: '🩺' },
								{ label: 'Eye Specialist', icon: '👓' },
								{ label: 'General Physician', icon: '🩹' }
							].map((s, idx) => (
								<Link key={idx} to={`/doctors?specialty=${encodeURIComponent(s.label)}`} className="flex flex-col items-center bg-gray-50 rounded-xl p-5 hover:shadow-md transition">
									<div className="text-5xl mb-3">{s.icon}</div>
									<div className="text-sm font-medium text-gray-700 text-center">{s.label}</div>
								</Link>
							))
						)}
					</div>
				</div>
			</section>

			{/* Conditions grid */}
			<section className="py-8 md:py-14 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Search doctor by condition</h2>
						<Link to="/doctors" className="text-brand hover:underline font-semibold text-sm md:text-base">View All</Link>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6">
						{conditions.length > 0 ? (
							conditions.map((c) => (
								<Link 
									key={c.id} 
									to={`/doctors?specialty=${encodeURIComponent(c.search_keyword)}`}
									className="flex flex-col items-center bg-white rounded-xl p-5 hover:shadow-md transition cursor-pointer"
								>
									<div className="text-5xl mb-3">{c.icon}</div>
									<div className="text-sm font-medium text-gray-700 text-center">{c.label}</div>
								</Link>
							))
						) : (
							// Fallback to hardcoded if API fails
							[
								{ label: 'Fever', icon: '🤒', search: 'Fever' },
								{ label: 'Heart Attack', icon: '❤️', search: 'Cardiology' },
								{ label: 'Pregnancy', icon: '👶', search: 'Gynecologist' },
								{ label: 'High Blood Pressure', icon: '🩸', search: 'Cardiologist' },
								{ label: 'Piles', icon: '🍑', search: 'General Physician' },
								{ label: 'Diarrhea', icon: '💩', search: 'Gastroenterologist' },
								{ label: 'Acne', icon: '🙂', search: 'Dermatologist' }
							].map((c, idx) => (
								<Link 
									key={idx} 
									to={`/doctors?specialty=${encodeURIComponent(c.search)}`}
									className="flex flex-col items-center bg-white rounded-xl p-5 hover:shadow-md transition cursor-pointer"
								>
									<div className="text-5xl mb-3">{c.icon}</div>
									<div className="text-sm font-medium text-gray-700 text-center">{c.label}</div>
								</Link>
							))
						)}
					</div>
				</div>
			</section>

			{/* Lab Services Section */}
			<section className="py-8 md:py-16 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center mb-8 md:mb-12">
						<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">Laboratory Services</h2>
						<p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-4 px-4">
							State-of-the-art diagnostic services including blood tests, X-rays, ultrasounds, and more with 50% discount.
						</p>
						<Link to="/lab-tests" className="text-brand hover:underline font-semibold inline-flex items-center gap-2 text-sm md:text-base">
							View All Tests →
						</Link>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
						{labServices.map(service => (
							<div key={service.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition border border-gray-200">
								<div className="text-5xl mb-4">{service.icon}</div>
								<h3 className="text-xl font-semibold text-gray-800 mb-2">{service.name}</h3>
								<p className="text-sm text-gray-600 mb-4">{service.desc}</p>
								<div className="border-t pt-4 space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-gray-500 text-sm">Regular Price:</span>
										<span className="text-gray-400 line-through">{service.price}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-700 font-semibold">Discount:</span>
										<span className="text-brand font-bold text-lg">{service.discount}</span>
									</div>
									<div className="flex items-center justify-between border-t pt-2">
										<span className="text-gray-700 font-semibold">Your Price:</span>
										<span className="text-green-600 font-bold text-xl">
											PKR {Math.round(parseInt(service.price.replace(/[^0-9]/g, '')) * 0.5)}
										</span>
									</div>
								</div>
								<button 
									onClick={() => handleViewDetails(service)}
									className="w-full text-center bg-brand text-white py-2 rounded hover:bg-brand-dark transition mt-4"
								>
									View Details
								</button>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Services Overview */}
			<section className="py-12 md:py-20 bg-gradient-to-b from-white via-gray-50 to-white">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center mb-8 md:mb-16">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
							Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-600">Services</span>
						</h2>
						<p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
							Comprehensive healthcare and educational services for the community
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
						{/* Medical Services Card */}
						<div className="group relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
							<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand/20 to-blue-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
							<div className="relative p-8 flex flex-col h-full">
								<div className="mb-6">
									<div className="w-20 h-20 bg-gradient-to-br from-brand to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
										<span className="text-5xl filter drop-shadow-lg">🏥</span>
									</div>
									<h3 className="text-3xl font-extrabold text-gray-900 mb-3">Medical Services</h3>
									<p className="text-gray-600 leading-relaxed mb-6">
										Access quality healthcare with up to 50% discount on consultations, diagnostics, and medicines.
									</p>
								</div>
								<ul className="text-sm text-gray-700 space-y-3 mb-8 flex-grow">
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Expert doctors consultation</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Diagnostic tests & imaging</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Prescription medicines</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Lab reports & records</span>
									</li>
								</ul>
								<Link 
									to="/doctors" 
									className="mt-auto bg-gradient-to-r from-brand to-brand-dark text-white px-6 py-4 rounded-xl font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
								>
									Explore Now →
								</Link>
							</div>
						</div>

						{/* Educational Programs Card */}
						<div className="group relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
							<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
							<div className="relative p-8 flex flex-col h-full">
								<div className="mb-6">
									<div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
										<span className="text-5xl filter drop-shadow-lg">🎓</span>
									</div>
									<h3 className="text-3xl font-extrabold text-gray-900 mb-3">Educational Programs</h3>
									<p className="text-gray-600 leading-relaxed mb-6">
										Free and subsidized courses in IT, languages, and vocational skills with 70% discount.
									</p>
								</div>
								<ul className="text-sm text-gray-700 space-y-3 mb-8 flex-grow">
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">IT & Computer courses</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Language training</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Vocational skills</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Certified programs</span>
									</li>
								</ul>
								<Link 
									to="/courses" 
									className="mt-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
								>
									Explore Now →
								</Link>
							</div>
						</div>

						{/* Blood Bank Services Card */}
						<div className="group relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
							<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
							<div className="relative p-8 flex flex-col h-full">
								<div className="mb-6">
									<div className="w-20 h-20 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
										<span className="text-5xl filter drop-shadow-lg">🩸</span>
									</div>
									<h3 className="text-3xl font-extrabold text-gray-900 mb-3">Blood Bank</h3>
									<p className="text-gray-600 leading-relaxed mb-6">
										Access blood units when needed. Request blood donations and manage inventory efficiently.
									</p>
								</div>
								<ul className="text-sm text-gray-700 space-y-3 mb-8 flex-grow">
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Blood unit requests</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">All blood types available</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Emergency blood supply</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Safe & tested blood</span>
									</li>
								</ul>
								<Link 
									to="/login" 
									className="mt-auto bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 rounded-xl font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
								>
									Explore Now →
								</Link>
							</div>
						</div>

						{/* Pharmacy Services Card */}
						<div className="group relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
							<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
							<div className="relative p-8 flex flex-col h-full">
								<div className="mb-6">
									<div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
										<span className="text-5xl filter drop-shadow-lg">💊</span>
									</div>
									<h3 className="text-3xl font-extrabold text-gray-900 mb-3">Pharmacy Services</h3>
									<p className="text-gray-600 leading-relaxed mb-6">
										Affordable medicines with 50% discount on all prescriptions for registered patients.
									</p>
								</div>
								<ul className="text-sm text-gray-700 space-y-3 mb-8 flex-grow">
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Quality medicines</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Prescription management</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Medicine delivery</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="text-xl">✅</span>
										<span className="font-medium">Health consultations</span>
									</li>
								</ul>
								<Link 
									to="/pharmacy" 
									className="mt-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
								>
									Explore Now →
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Call to Action */}
			<section className="py-12 md:py-16 bg-brand text-white">
				<div className="max-w-4xl mx-auto px-4 text-center">
					<h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Get Started?</h2>
					<p className="text-lg md:text-xl mb-6 md:mb-8 px-4">
						Join thousands of families benefiting from our healthcare and education services.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap px-4">
						<Link 
							to="/login" 
							className="bg-white text-brand px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition w-full sm:w-auto"
						>
							Register Now
						</Link>
						<Link 
							to="/demo" 
							className="bg-transparent border-2 border-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand transition w-full sm:w-auto"
						>
							View Demo
						</Link>
						<Link 
							to="/about" 
							className="bg-transparent border-2 border-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand transition w-full sm:w-auto"
						>
							Learn More
						</Link>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-8 md:py-12 bg-gray-100">
				<div className="max-w-7xl mx-auto px-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
						<div>
							<div className="text-4xl font-bold text-brand mb-2">50%</div>
							<div className="text-gray-600">Medical Discount</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-brand mb-2">70%</div>
							<div className="text-gray-600">Education Discount</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-brand mb-2">{doctors.length}+</div>
							<div className="text-gray-600">Expert Doctors</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-brand mb-2">6+</div>
							<div className="text-gray-600">Lab Services</div>
						</div>
					</div>
				</div>
			</section>

			{/* Map Section */}
			<section className="py-8 md:py-12 bg-white">
				<div className="max-w-7xl mx-auto px-4">
					<div className="mb-6 md:mb-8 text-center">
						<h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Find Us</h2>
						<p className="text-gray-600">Visit our location</p>
					</div>
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="h-96 w-full">
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
			</section>

			{/* Lab Selection Modal */}
			{selectedTest && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
							<div>
								<h2 className="text-2xl font-bold text-gray-900">
									{selectedTest.icon} {selectedTest.name}
								</h2>
								<p className="text-gray-600 mt-1">{selectedTest.desc}</p>
							</div>
							<button
								onClick={closeLabModal}
								className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
							>
								×
							</button>
						</div>

						<div className="p-6">
							{/* Search Bar */}
							{labs.length > 0 && (
								<div className="mb-6">
									<div className="relative">
										<input
											type="text"
											placeholder="Search labs by name, location, or services..."
											value={labSearchQuery}
											onChange={e => setLabSearchQuery(e.target.value)}
											className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
										/>
										<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
										{labSearchQuery && (
											<button
												onClick={() => setLabSearchQuery('')}
												className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
											>
												×
											</button>
										)}
									</div>
									{labSearchQuery && (
										<p className="text-sm text-gray-600 mt-2">
											{filteredLabs.length} lab{filteredLabs.length !== 1 ? 's' : ''} found
										</p>
									)}
								</div>
							)}

							{labsLoading ? (
								<div className="text-center py-12">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent mb-4"></div>
									<p className="text-gray-600">Loading labs...</p>
								</div>
							) : labs.length === 0 ? (
								<div className="text-center py-12">
									<div className="text-6xl mb-4">🧪</div>
									<p className="text-gray-900 font-semibold text-lg mb-2">No labs available</p>
									<p className="text-gray-600">There are no registered labs at the moment. Please check back later.</p>
								</div>
							) : filteredLabs.length === 0 ? (
								<div className="text-center py-12">
									<div className="text-6xl mb-4">🔍</div>
									<p className="text-gray-900 font-semibold text-lg mb-2">No labs found</p>
									<p className="text-gray-600">No labs match your search query. Try a different search term.</p>
									<button
										onClick={() => setLabSearchQuery('')}
										className="mt-4 text-brand hover:underline"
									>
										Clear search
									</button>
								</div>
							) : (
								<div className="space-y-4">
									<p className="text-gray-700 mb-4 font-semibold">
										Select a lab to proceed with {selectedTest.name}:
									</p>
									{filteredLabs.map(lab => (
										<div
											key={lab.id}
											className={`border-2 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer ${
												selectedLab?.id === lab.id
													? 'border-brand bg-brand/5'
													: 'border-gray-200 hover:border-brand/50'
											}`}
											onClick={(e) => {
												// Prevent event bubbling if clicking on button
												if (e.target.tagName === 'BUTTON') return;
												handleSelectLab(lab);
											}}
										>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-3">
														<div className="text-4xl">🧪</div>
														<div>
															<h3 className="text-xl font-bold text-gray-900">{lab.name}</h3>
															{lab.location && (
																<p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
																	📍 {lab.location}
																</p>
															)}
														</div>
													</div>

													{lab.contact_info && (
														<div className="mb-3">
															<p className="text-gray-700 text-sm">
																<span className="font-semibold">Contact:</span> {lab.contact_info}
															</p>
														</div>
													)}

													{lab.services && lab.services.length > 0 && (
														<div>
															<p className="text-sm font-semibold text-gray-700 mb-2">Available Services:</p>
															<div className="flex flex-wrap gap-2">
																{lab.services.map((service, idx) => (
																	<span
																		key={idx}
																		className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
																	>
																		{service}
																	</span>
																))}
															</div>
														</div>
													)}
												</div>

												<div className="ml-4">
													{selectedLab?.id === lab.id ? (
														<div className="bg-brand text-white px-4 py-2 rounded-lg font-semibold">
															✓ Selected
														</div>
													) : (
														<button 
															onClick={(e) => {
																e.stopPropagation();
																handleSelectLab(lab);
															}}
															className="bg-gray-100 hover:bg-brand hover:text-white text-gray-700 px-4 py-2 rounded-lg font-semibold transition"
														>
															Select
														</button>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{selectedLab && (
							<div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-between items-center">
								<div>
									<p className="text-sm text-gray-600">Selected Lab:</p>
									<p className="font-semibold text-gray-900">{selectedLab.name}</p>
								</div>
								<div className="flex gap-3">
									<button
										onClick={closeLabModal}
										className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition"
									>
										Cancel
									</button>
									<button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											openBookingModal();
										}}
										className="bg-brand hover:bg-brand-dark text-white px-6 py-2 rounded-lg font-semibold transition"
									>
										Proceed with Booking
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Booking Modal */}
			{showBookingModal && selectedLab && selectedTest && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
							<div>
								<h2 className="text-2xl font-bold text-gray-900">
									Book {selectedTest.name}
								</h2>
								<p className="text-gray-600 mt-1">Lab: {selectedLab.name}</p>
							</div>
							<button
								onClick={closeBookingModal}
								className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
							>
								×
							</button>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Test Description (Optional)
								</label>
								<textarea
									value={bookingForm.test_description}
									onChange={e => setBookingForm(prev => ({ ...prev, test_description: e.target.value }))}
									placeholder={selectedTest.desc}
									className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
									rows="3"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Upload Prescription (Optional)
								</label>
								<label className="cursor-pointer inline-block">
									<span className="inline-block bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-50">
										Choose File
									</span>
									<input
										type="file"
										accept="image/*,.pdf"
										onChange={async (e) => {
											const file = e.target.files?.[0];
											if (file) {
												try {
													await handlePrescriptionUpload(file);
												} catch (err) {
													console.error('Upload error:', err);
												}
											}
										}}
										disabled={uploadingPrescription}
										className="hidden"
									/>
								</label>
								{uploadingPrescription && (
									<p className="text-sm text-blue-600 mt-2">Uploading prescription...</p>
								)}
								{bookingForm.prescription_url && !uploadingPrescription && (
									<p className="text-sm text-green-600 mt-2">✓ Prescription uploaded successfully</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Additional Remarks (Optional)
								</label>
								<textarea
									value={bookingForm.remarks}
									onChange={e => setBookingForm(prev => ({ ...prev, remarks: e.target.value }))}
									placeholder="Any special instructions or notes..."
									className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
									rows="3"
								/>
							</div>

							<div className="flex gap-3 pt-4">
								<button
									onClick={closeBookingModal}
									disabled={booking}
									className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmBooking}
									disabled={booking || uploadingPrescription}
									className="flex-1 bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{booking ? 'Booking...' : 'Confirm Booking'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
