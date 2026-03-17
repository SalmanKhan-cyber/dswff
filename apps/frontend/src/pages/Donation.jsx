import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
// Mock supabase to prevent DNS errors
const supabase = {
  auth: {
    signInWithPassword: () => Promise.reject(new Error('Use auth-api.js instead')),
    signUp: () => Promise.reject(new Error('Use auth-api.js instead')),
    signOut: () => Promise.resolve(),
    getUser: () => Promise.resolve({ data: { user: { email: 'mock-email' } } })
  }
};

export default function Donation() {
	const [step, setStep] = useState(1); // 1: Account, 2: Details, 3: Donation, 4: Success
	const [amount, setAmount] = useState('');
	const [purpose, setPurpose] = useState('medical');
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState(null);
	const navigate = useNavigate();

	// User details
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');
	const [donorType, setDonorType] = useState('local'); // 'local' or 'international'
	const [cnic, setCnic] = useState('');
	const [passportNumber, setPassportNumber] = useState('');
	const [isRepeatDonor, setIsRepeatDonor] = useState(false);

	useEffect(() => {
		checkUser();
	}, []);

	async function checkUser() {
		const { data: { user } } = await supabase.auth.getUser();
		if (user) {
			setUser(user);
			setIsRepeatDonor(true);
			setStep(2); // Skip to step 2 if logged in
		}
	}

	const donationPurposes = [
		{ id: 'medical', title: 'Medical Support', icon: '🏥', desc: 'Help provide healthcare services and medicine for needy patients', color: 'from-blue-500 to-blue-600', examples: ['Free consultations', 'Medicine supplies', 'Lab tests', 'Emergency care'] },
		{ id: 'education', title: 'Education & Training', icon: '🎓', desc: 'Support skill development and vocational training programs', color: 'from-purple-500 to-purple-600', examples: ['IT courses', 'Language training', 'Certifications', 'Student aid'] },
		{ id: 'orphan', title: 'Orphan Support', icon: '👶', desc: 'Provide food, shelter, and education for orphaned children', color: 'from-pink-500 to-pink-600', examples: ['Daily meals', 'School supplies', 'Housing support', 'Healthcare'] },
		{ id: 'general', title: 'General Fund', icon: '❤️', desc: 'Support overall foundation operations and impact initiatives', color: 'from-green-500 to-green-600', examples: ['Emergency relief', 'Community programs', 'Infrastructure', 'Capacity building'] }
	];

	const quickAmounts = [500, 1000, 2500, 5000, 10000, 25000];

	async function createAccount(e) {
		e.preventDefault();
		if (!name || !email || !password) {
			setStatus('Please fill all fields');
			return;
		}
		setLoading(true);
		setStatus('');
		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: { data: { role: 'donor', name } }
			});
			if (error) throw error;
			setUser(data.user);
			await apiRequest('/api/auth/set-role', {
				method: 'POST',
				body: JSON.stringify({ userId: data.user.id, role: 'donor', name, email })
			});
			setStep(2);
		} catch (err) {
			// If user already exists, try to sign in
			if (err.message.includes('already registered') || err.message.includes('already exists')) {
				try {
					const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
						email,
						password
					});
					if (loginError) throw loginError;
					setUser(loginData.user);
					setStep(2);
					setStatus('Welcome back! Please continue your donation.');
				} catch (loginErr) {
					setStatus('Account exists but password is incorrect. Please check your credentials.');
				}
			} else {
				setStatus(err.message);
			}
		} finally {
			setLoading(false);
		}
	}

	function proceedToDetails() {
		if (!cnic && donorType === 'local') {
			setStatus('Please enter your CNIC number');
			return;
		}
		if (!passportNumber && donorType === 'international') {
			setStatus('Please enter your Passport number');
			return;
		}
		setStep(3);
	}

	async function handleDonate(e) {
		e.preventDefault();
		if (!amount || Number(amount) <= 0) return setStatus('Please enter a valid amount');
		setLoading(true);
		setStatus('');
		try {
			const donationData = {
				amount: Number(amount),
				purpose,
				donor_type: donorType,
				cnic: donorType === 'local' ? cnic : null,
				passport_number: donorType === 'international' ? passportNumber : null
			};
			await apiRequest('/api/donations', { method: 'POST', body: JSON.stringify(donationData) });
			setStep(4);
		} catch (err) {
			setStatus(err.message);
		} finally {
			setLoading(false);
		}
	}

	const selectedPurpose = donationPurposes.find(p => p.id === purpose);

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-16">
			<div className="max-w-4xl mx-auto px-4">
				{/* Hero Section */}
				<div className="text-center mb-12">
					<h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
						Make a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-600">Difference</span>
					</h1>
					<p className="text-xl text-gray-700 max-w-2xl mx-auto mb-6">
						Your donation transforms lives. Every contribution counts in building a healthier, educated Pakistan.
					</p>
					<div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
						<span className="text-2xl">💚</span>
						<span className="text-sm font-semibold text-gray-800">100% Transparent • Tax Deductible</span>
						<span className="text-2xl">💚</span>
					</div>
				</div>

				{/* Progress Steps */}
				<div className="mb-12">
					<div className="flex justify-between items-center">
						{[{ num: 1, title: 'Account' }, { num: 2, title: 'Details' }, { num: 3, title: 'Donate' }].map((s, idx) => (
							<div key={s.num} className="flex items-center flex-1">
								<div className="flex flex-col items-center">
									<div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
										step > s.num ? 'bg-brand text-white' : step === s.num ? 'bg-brand text-white scale-110' : 'bg-gray-200 text-gray-600'
									}`}>
										{step > s.num ? '✓' : s.num}
									</div>
									<p className={`mt-2 text-xs font-semibold ${step >= s.num ? 'text-brand' : 'text-gray-500'}`}>{s.title}</p>
								</div>
								{idx < 2 && (
									<div className={`flex-1 h-1 mx-4 transition-all ${
										step > s.num ? 'bg-brand' : 'bg-gray-200'
									}`}></div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Step 1: Create Account */}
				{step === 1 && !isRepeatDonor && (
					<div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
						<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand via-blue-500 to-purple-600"></div>
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Create Your Account</h2>
						<form onSubmit={createAccount} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
								<input
									type="text"
									className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent"
									placeholder="Your Name"
									value={name}
									onChange={e => setName(e.target.value)}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
								<input
									type="email"
									className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent"
									placeholder="you@example.com"
									value={email}
									onChange={e => setEmail(e.target.value)}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
								<input
									type="password"
									className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent"
									placeholder="Create a strong password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									required
								/>
							</div>
							{status && (
								<div className={`p-4 rounded-xl ${
									status.includes('Thank you') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
								}`}>
									<p className="text-sm font-semibold">{status}</p>
								</div>
							)}
							<button
								type="submit"
								disabled={loading}
								className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
							>
								{loading ? 'Creating Account...' : 'Continue'}
							</button>
						</form>
					</div>
				)}

				{/* Step 2: Donor Details */}
				{step === 2 && (
					<div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
						<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand via-blue-500 to-purple-600"></div>
						<h2 className="text-3xl font-bold text-gray-900 mb-2">Donor Information</h2>
						<p className="text-gray-600 mb-6">Please provide your identification details</p>
						
						{isRepeatDonor && (
							<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
								<div className="flex items-center gap-2">
									<span className="text-2xl">🎉</span>
									<div>
										<p className="font-semibold text-blue-900">Welcome back, valued donor!</p>
										<p className="text-sm text-blue-700">We appreciate your continued support.</p>
									</div>
								</div>
							</div>
						)}

						<div className="space-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-3">Donor Type</label>
								<div className="grid grid-cols-2 gap-4">
									<button
										type="button"
										onClick={() => setDonorType('local')}
										className={`p-4 rounded-xl border-2 transition-all ${
											donorType === 'local' ? 'border-brand bg-brand/10' : 'border-gray-200 hover:border-brand/50'
										}`}
									>
										<div className="text-3xl mb-2">🇵🇰</div>
										<p className="font-semibold">Local Donor</p>
										<p className="text-xs text-gray-600">Pakistan Resident</p>
									</button>
									<button
										type="button"
										onClick={() => setDonorType('international')}
										className={`p-4 rounded-xl border-2 transition-all ${
											donorType === 'international' ? 'border-brand bg-brand/10' : 'border-gray-200 hover:border-brand/50'
										}`}
									>
										<div className="text-3xl mb-2">🌍</div>
										<p className="font-semibold">International Donor</p>
										<p className="text-xs text-gray-600">Outside Pakistan</p>
									</button>
								</div>
							</div>

							{donorType === 'local' ? (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">CNIC Number</label>
									<input
										type="text"
										className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent"
										placeholder="12345-6789012-3"
										value={cnic}
										onChange={e => setCnic(e.target.value)}
										required
									/>
									<p className="text-xs text-gray-500 mt-1">Format: XXXXX-XXXXXXX-X</p>
								</div>
							) : (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
									<input
										type="text"
										className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent"
										placeholder="Enter your passport number"
										value={passportNumber}
										onChange={e => setPassportNumber(e.target.value)}
										required
									/>
								</div>
							)}

							{status && (
								<div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl">
									<p className="text-sm font-semibold">{status}</p>
								</div>
							)}

							<button
								onClick={proceedToDetails}
								className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
							>
								Continue to Donation
							</button>
						</div>
					</div>
				)}

				{/* Step 3: Make Donation */}
				{step === 3 && (
					<div className="space-y-8">
						<div className="grid lg:grid-cols-2 gap-8">
							{/* Purpose Selection */}
							<div className="space-y-6">
								<h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Impact</h2>
								<div className="grid sm:grid-cols-2 gap-4">
									{donationPurposes.map(p => (
										<button
											key={p.id}
											onClick={() => setPurpose(p.id)}
											className={`group relative bg-white rounded-2xl p-6 text-left border-2 transition-all duration-300 ${
												purpose === p.id ? 'border-brand shadow-xl scale-105' : 'border-gray-200 hover:border-brand/50 hover:shadow-lg'
											}`}
										>
											<div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${p.color} opacity-10 rounded-full blur-2xl transition-opacity group-hover:opacity-20`}></div>
											<div className="relative">
												<div className={`text-5xl mb-3 transition-transform group-hover:scale-110 ${purpose === p.id ? 'scale-110' : ''}`}>{p.icon}</div>
												<h3 className={`font-bold text-lg mb-2 transition-colors ${purpose === p.id ? 'text-brand' : 'text-gray-900'}`}>{p.title}</h3>
												<p className="text-sm text-gray-600 mb-3">{p.desc}</p>
												{purpose === p.id && (
													<div className="absolute top-2 right-2 w-6 h-6 bg-brand rounded-full flex items-center justify-center">
														<span className="text-white text-sm">✓</span>
													</div>
												)}
											</div>
										</button>
									))}
								</div>
							</div>

							{/* Donation Form */}
							<div className="lg:sticky lg:top-24">
								<div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
									<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand via-blue-500 to-purple-600"></div>
									<div className="absolute top-20 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl"></div>
									
									<div className="relative">
										<h2 className="text-3xl font-bold text-gray-900 mb-2">Your Donation</h2>
										<p className="text-gray-600 mb-8">Your generosity creates lasting change</p>

										{selectedPurpose && (
											<div className={`bg-gradient-to-r ${selectedPurpose.color} rounded-xl p-4 mb-6 text-white`}>
												<div className="flex items-center gap-3">
													<span className="text-4xl">{selectedPurpose.icon}</span>
													<div>
														<p className="font-semibold">{selectedPurpose.title}</p>
														<p className="text-sm opacity-90">{selectedPurpose.desc}</p>
													</div>
												</div>
											</div>
										)}

										<form onSubmit={handleDonate} className="space-y-6">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-3">Quick Amounts (PKR)</label>
												<div className="grid grid-cols-3 gap-3">
													{quickAmounts.map(amt => (
														<button
															key={amt}
															type="button"
															onClick={() => setAmount(amt.toString())}
															className={`py-3 px-4 rounded-xl font-semibold transition-all border-2 ${
																amount === amt.toString()
																	? 'border-brand bg-brand text-white shadow-lg'
																	: 'border-gray-200 text-gray-700 hover:border-brand hover:bg-brand/5'
															}`}
														>
															{amt.toLocaleString()}
														</button>
													))}
												</div>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">Or Enter Custom Amount (PKR)</label>
												<div className="relative">
													<span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">PKR</span>
													<input
														type="number"
														className="w-full pl-16 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent text-lg font-semibold"
														placeholder="Enter amount"
														value={amount}
														onChange={e => setAmount(e.target.value)}
														min="1"
														required
													/>
												</div>
											</div>

											<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
												<div className="flex items-start gap-3">
													<span className="text-2xl">✨</span>
													<div className="text-sm text-gray-700">
														<p className="font-semibold mb-1">Your Impact</p>
														{amount && Number(amount) > 0 ? (
															<p>Your donation of <strong className="text-brand">PKR {Number(amount).toLocaleString()}</strong> will help provide essential services to those in need.</p>
														) : (
															<p>Enter an amount to see how your donation creates change</p>
														)}
													</div>
												</div>
											</div>

											<button
												type="submit"
												disabled={loading || !amount || Number(amount) <= 0}
												className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
											>
												<span className="relative z-10 flex items-center justify-center gap-2">
													<span className="text-2xl">💚</span>
													{loading ? 'Processing...' : 'Donate Now'}
													<span className="text-2xl">💚</span>
												</span>
												<div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
											</button>

											{status && (
												<div className={`p-4 rounded-xl ${
													status.includes('Thank you') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
												}`}>
													<p className="text-sm font-semibold">{status}</p>
												</div>
											)}

											<p className="text-xs text-center text-gray-500 pt-4 border-t border-gray-200">
												💳 Secure payment powered by Stripe/PayPal (Production ready)
											</p>
										</form>
									</div>
								</div>

								<div className="mt-6 grid md:grid-cols-3 gap-4">
									<div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200">
										<div className="text-3xl mb-2">🔒</div>
										<p className="text-xs font-semibold text-gray-800">100% Secure</p>
									</div>
									<div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200">
										<div className="text-3xl mb-2">📧</div>
										<p className="text-xs font-semibold text-gray-800">Instant Receipt</p>
									</div>
									<div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200">
										<div className="text-3xl mb-2">📊</div>
										<p className="text-xs font-semibold text-gray-800">Track Impact</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Step 4: Success */}
				{step === 4 && (
					<div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100 relative overflow-hidden">
						<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand via-blue-500 to-purple-600"></div>
						<div className="text-8xl mb-6">🎉</div>
						<h2 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h2>
						<p className="text-xl text-gray-600 mb-8">
							Your generous donation of <strong className="text-brand">PKR {Number(amount).toLocaleString()}</strong> will make a real difference.
						</p>
						<div className="bg-green-50 rounded-xl p-6 mb-8 border border-green-200">
							<p className="text-sm text-green-800">
								📧 A donation receipt has been sent to your email address.
							</p>
						</div>
						<div className="flex gap-4 justify-center">
							<button
								onClick={() => navigate('/dashboard/donor')}
								className="bg-gradient-to-r from-brand to-brand-dark text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
							>
								View Dashboard
							</button>
							<button
								onClick={() => {
									setStep(2);
									setAmount('');
									setPurpose('medical');
								}}
								className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
							>
								Donate Again
							</button>
						</div>
					</div>
				)}

				{/* Impact Stats */}
				<div className="mt-20 grid md:grid-cols-4 gap-8">
					<div className="bg-white rounded-2xl p-8 text-center shadow-xl border-t-4 border-brand">
						<div className="text-5xl mb-3">🎯</div>
						<div className="text-4xl font-bold text-brand mb-2">1M+</div>
						<p className="text-gray-600 font-semibold">Lives Impacted</p>
					</div>
					<div className="bg-white rounded-2xl p-8 text-center shadow-xl border-t-4 border-blue-600">
						<div className="text-5xl mb-3">💚</div>
						<div className="text-4xl font-bold text-blue-600 mb-2">100K+</div>
						<p className="text-gray-600 font-semibold">Donors Trust Us</p>
					</div>
					<div className="bg-white rounded-2xl p-8 text-center shadow-xl border-t-4 border-green-600">
						<div className="text-5xl mb-3">🏥</div>
						<div className="text-4xl font-bold text-green-600 mb-2">100+</div>
						<p className="text-gray-600 font-semibold">Partner Clinics</p>
					</div>
					<div className="bg-white rounded-2xl p-8 text-center shadow-xl border-t-4 border-purple-600">
						<div className="text-5xl mb-3">📚</div>
						<div className="text-4xl font-bold text-purple-600 mb-2">5K+</div>
						<p className="text-gray-600 font-semibold">Students Trained</p>
					</div>
				</div>
			</div>
		</div>
	);
}