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

export default function LabTests() {
	const navigate = useNavigate();
	const [selectedTest, setSelectedTest] = useState(null);
	const [labs, setLabs] = useState([]);
	const [labsLoading, setLabsLoading] = useState(false);
	const [selectedLab, setSelectedLab] = useState(null);
	const [showLabModal, setShowLabModal] = useState(false);
	const [showBookingModal, setShowBookingModal] = useState(false);
	const [bookingForm, setBookingForm] = useState({
		test_description: '',
		remarks: '',
		prescription_file: null,
		prescription_url: ''
	});
	const [uploadingPrescription, setUploadingPrescription] = useState(false);
	const [booking, setBooking] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [labSearchQuery, setLabSearchQuery] = useState('');

	const labTests = [
		{
			id: 1,
			name: 'Blood Tests',
			category: 'Laboratory',
			icon: '🩸',
			description: 'Complete blood count, sugar, cholesterol',
			regularPrice: 500,
			discount: 50,
			tests: [
				'Complete Blood Count (CBC)',
				'Blood Sugar (Fasting)',
				'Blood Sugar (Random)',
				'Cholesterol Profile',
				'Liver Function Tests (LFT)',
				'Kidney Function Tests (KFT)',
				'Hemoglobin',
				'Vitamin D3',
				'Vitamin B12',
				'Iron Studies'
			],
			preparation: 'Fasting for 8-12 hours required',
			reportTime: '24 hours',
			image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 2,
			name: 'X-Ray',
			category: 'Imaging',
			icon: '🦴',
			description: 'Digital X-ray imaging for bones and organs',
			regularPrice: 800,
			discount: 50,
			tests: [
				'Chest X-Ray',
				'Abdomen X-Ray',
				'Spine X-Ray',
				'Extremities X-Ray',
				'Dental X-Ray',
				'Pelvis X-Ray'
			],
			preparation: 'No special preparation needed',
			reportTime: '30 minutes',
			image: 'https://images.unsplash.com/photo-1634938376353-ddf47791b1e6?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 3,
			name: 'Ultrasound',
			category: 'Imaging',
			icon: '📡',
			description: 'Abdominal, pelvic, and pregnancy ultrasound',
			regularPrice: 1200,
			discount: 50,
			tests: [
				'Abdominal Ultrasound',
				'Pelvic Ultrasound',
				'Pregnancy Ultrasound',
				'Thyroid Ultrasound',
				'Breast Ultrasound',
				'Prostate Ultrasound',
				'Doppler Ultrasound'
			],
			preparation: 'Fast for 6-8 hours for abdominal ultrasound',
			reportTime: '2 hours',
			image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 4,
			name: 'ECG',
			category: 'Cardiac',
			icon: '💓',
			description: 'Electrocardiogram for heart health',
			regularPrice: 600,
			discount: 50,
			tests: [
				'Routine ECG',
				'Stress Test ECG',
				'24-hour Holter Monitor',
				'Exercise ECG'
			],
			preparation: 'No special preparation needed',
			reportTime: '1 hour',
			image: 'https://images.unsplash.com/photo-1516548190210-6b75d8eba4c2?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 5,
			name: 'Urine Test',
			category: 'Laboratory',
			icon: '🧪',
			description: 'Complete urine analysis',
			regularPrice: 300,
			discount: 50,
			tests: [
				'Complete Urine Examination',
				'Urine Culture',
				'24-Hour Urine Collection',
				'Microalbumin in Urine'
			],
			preparation: 'Mid-stream urine sample required',
			reportTime: '24 hours',
			image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 6,
			name: 'CT Scan',
			category: 'Imaging',
			icon: '🔬',
			description: 'Advanced imaging for detailed diagnosis',
			regularPrice: 3500,
			discount: 50,
			tests: [
				'CT Head',
				'CT Chest',
				'CT Abdomen',
				'CT Pelvis',
				'CT With Contrast'
			],
			preparation: 'Fasting may be required (varies by test)',
			reportTime: '4 hours',
			image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 7,
			name: 'MRI',
			category: 'Imaging',
			icon: '🧲',
			description: 'Magnetic Resonance Imaging',
			regularPrice: 5000,
			discount: 50,
			tests: [
				'MRI Brain',
				'MRI Spine',
				'MRI Knee',
				'MRI Shoulder',
				'MRI With Contrast'
			],
			preparation: 'No metal objects allowed',
			reportTime: '24 hours',
			image: 'https://images.unsplash.com/photo-1535563060063-34281482b01b?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 8,
			name: 'Cardiac Tests',
			category: 'Cardiac',
			icon: '❤️',
			description: 'Comprehensive heart health evaluation',
			regularPrice: 2500,
			discount: 50,
			tests: [
				'2D Echo',
				'Stress Test',
				'Color Doppler',
				'Treadmill Test (TMT)',
				'Triple Marker Test'
			],
			preparation: 'Fasting for 4 hours',
			reportTime: '4 hours',
			image: 'https://images.unsplash.com/photo-1634938376353-ddf47791b1e6?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 9,
			name: 'Histopathology',
			category: 'Laboratory',
			icon: '🔬',
			description: 'Tissue and biopsy analysis',
			regularPrice: 2000,
			discount: 50,
			tests: [
				'Biopsy Examination',
				'Pap Smear',
				'H&E Staining',
				'Immunohistochemistry'
			],
			preparation: 'As prescribed by doctor',
			reportTime: '3-5 days',
			image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 10,
			name: 'Thyroid Tests',
			category: 'Laboratory',
			icon: '🦋',
			description: 'Complete thyroid profile',
			regularPrice: 1000,
			discount: 50,
			tests: [
				'TSH',
				'T3 (Free)',
				'T4 (Free)',
				'Anti-TPO',
				'Thyroglobulin'
			],
			preparation: 'No special preparation needed',
			reportTime: '24 hours',
			image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 11,
			name: 'Hormone Tests',
			category: 'Laboratory',
			icon: '⚗️',
			description: 'Complete hormonal profile',
			regularPrice: 1500,
			discount: 50,
			tests: [
				'Testosterone',
				'Estrogen',
				'Progesterone',
				'Prolactin',
				'FSH/LH',
				'Growth Hormone'
			],
			preparation: 'As prescribed by doctor',
			reportTime: '2-3 days',
			image: 'https://images.unsplash.com/photo-1535563060063-34281482b01b?q=80&w=800&auto=format&fit=crop'
		},
		{
			id: 12,
			name: 'Allergy Tests',
			category: 'Laboratory',
			icon: '🤧',
			description: 'Identify allergens and sensitivities',
			regularPrice: 1800,
			discount: 50,
			tests: [
				'IgE Panel',
				'Skin Prick Test',
				'Food Allergy Panel',
				'Environmental Allergy Panel'
			],
			preparation: 'Stop antihistamines 48 hours before',
			reportTime: '48 hours',
			image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=800&auto=format&fit=crop'
		}
	];

	const categories = ['All', ...new Set(labTests.map(test => test.category))];
	const [selectedCategory, setSelectedCategory] = useState('All');

	const filteredTests = selectedCategory === 'All' 
		? labTests 
		: labTests.filter(test => test.category === selectedCategory);

	// Check authentication status
	useEffect(() => {
		checkAuthStatus();
	}, []);

	async function checkAuthStatus() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			setIsAuthenticated(!!session);
		} catch (err) {
			console.error('Error checking auth status:', err);
			setIsAuthenticated(false);
		}
	}

	// Fetch labs when modal opens
	useEffect(() => {
		if (showLabModal && selectedTest) {
			fetchLabs();
		}
	}, [showLabModal, selectedTest]);

	async function fetchLabs() {
		setLabsLoading(true);
		try {
			const { data, error } = await supabase
				.from('labs')
				.select('*')
				.order('name', { ascending: true });
			
			if (!error) {
				setLabs(data || []);
			}
		} catch (err) {
			console.error('Error fetching labs:', err);
		} finally {
			setLabsLoading(false);
		}
	}

	const filteredLabs = labs.filter(lab => 
		lab.name?.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
		lab.location?.toLowerCase().includes(labSearchQuery.toLowerCase())
	);

	function handleSelectLab(lab) {
		setSelectedLab(lab);
	}

	function closeLabModal() {
		setShowLabModal(false);
		setSelectedLab(null);
		setLabSearchQuery('');
	}

	function openLabModal() {
		if (!isAuthenticated) {
			// Redirect to login with return URL
			navigate('/login?returnUrl=/lab-tests');
			return;
		}
		setShowLabModal(true);
	}

	async function handlePrescriptionUpload(file) {
		try {
			setUploadingPrescription(true);
			const formData = new FormData();
			formData.append('file', file);
			
			const { data: { session } } = await supabase.auth.getSession();
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
			
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				alert('Please log in to book a test');
				navigate('/login?returnUrl=/lab-tests');
				return;
			}
			
			setBooking(true);
			
			const response = await apiRequest('/api/test-bookings', {
				method: 'POST',
				body: JSON.stringify({
					lab_id: selectedLab.id,
					test_name: selectedTest.name,
					test_description: bookingForm.test_description || selectedTest.description,
					prescription_url: bookingForm.prescription_url,
					remarks: bookingForm.remarks
				})
			});
			
			alert(`Booking confirmed! Your tracking number is: ${response.booking.tracking_number}\n\nShare this number to track your test.`);
			closeLabModal();
			setShowBookingModal(false);
			setSelectedTest(null);
			setBookingForm({ test_description: '', remarks: '', prescription_file: null, prescription_url: '' });
			
			// Navigate to patient dashboard
			navigate('/dashboard/patient');
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			{/* Hero Section */}
			<section className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-16">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center">
						<h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
							Laboratory <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-600">Tests</span>
						</h1>
						<p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
							Quality diagnostic tests with up to 50% discount on all services
						</p>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className="py-16">
				<div className="max-w-7xl mx-auto px-4">
					<div className="grid lg:grid-cols-4 gap-8">
						{/* Categories Sidebar */}
						<div className="lg:col-span-1">
							<div className="bg-white rounded-3xl shadow-xl p-6 sticky top-24">
								<h3 className="text-xl font-bold text-gray-900 mb-4">Categories</h3>
								<div className="space-y-2">
									{categories.map((category, idx) => (
										<button
											key={idx}
											onClick={() => setSelectedCategory(category)}
											className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
												selectedCategory === category
													? 'bg-brand text-white font-semibold'
													: 'bg-gray-50 text-gray-700 hover:bg-brand-lighter'
											}`}
										>
											{category}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Tests Grid */}
						<div className="lg:col-span-3">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-900">
									Available Tests ({filteredTests.length})
								</h2>
							</div>

							<div className="grid sm:grid-cols-2 gap-6">
								{filteredTests.map((test) => (
									<div key={test.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group cursor-pointer" onClick={() => setSelectedTest(test)}>
										<div className="p-6">
											<div className="text-center mb-4">
												<div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
													{test.icon}
												</div>
												<h3 className="text-xl font-bold text-gray-900 mb-1">{test.name}</h3>
												<p className="text-sm text-gray-500 mb-2">{test.category}</p>
											</div>

											<div className="space-y-3">
												<p className="text-sm text-gray-600 text-center">{test.description}</p>
												
												<div className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full inline-block mx-auto flex items-center justify-center">
													{test.discount}% OFF
												</div>

												<div className="flex items-center justify-between border-t pt-3">
													<span className="text-gray-400 line-through text-sm">
														PKR {test.regularPrice}
													</span>
													<span className="text-brand font-bold text-lg">
														PKR {Math.round(test.regularPrice * (1 - test.discount / 100))}
													</span>
												</div>

												<button className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
													Book Test Now
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Test Details Modal */}
			{selectedTest && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTest(null)}>
					<div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
						<div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
							<h2 className="text-2xl font-bold text-gray-900">{selectedTest.name}</h2>
							<button
								onClick={() => setSelectedTest(null)}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>

						<div className="p-6">
							<div className="text-center mb-6">
								<div className="text-8xl mb-4">{selectedTest.icon}</div>
								<div className="bg-red-100 text-red-700 px-4 py-2 rounded-full inline-block font-semibold mb-4">
									{selectedTest.discount}% OFF
								</div>
								<div className="flex items-center justify-center gap-4 mb-4">
									<span className="text-gray-400 line-through text-lg">
										PKR {selectedTest.regularPrice}
									</span>
									<span className="text-brand font-bold text-3xl">
										PKR {Math.round(selectedTest.regularPrice * (1 - selectedTest.discount / 100))}
									</span>
								</div>
							</div>

							<div className="space-y-6">
								<div>
									<h3 className="font-bold text-gray-900 mb-2">Available Tests</h3>
									<div className="grid md:grid-cols-2 gap-2">
										{selectedTest.tests.map((testName, idx) => (
											<div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
												<span className="text-green-600">✓</span>
												<span className="text-sm text-gray-700">{testName}</span>
											</div>
										))}
									</div>
								</div>

								<div className="bg-blue-50 rounded-xl p-4">
									<h3 className="font-bold text-gray-900 mb-2">Preparation Required</h3>
									<p className="text-sm text-gray-700">{selectedTest.preparation}</p>
								</div>

								<div className="bg-green-50 rounded-xl p-4">
									<h3 className="font-bold text-gray-900 mb-2">Report Time</h3>
									<p className="text-sm text-gray-700">{selectedTest.reportTime}</p>
								</div>

								<div>
									<button 
										onClick={openLabModal}
										className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
									>
										Book This Test Now
									</button>
									{!isAuthenticated && (
										<p className="text-xs text-gray-600 text-center mt-2">Need to login first</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Lab Selection Modal */}
			{showLabModal && selectedTest && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
							<div>
								<h2 className="text-2xl font-bold text-gray-900">
									Select Lab for {selectedTest.name}
								</h2>
								<p className="text-gray-600 mt-1">Choose a lab to book your test</p>
							</div>
							<button
								onClick={closeLabModal}
								className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
							>
								×
							</button>
						</div>

						<div className="p-6">
							{/* Search Labs */}
							<div className="mb-6">
								<input
									type="text"
									placeholder="Search labs by name or location..."
									value={labSearchQuery}
									onChange={(e) => setLabSearchQuery(e.target.value)}
									className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-brand focus:ring-2 focus:ring-brand/20"
								/>
							</div>

							{labsLoading ? (
								<div className="text-center py-8">
									<div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand border-t-transparent mb-4"></div>
									<p className="text-gray-600">Loading labs...</p>
								</div>
							) : filteredLabs.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-600">No labs found</p>
								</div>
							) : (
								<div className="space-y-4">
									{filteredLabs.map(lab => (
										<div
											key={lab.id}
											className={`border-2 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer ${
												selectedLab?.id === lab.id
													? 'border-brand bg-brand/5'
													: 'border-gray-200 hover:border-brand/50'
											}`}
											onClick={() => handleSelectLab(lab)}
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
												</div>
												{selectedLab?.id === lab.id && (
													<div className="text-brand text-2xl">✓</div>
												)}
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
										onClick={openBookingModal}
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
									placeholder={selectedTest.description}
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
									onClick={handleConfirmBooking}
									disabled={booking}
									className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-50"
								>
									{booking ? 'Booking...' : 'Confirm Booking'}
								</button>
								<button
									onClick={closeBookingModal}
									disabled={booking}
									className="flex-1 bg-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Back to Home */}
			<div className="max-w-7xl mx-auto px-4 pb-16 text-center">
				<Link to="/" className="text-brand hover:underline font-semibold inline-flex items-center gap-2">
					← Back to Home
				</Link>
			</div>
		</div>
	);
}

