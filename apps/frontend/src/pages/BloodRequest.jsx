import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export default function BloodRequest() {
	const [bloodType, setBloodType] = useState('');
	const [quantity, setQuantity] = useState('');
	const [urgency, setUrgency] = useState('normal');
	const [requesterName, setRequesterName] = useState('');
	const [contactNumber, setContactNumber] = useState('');
	const [notes, setNotes] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [inventory, setInventory] = useState([]);
	const [loadingInventory, setLoadingInventory] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

	useEffect(() => {
		checkAuth();
		loadInventory();
	}, []);

	async function checkAuth() {
		const { data: { session } } = await supabase.auth.getSession();
		setIsLoggedIn(!!session);
	}

	async function loadInventory() {
		setLoadingInventory(true);
		try {
			const res = await apiRequest('/api/blood-bank/inventory/public', { noCache: true });
			setInventory(res.inventory || []);
		} catch (err) {
			console.error('Failed to load inventory:', err);
			setInventory([]);
		} finally {
			setLoadingInventory(false);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setLoading(true);
		setError('');
		setSuccess('');

		if (!bloodType || !quantity) {
			setError('Please select blood type and enter quantity');
			setLoading(false);
			return;
		}

		if (!requesterName || requesterName.trim() === '') {
			setError('Please enter your name');
			setLoading(false);
			return;
		}

		if (!contactNumber || contactNumber.trim() === '') {
			setError('Please enter your contact number');
			setLoading(false);
			return;
		}

		// Check if user is logged in
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) {
			setError('Please log in to request blood. Redirecting to login...');
			setTimeout(() => {
				window.location.href = '/login?returnUrl=/blood-request';
			}, 2000);
			setLoading(false);
			return;
		}

		try {
			await apiRequest('/api/blood-bank/requests', {
				method: 'POST',
				body: JSON.stringify({
					blood_type: bloodType,
					quantity: parseInt(quantity),
					urgency: urgency,
					requester_name: requesterName.trim(),
					contact_number: contactNumber.trim(),
					notes: notes || null
				})
			});

			setSuccess('Blood request submitted successfully! The blood bank will contact you soon.');
			setBloodType('');
			setQuantity('');
			setUrgency('normal');
			setRequesterName('');
			setContactNumber('');
			setNotes('');
			loadInventory(); // Refresh inventory
		} catch (err) {
			setError(err.message || 'Failed to submit request. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	const availableBloodType = inventory.find(inv => inv.blood_type === bloodType);

	return (
		<div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 py-12 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="text-6xl mb-4">🩸</div>
					<h1 className="text-4xl font-bold text-gray-900 mb-2">Blood Request</h1>
					<p className="text-gray-600">Request blood units from our blood bank</p>
				</div>

				<div className="grid md:grid-cols-2 gap-6">
					{/* Request Form */}
					<div className="bg-white rounded-2xl shadow-xl p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">Request Blood</h2>
						
						{!isLoggedIn && (
							<div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
								<p className="text-sm text-yellow-800">
									⚠️ Please <Link to="/login?returnUrl=/blood-request" className="underline font-semibold">log in</Link> to request blood.
								</p>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Your Name *
								</label>
								<input
									type="text"
									value={requesterName}
									onChange={(e) => setRequesterName(e.target.value)}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
									placeholder="Enter your full name"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Blood Type Required *
								</label>
								<select
									value={bloodType}
									onChange={(e) => setBloodType(e.target.value)}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
								>
									<option value="">Select Blood Type</option>
									{bloodTypes.map(type => (
										<option key={type} value={type}>{type}</option>
									))}
								</select>
								{availableBloodType && (
									<p className="text-sm text-green-600 mt-1">
										✅ {availableBloodType.total_quantity} units available
									</p>
								)}
								{bloodType && !availableBloodType && (
									<p className="text-sm text-red-600 mt-1">
										⚠️ Currently unavailable - Request will be processed when stock arrives
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Quantity (Units) *
								</label>
								<input
									type="number"
									min="1"
									value={quantity}
									onChange={(e) => setQuantity(e.target.value)}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
									placeholder="Enter number of units"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Contact Number *
								</label>
								<input
									type="tel"
									value={contactNumber}
									onChange={(e) => setContactNumber(e.target.value)}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
									placeholder="e.g., +92 300 1234567"
								/>
								<p className="text-xs text-gray-500 mt-1">
									Admin will contact you on this number
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Urgency Level *
								</label>
								<select
									value={urgency}
									onChange={(e) => setUrgency(e.target.value)}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
								>
									<option value="normal">Normal</option>
									<option value="urgent">Urgent</option>
									<option value="critical">Critical</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Additional Notes (Optional)
								</label>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={3}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
									placeholder="Any additional information..."
								/>
							</div>

							<button
								type="submit"
								disabled={loading || !isLoggedIn}
								className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? 'Submitting...' : 'Submit Request'}
							</button>
						</form>

						{error && (
							<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
								{error}
							</div>
						)}

						{success && (
							<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
								{success}
							</div>
						)}
					</div>

					{/* Availability */}
					<div className="bg-white rounded-2xl shadow-xl p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">Blood Availability</h2>
						
						{loadingInventory ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
								<p className="text-gray-600">Loading availability...</p>
							</div>
						) : inventory.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-500">No blood inventory available at the moment</p>
							</div>
						) : (
							<div className="space-y-3">
								{inventory.map(item => (
									<div key={item.blood_type} className="border border-gray-200 rounded-lg p-4">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-bold text-red-600">{item.blood_type}</h3>
												<p className="text-sm text-gray-600">
													{item.total_quantity} units available
												</p>
											</div>
											<div className="text-right">
												{item.total_quantity > 10 ? (
													<span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
														In Stock
													</span>
												) : item.total_quantity > 0 ? (
													<span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
														Low Stock
													</span>
												) : (
													<span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
														Out of Stock
													</span>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Info Section */}
				<div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
					<h3 className="text-xl font-bold text-gray-900 mb-4">Important Information</h3>
					<ul className="space-y-2 text-gray-600">
						<li>✅ All blood requests are reviewed by our blood bank staff</li>
						<li>✅ You will be contacted within 24 hours regarding your request</li>
						<li>✅ Critical requests are prioritized</li>
						<li>✅ Please ensure you have valid identification when collecting blood</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

