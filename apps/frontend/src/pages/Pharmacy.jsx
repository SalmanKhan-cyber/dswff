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

export default function Pharmacy() {
	const navigate = useNavigate();
	const [medicines, setMedicines] = useState([]);
	const [cart, setCart] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState('All');
	const [checkingAuth, setCheckingAuth] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [checkoutLoading, setCheckoutLoading] = useState(false);
	const [showCheckoutModal, setShowCheckoutModal] = useState(false);
	const [checkoutForm, setCheckoutForm] = useState({
		shipping_address: '',
		contact_phone: '',
		notes: '',
		// Payment fields
		card_number: '',
		expiry_month: '',
		expiry_year: '',
		cvv: '',
		cardholder_name: '',
		save_card: false,
		payment_method_id: null
	});
	const [savedCards, setSavedCards] = useState([]);
	const [useSavedCard, setUseSavedCard] = useState(false);
	const [selectedCardId, setSelectedCardId] = useState(null);
	const [failedImages, setFailedImages] = useState(new Set());

	useEffect(() => {
		fetchMedicines();
		checkAuthStatus();
	}, []);

	// Check authentication status
	async function checkAuthStatus() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			setIsAuthenticated(!!session);
		} catch (err) {
			console.error('Error checking auth status:', err);
			setIsAuthenticated(false);
		} finally {
			setCheckingAuth(false);
		}
	}

	async function fetchMedicines() {
		try {
			const { data, error } = await supabase
				.from('pharmacy_inventory')
				.select('*')
				.order('name', { ascending: true });
			
			if (!error) {
				setMedicines(data || []);
			}
		} catch (err) {
			console.error('Error fetching medicines:', err);
		} finally {
			setLoading(false);
		}
	}

	const categories = ['All', ...new Set(medicines.map(m => m.category))];

	// Get medicine icon based on category
	const getMedicineIcon = (category) => {
		const icons = {
			'Pain Relief & Analgesics': '💊',
			'Antibiotics': '🦠',
			'Cardiovascular': '❤️',
			'Diabetes': '🩺',
			'Gastrointestinal': '🍯'
		};
		return icons[category] || '💊';
	};

	const filteredMedicines = medicines.filter(medicine => {
		const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			medicine.category.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = selectedCategory === 'All' || medicine.category === selectedCategory;
		return matchesSearch && matchesCategory && medicine.stock_quantity > 0;
	});

	const addToCart = (medicine) => {
		const existingItem = cart.find(item => item.medicine_id === medicine.medicine_id);
		if (existingItem) {
			setCart(cart.map(item =>
				item.medicine_id === medicine.medicine_id
					? { ...item, quantity: item.quantity + 1 }
					: item
			));
		} else {
			setCart([...cart, { ...medicine, quantity: 1 }]);
		}
	};

	const removeFromCart = (medicineId) => {
		setCart(cart.filter(item => item.medicine_id !== medicineId));
	};

	const updateQuantity = (medicineId, newQuantity) => {
		if (newQuantity <= 0) {
			removeFromCart(medicineId);
		} else {
			setCart(cart.map(item =>
				item.medicine_id === medicineId
					? { ...item, quantity: newQuantity }
					: item
			));
		}
	};

	const getTotalPrice = () => {
		return cart.reduce((total, item) => {
			const discountPrice = item.price * (1 - (item.discount_percentage / 100));
			return total + (discountPrice * item.quantity);
		}, 0);
	};

	const handleCheckout = async () => {
		if (!isAuthenticated) {
			alert('Please login to proceed with checkout');
			navigate('/login');
			return;
		}

		// Fetch saved cards when opening checkout
		await fetchSavedCards();
		setShowCheckoutModal(true);
	};

	// Fetch saved payment methods
	const fetchSavedCards = async () => {
		try {
			const res = await apiRequest('/api/pharmacy/payment-methods');
			setSavedCards(res.payment_methods || []);
			if (res.payment_methods && res.payment_methods.length > 0) {
				const defaultCard = res.payment_methods.find(card => card.is_default) || res.payment_methods[0];
				setSelectedCardId(defaultCard.id);
				setUseSavedCard(true);
			}
		} catch (err) {
			console.error('Error fetching saved cards:', err);
			setSavedCards([]);
		}
	};

	// Format card number with spaces
	const formatCardNumber = (value) => {
		const cleaned = value.replace(/\s/g, '');
		const matches = cleaned.match(/.{1,4}/g);
		return matches ? matches.join(' ') : cleaned;
	};

	// Detect card brand
	const detectCardBrand = (cardNumber) => {
		const cleaned = cardNumber.replace(/\s/g, '');
		if (cleaned.startsWith('4')) return 'visa';
		if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
		if (cleaned.startsWith('3')) return 'amex';
		return 'unknown';
	};

	const submitOrder = async () => {
		if (!checkoutForm.shipping_address || !checkoutForm.contact_phone) {
			alert('Please fill in all required fields');
			return;
		}

		// Validate payment
		if (!useSavedCard) {
			if (!checkoutForm.card_number || !checkoutForm.expiry_month || !checkoutForm.expiry_year || !checkoutForm.cvv) {
				alert('Please enter complete card details');
				return;
			}
		}

		if (cart.length === 0) {
			alert('Your cart is empty');
			return;
		}

		setCheckoutLoading(true);

		try {
			// Validate cart items - only include medicines that still exist in database
			const validCartItems = cart.filter(item => {
				// Check if medicine still exists in the current medicines list
				const medicineExists = medicines.some(med => med.medicine_id === item.medicine_id);
				if (!medicineExists) {
					console.warn(`Medicine ${item.medicine_id} (${item.name}) no longer exists, removing from cart`);
				}
				return medicineExists;
			});

			// If some items were removed, update cart and alert user
			if (validCartItems.length < cart.length) {
				const removedCount = cart.length - validCartItems.length;
				setCart(validCartItems);
				alert(`${removedCount} item(s) are no longer available and were removed from your cart. Please review your order.`);
				setCheckoutLoading(false);
				return;
			}

			// Check if cart is empty after validation
			if (validCartItems.length === 0) {
				alert('All items in your cart are no longer available. Your cart has been cleared.');
				setCart([]);
				setCheckoutLoading(false);
				setShowCheckoutModal(false);
				return;
			}

			// Process payment first
			const totalAmount = getTotalPrice();
			let paymentTransactionId = null;
			let paymentMethodId = useSavedCard ? selectedCardId : null;

			if (useSavedCard && selectedCardId) {
				// Use saved card
				const paymentRes = await apiRequest('/api/pharmacy/process-payment', {
					method: 'POST',
					body: JSON.stringify({
						amount: totalAmount,
						payment_method_id: selectedCardId
					})
				});

				if (!paymentRes.success) {
					alert(paymentRes.message || 'Payment failed. Please try again.');
					setCheckoutLoading(false);
					return;
				}

				paymentTransactionId = paymentRes.transaction_id;
			} else {
				// Process with new card
				const paymentRes = await apiRequest('/api/pharmacy/process-payment', {
					method: 'POST',
					body: JSON.stringify({
						amount: totalAmount,
						card_details: {
							card_number: checkoutForm.card_number.replace(/\s/g, ''),
							expiry_month: parseInt(checkoutForm.expiry_month),
							expiry_year: parseInt(checkoutForm.expiry_year),
							cvv: checkoutForm.cvv,
							cardholder_name: checkoutForm.cardholder_name
						},
						save_card: checkoutForm.save_card
					})
				});

				if (!paymentRes.success) {
					alert(paymentRes.message || 'Payment failed. Please check your card details and try again.');
					setCheckoutLoading(false);
					return;
				}

				paymentTransactionId = paymentRes.transaction_id;
				
				// If card was saved, get the payment method ID
				if (checkoutForm.save_card && paymentRes.payment_method_id) {
					paymentMethodId = paymentRes.payment_method_id;
				}
			}

			// Create order with payment info
			const orderData = {
				items: validCartItems.map(item => ({
					medicine_id: item.medicine_id,
					medicine_name: item.name,
					quantity: item.quantity,
					unit_price: item.price,
					discount_percentage: item.discount_percentage || 0,
					total_price: (item.price * (1 - (item.discount_percentage || 0) / 100)) * item.quantity
				})),
				shipping_address: checkoutForm.shipping_address,
				contact_phone: checkoutForm.contact_phone,
				notes: checkoutForm.notes || '',
				payment_method_id: paymentMethodId,
				payment_transaction_id: paymentTransactionId
			};

			const res = await apiRequest('/api/pharmacy/orders', {
				method: 'POST',
				body: JSON.stringify(orderData),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (res.order) {
				alert('Order placed successfully! Order ID: ' + res.order.id);
				setCart([]);
				setShowCheckoutModal(false);
				setCheckoutForm({
					shipping_address: '',
					contact_phone: '',
					notes: ''
				});
			}
		} catch (err) {
			console.error('Checkout error:', err);
			alert('Failed to place order: ' + (err.message || 'Unknown error'));
		} finally {
			setCheckoutLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			{/* Hero Section */}
			<section className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-16">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center">
						<h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
							Pharmacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-600">Store</span>
						</h1>
						<p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
							Get quality medicines at discounted prices with up to 50% off on prescriptions
						</p>
					</div>
					
					{/* Search Bar */}
					<div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-2 mt-6">
						<div className="flex items-center gap-2">
							<span className="text-2xl ml-2">🔍</span>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="flex-1 px-4 py-3 outline-none text-gray-700"
								placeholder="Search medicines by name or category..."
							/>
							<button className="bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition">
								Search
							</button>
						</div>
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

						{/* Medicines Grid */}
						<div className="lg:col-span-3">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-900">
									Available Medicines ({filteredMedicines.length})
								</h2>
							</div>

							{loading ? (
								<div className="text-center py-12">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
									<p className="mt-4 text-gray-600">Loading medicines...</p>
								</div>
							) : filteredMedicines.length === 0 ? (
								<div className="bg-white rounded-3xl shadow-xl p-12 text-center">
									<div className="text-6xl mb-4">🔍</div>
									<h3 className="text-2xl font-bold text-gray-900 mb-2">No medicines found</h3>
									<p className="text-gray-600">Try adjusting your search or category filter</p>
								</div>
							) : (
								<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
									{filteredMedicines.map((medicine) => {
										const imageFailed = failedImages.has(medicine.medicine_id);
										const imageUrl = medicine.image_url && !imageFailed ? (() => {
											const url = medicine.image_url;
											const cleanUrl = url.split('?')[0];
											const urlHash = url.split('/').pop() || '';
											const cacheBuster = `v=${Date.now()}&h=${urlHash.substring(0, 8)}`;
											return `${cleanUrl}?${cacheBuster}`;
										})() : null;
										
										return (
											<div key={medicine.medicine_id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group">
												<div className="p-6">
													<div className="text-center mb-4">
														{imageUrl ? (
															<img 
																src={imageUrl}
																alt={medicine.name} 
																className="w-24 h-24 mx-auto mb-3 rounded-xl object-cover shadow-lg group-hover:scale-110 transition-transform"
																onError={() => {
																	console.error('Failed to load medicine image:', medicine.image_url);
																	setFailedImages(prev => new Set([...prev, medicine.medicine_id]));
																}}
															/>
														) : (
															<div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
																{getMedicineIcon(medicine.category)}
															</div>
														)}
														<h3 className="text-lg font-bold text-gray-900 mb-1">{medicine.name}</h3>
														<p className="text-sm text-gray-500 mb-2">{medicine.category}</p>
													</div>

													<div className="space-y-3 mb-4">
														{medicine.discount_percentage > 0 && (
															<div className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full inline-block">
																{medicine.discount_percentage}% OFF
															</div>
														)}
														
														<div className="flex items-center justify-between">
															<span className="text-gray-600 text-sm">Price:</span>
															<div className="flex items-center gap-2">
																{medicine.discount_percentage > 0 && (
																	<span className="text-gray-400 line-through text-sm">
																		PKR {medicine.price}
																	</span>
																)}
																<span className="text-brand font-bold text-lg">
																	PKR {(medicine.price * (1 - medicine.discount_percentage / 100)).toFixed(0)}
																</span>
															</div>
														</div>

														<div className="flex items-center justify-between">
															<span className="text-gray-600 text-sm">Stock:</span>
															<span className={`font-semibold ${
																medicine.stock_quantity > 10 ? 'text-green-600' : 'text-orange-600'
															}`}>
																{medicine.stock_quantity} units
															</span>
														</div>
													</div>

													<button
														onClick={() => addToCart(medicine)}
														className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
													>
														Add to Cart
													</button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Cart Sidebar */}
			{cart.length > 0 && (
				<div className="fixed bottom-4 right-4 z-50">
					<button
						onClick={() => {
							document.getElementById('cart-modal').classList.remove('hidden');
						}}
						className="bg-brand text-white px-6 py-4 rounded-full shadow-2xl hover:bg-brand-dark transition flex items-center gap-2 font-bold"
					>
						<span>🛒</span>
						<span>Cart ({cart.length})</span>
						<span className="bg-white text-brand px-3 py-1 rounded-full">
							PKR {getTotalPrice().toFixed(0)}
						</span>
					</button>
				</div>
			)}

			{/* Cart Modal */}
			<div id="cart-modal" className="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
					<div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
						<h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
						<button
							onClick={() => {
								document.getElementById('cart-modal').classList.add('hidden');
							}}
							className="text-gray-500 hover:text-gray-900 text-2xl"
						>
							✕
						</button>
					</div>

					<div className="p-6 space-y-4">
						{cart.map((item) => (
							<div key={item.medicine_id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
								<div className="flex items-center gap-4 flex-1">
									{item.image_url ? (
										<img 
											src={(() => {
												const url = item.image_url;
												const urlHash = url.split('/').pop() || '';
												const cacheBuster = `v=${Date.now()}&h=${urlHash.substring(0, 8)}`;
												return url.includes('?') ? `${url.split('?')[0]}?${cacheBuster}` : `${url}?${cacheBuster}`;
											})()} 
											alt={item.name} 
											className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
											key={`cart-img-${item.medicine_id}-${item.image_url}`}
											loading="eager"
											onError={(e) => {
												e.target.style.display = 'none';
												const fallback = document.createElement('div');
												fallback.className = 'text-4xl flex-shrink-0';
												fallback.textContent = getMedicineIcon(item.category);
												e.target.parentElement.appendChild(fallback);
											}}
										/>
									) : (
										<div className="text-4xl flex-shrink-0">
											{getMedicineIcon(item.category)}
										</div>
									)}
									<div>
										<h3 className="font-bold text-gray-900">{item.name}</h3>
										<p className="text-sm text-gray-600">{item.category}</p>
										<p className="text-brand font-bold">
											PKR {(item.price * (1 - item.discount_percentage / 100)).toFixed(0)} each
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<button
										onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)}
										className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition font-bold"
									>
										-
									</button>
									<span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
									<button
										onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)}
										className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition font-bold"
									>
										+
									</button>
								</div>
							</div>
						))}
					</div>

					<div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
						<div className="flex items-center justify-between mb-4">
							<span className="text-xl font-bold text-gray-900">Total:</span>
							<span className="text-2xl font-bold text-brand">PKR {getTotalPrice().toFixed(0)}</span>
						</div>
						<button 
							onClick={handleCheckout}
							disabled={checkoutLoading || cart.length === 0}
							className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
						</button>
						{!isAuthenticated && (
							<Link
								to="/login"
								className="block text-center mt-3 text-brand hover:underline font-semibold"
							>
								Need to login first
							</Link>
						)}
					</div>
				</div>
			</div>

			{/* Checkout Modal */}
			{showCheckoutModal && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
							<h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
							<button
								onClick={() => setShowCheckoutModal(false)}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>

						<div className="p-6 space-y-4">
							{/* Order Summary */}
							<div className="bg-gray-50 rounded-xl p-4">
								<h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
								<div className="space-y-2 mb-3">
									{cart.map(item => (
										<div key={item.medicine_id} className="flex justify-between text-sm">
											<span>{item.name} x {item.quantity}</span>
											<span className="font-semibold">
												PKR {((item.price * (1 - item.discount_percentage / 100)) * item.quantity).toFixed(0)}
											</span>
										</div>
									))}
								</div>
								<div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
									<span>Total:</span>
									<span className="text-brand">PKR {getTotalPrice().toFixed(0)}</span>
								</div>
							</div>

							{/* Shipping Information */}
							<div>
								<label className="block text-sm font-medium mb-1">Shipping Address *</label>
								<textarea
									value={checkoutForm.shipping_address}
									onChange={e => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})}
									className="w-full border p-3 rounded-lg"
									rows="3"
									placeholder="Enter your complete shipping address"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Contact Phone *</label>
								<input
									type="tel"
									value={checkoutForm.contact_phone}
									onChange={e => setCheckoutForm({...checkoutForm, contact_phone: e.target.value})}
									className="w-full border p-3 rounded-lg"
									placeholder="+92 300 1234567"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Notes (Optional)</label>
								<textarea
									value={checkoutForm.notes}
									onChange={e => setCheckoutForm({...checkoutForm, notes: e.target.value})}
									className="w-full border p-3 rounded-lg"
									rows="2"
									placeholder="Any special instructions..."
								/>
							</div>

							{/* Payment Section */}
							<div className="border-t border-gray-200 pt-4 mt-4">
								<h3 className="font-bold text-gray-900 mb-4">Payment Method</h3>
								
								{/* Saved Cards Option */}
								{savedCards.length > 0 && (
									<div className="mb-4">
										<label className="flex items-center gap-2 cursor-pointer">
											<input
												type="checkbox"
												checked={useSavedCard}
												onChange={(e) => setUseSavedCard(e.target.checked)}
												className="w-4 h-4"
											/>
											<span className="text-sm font-medium">Use saved card</span>
										</label>
										
										{useSavedCard && (
											<div className="mt-2 space-y-2">
												{savedCards.map((card) => (
													<label
														key={card.id}
														className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
															selectedCardId === card.id ? 'border-brand bg-brand/5' : 'border-gray-200'
														}`}
													>
														<input
															type="radio"
															name="savedCard"
															checked={selectedCardId === card.id}
															onChange={() => setSelectedCardId(card.id)}
															className="w-4 h-4"
														/>
														<div className="flex-1">
															<div className="font-semibold text-sm">
																{card.card_brand?.toUpperCase() || 'CARD'} •••• {card.card_number_last4}
															</div>
															<div className="text-xs text-gray-600">
																Expires {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
																{card.is_default && <span className="ml-2 text-brand">(Default)</span>}
															</div>
														</div>
													</label>
												))}
											</div>
										)}
									</div>
								)}

								{/* New Card Form */}
								{!useSavedCard && (
									<div className="space-y-4">
										<div>
											<label className="block text-sm font-medium mb-1">Card Number *</label>
											<input
												type="text"
												value={checkoutForm.card_number}
												onChange={(e) => {
													const formatted = formatCardNumber(e.target.value);
													setCheckoutForm({...checkoutForm, card_number: formatted});
												}}
												className="w-full border p-3 rounded-lg"
												placeholder="1234 5678 9012 3456"
												maxLength="19"
											/>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium mb-1">Expiry Month *</label>
												<select
													value={checkoutForm.expiry_month}
													onChange={(e) => setCheckoutForm({...checkoutForm, expiry_month: e.target.value})}
													className="w-full border p-3 rounded-lg"
												>
													<option value="">Month</option>
													{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
														<option key={month} value={String(month).padStart(2, '0')}>
															{String(month).padStart(2, '0')}
														</option>
													))}
												</select>
											</div>

											<div>
												<label className="block text-sm font-medium mb-1">Expiry Year *</label>
												<select
													value={checkoutForm.expiry_year}
													onChange={(e) => setCheckoutForm({...checkoutForm, expiry_year: e.target.value})}
													className="w-full border p-3 rounded-lg"
												>
													<option value="">Year</option>
													{Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
														<option key={year} value={year}>{year}</option>
													))}
												</select>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium mb-1">CVV *</label>
												<input
													type="text"
													value={checkoutForm.cvv}
													onChange={(e) => setCheckoutForm({...checkoutForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4)})}
													className="w-full border p-3 rounded-lg"
													placeholder="123"
													maxLength="4"
												/>
											</div>

											<div>
												<label className="block text-sm font-medium mb-1">Cardholder Name *</label>
												<input
													type="text"
													value={checkoutForm.cardholder_name}
													onChange={(e) => setCheckoutForm({...checkoutForm, cardholder_name: e.target.value})}
													className="w-full border p-3 rounded-lg"
													placeholder="John Doe"
												/>
											</div>
										</div>

										<label className="flex items-center gap-2 cursor-pointer">
											<input
												type="checkbox"
												checked={checkoutForm.save_card}
												onChange={(e) => setCheckoutForm({...checkoutForm, save_card: e.target.checked})}
												className="w-4 h-4"
											/>
											<span className="text-sm text-gray-600">Save this card for future purchases</span>
										</label>
									</div>
								)}
							</div>
						</div>

						<div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
							<button
								onClick={submitOrder}
								disabled={
									checkoutLoading || 
									!checkoutForm.shipping_address || 
									!checkoutForm.contact_phone ||
									(!useSavedCard && (!checkoutForm.card_number || !checkoutForm.expiry_month || !checkoutForm.expiry_year || !checkoutForm.cvv || !checkoutForm.cardholder_name)) ||
									(useSavedCard && !selectedCardId)
								}
								className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{checkoutLoading ? 'Processing Payment...' : `Pay PKR ${getTotalPrice().toFixed(0)}`}
							</button>
							<button
								onClick={() => setShowCheckoutModal(false)}
								className="w-full mt-3 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
							>
								Cancel
							</button>
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

