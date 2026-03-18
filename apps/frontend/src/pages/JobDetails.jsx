import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

export default function JobDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [job, setJob] = useState(null);
	const [loading, setLoading] = useState(true);
	const [applying, setApplying] = useState(false);
	const [applicationSubmitted, setApplicationSubmitted] = useState(false);
	const [user, setUser] = useState(null);
	
	// Application form state
	const [formData, setFormData] = useState({
		applicant_name: '',
		applicant_email: '',
		applicant_phone: '',
		cover_letter: ''
	});

	useEffect(() => {
		fetchJob();
		checkUser();
	}, [id]);

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
					applicant_name: profile.name || '',
					applicant_email: profile.email || '',
					applicant_phone: profile.phone || ''
				}));
			}
		}
	};

	const fetchJob = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_URL}/api/jobs/public/${id}`);
			const data = await response.json();
			if (data.job) {
				setJob(data.job);
			} else {
				navigate('/jobs');
			}
		} catch (error) {
			console.error('Error fetching job:', error);
			navigate('/jobs');
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!formData.applicant_name || !formData.applicant_email || !formData.applicant_phone) {
			alert('Please fill in all required fields');
			return;
		}

		setApplying(true);
		
		try {
			// Get auth token if user is logged in
			const { data: { session } } = await supabase.auth.getSession();
			const headers = {
				'Content-Type': 'application/json'
			};
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`;
			}

			const response = await fetch(`${API_URL}/api/jobs/${id}/apply`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					applicant_name: formData.applicant_name,
					applicant_email: formData.applicant_email,
					applicant_phone: formData.applicant_phone,
					cover_letter: formData.cover_letter || null
				})
			});

			const data = await response.json();
			
			if (response.ok) {
				setApplicationSubmitted(true);
				setFormData({
					applicant_name: '',
					applicant_email: '',
					applicant_phone: '',
					cover_letter: ''
				});
			} else {
				alert(data.error || 'Failed to submit application');
			}
		} catch (error) {
			console.error('Error submitting application:', error);
			alert('Failed to submit application. Please try again.');
		} finally {
			setApplying(false);
		}
	};

	const getEmploymentTypeBadge = (type) => {
		const badges = {
			'full-time': { text: 'Full Time', color: 'bg-green-100 text-green-800' },
			'part-time': { text: 'Part Time', color: 'bg-blue-100 text-blue-800' },
			'contract': { text: 'Contract', color: 'bg-purple-100 text-purple-800' },
			'internship': { text: 'Internship', color: 'bg-orange-100 text-orange-800' }
		};
		return badges[type] || { text: type, color: 'bg-gray-100 text-gray-800' };
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading job details...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!job) {
		return null;
	}

	const badge = getEmploymentTypeBadge(job.employment_type);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-5xl mx-auto">
				{/* Back Button */}
				<Link
					to="/jobs"
					className="inline-flex items-center text-brand hover:text-brand-dark mb-6 font-semibold"
				>
					← Back to Jobs
				</Link>

				{/* Job Details */}
				<div className="bg-white rounded-xl shadow-lg p-8 mb-8">
					<div className="flex items-start justify-between mb-6">
						<div className="flex-1">
							<h1 className="text-4xl font-bold text-gray-900 mb-3">{job.title}</h1>
							{job.department && (
								<p className="text-xl text-brand font-semibold mb-4">{job.department}</p>
							)}
						</div>
						<span className={`px-4 py-2 rounded-full text-sm font-semibold ${badge.color}`}>
							{badge.text}
						</span>
					</div>

					{/* Job Info Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
						{job.location && (
							<div>
								<p className="text-sm text-gray-500 mb-1">Location</p>
								<p className="text-lg font-semibold text-gray-900">📍 {job.location}</p>
							</div>
						)}
						{job.salary_range && (
							<div>
								<p className="text-sm text-gray-500 mb-1">Salary Range</p>
								<p className="text-lg font-semibold text-gray-900">💰 {job.salary_range}</p>
							</div>
						)}
						{job.experience_required && (
							<div>
								<p className="text-sm text-gray-500 mb-1">Experience Required</p>
								<p className="text-lg font-semibold text-gray-900">💼 {job.experience_required}</p>
							</div>
						)}
						{job.education_required && (
							<div>
								<p className="text-sm text-gray-500 mb-1">Education Required</p>
								<p className="text-lg font-semibold text-gray-900">🎓 {job.education_required}</p>
							</div>
						)}
					</div>

					{/* Description */}
					<div className="mb-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
						<div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
							{job.description}
						</div>
					</div>

					{/* Requirements */}
					{job.requirements && (
						<div className="mb-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
							<div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
								{job.requirements}
							</div>
						</div>
					)}
				</div>

				{/* Application Form */}
				{applicationSubmitted ? (
					<div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
						<div className="text-6xl mb-4">✅</div>
						<h2 className="text-2xl font-bold text-green-900 mb-2">Application Submitted!</h2>
						<p className="text-green-700 mb-6 text-lg font-semibold">
							You will be contacted soon.
						</p>
						<p className="text-green-600 mb-6">
							Thank you for your interest. We'll review your application and get back to you.
						</p>
						<Link
							to="/jobs"
							className="inline-block bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition-colors"
						>
							View More Jobs
						</Link>
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Apply for this Position</h2>
						
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Full Name <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										required
										value={formData.applicant_name}
										onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email <span className="text-red-500">*</span>
									</label>
									<input
										type="email"
										required
										value={formData.applicant_email}
										onChange={(e) => setFormData({ ...formData, applicant_email: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Phone Number <span className="text-red-500">*</span>
								</label>
								<input
									type="tel"
									required
									value={formData.applicant_phone}
									onChange={(e) => setFormData({ ...formData, applicant_phone: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Cover Letter (Optional)
								</label>
								<textarea
									rows={6}
									value={formData.cover_letter}
									onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
									placeholder="Tell us why you're interested in this position..."
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								/>
							</div>

							<button
								type="submit"
								disabled={applying}
								className="w-full bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{applying ? 'Submitting...' : 'Submit Application'}
							</button>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}

