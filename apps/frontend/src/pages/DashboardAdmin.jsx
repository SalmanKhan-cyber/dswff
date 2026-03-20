import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, clearCache } from '../lib/api';
// Mock supabase object to prevent DNS errors
const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: { access_token: 'mock-token' } } }),
    signInWithPassword: () => Promise.reject(new Error('Use auth-api.js instead')),
    signUp: () => Promise.reject(new Error('Use auth-api.js instead')),
    refreshSession: () => Promise.resolve({ data: { session: { access_token: 'mock-token' } } })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      }),
      order: () => Promise.resolve({ data: [], error: null })
    })
  })
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const DEFAULT_MEDICINE_FORM = {
	name: '',
	category: '',
	description: '',
	price: 0,
	discount_percentage: 50,
	stock_quantity: 0,
	supplier_info: ''
};

export default function DashboardAdmin() {
	const [activeTab, setActiveTab] = useState('overview');
	const [users, setUsers] = useState([]);
	const [patients, setPatients] = useState([]);
	const [donations, setDonations] = useState([]);
	const [doctors, setDoctors] = useState([]);
	const [teachers, setTeachers] = useState([]);
	const [courses, setCourses] = useState([]);
	const [pharmacyItems, setPharmacyItems] = useState([]);
	const [labReports, setLabReports] = useState([]);
	const [labs, setLabs] = useState([]);
	const [bloodBanks, setBloodBanks] = useState([]);
	const [bloodInventory, setBloodInventory] = useState([]);
	const [bloodRequests, setBloodRequests] = useState([]);
	const [bloodBankTab, setBloodBankTab] = useState('inventory'); // 'banks', 'inventory', 'requests'
	const [showAddBloodInventory, setShowAddBloodInventory] = useState(false);
	const [editingBloodInventory, setEditingBloodInventory] = useState(null);
	const [bloodInventoryForm, setBloodInventoryForm] = useState({ blood_type: '', quantity: '', expiry_date: '', status: 'available' });
	const [specialties, setSpecialties] = useState([]);
	const [conditions, setConditions] = useState([]);
	const [surgeryCategories, setSurgeryCategories] = useState([]);
	const [surgeryBookings, setSurgeryBookings] = useState([]);
	const [homeServicesRequests, setHomeServicesRequests] = useState([]);
	const [jobs, setJobs] = useState([]);
	const [jobApplications, setJobApplications] = useState([]);
	const [selectedJobForApplications, setSelectedJobForApplications] = useState(null);
	const [showAddJob, setShowAddJob] = useState(false);
	const [showEditJob, setShowEditJob] = useState(null);
	const [showApplications, setShowApplications] = useState(false);
	const [jobForm, setJobForm] = useState({
		title: '',
		department: '',
		description: '',
		requirements: '',
		salary: '',
		employment_type: 'full-time',
		location: '',
		deadline: ''
	});
	const [students, setStudents] = useState([]);
	const [editingStudent, setEditingStudent] = useState(null);
	const [showAddStudent, setShowAddStudent] = useState(false);
	const [showEditStudent, setShowEditStudent] = useState(false);
	const [studentForm, setStudentForm] = useState({
		name: '',
		email: '',
		phone: '',
		course_id: '',
		roll_number: '',
		admission_date: '',
		password: '',
		status: 'active'
	});
	const [stats, setStats] = useState({ totalUsers: 0, totalDonations: 0, totalAmount: 0, totalDoctors: 0, totalPatients: 0, totalLabs: 0, totalDonors: 0, totalStudents: 0 });
	const [loading, setLoading] = useState(false);
	const [userRole, setUserRole] = useState(null);
	const [roleWarning, setRoleWarning] = useState(false);
	const [approvingUserId, setApprovingUserId] = useState(null);
	const [rejectingUserId, setRejectingUserId] = useState(null);
	
	// Search State
	const [searchQuery, setSearchQuery] = useState('');
	const [searchCategory, setSearchCategory] = useState('all');
	const [searchResults, setSearchResults] = useState([]);
	const [showSearchResults, setShowSearchResults] = useState(false);
	const [patientSearchQuery, setPatientSearchQuery] = useState('');
	
	// Modals
	const [showAddDoctor, setShowAddDoctor] = useState(false);
	const [showEditDoctor, setShowEditDoctor] = useState(null);
	const [showViewDoctorProfile, setShowViewDoctorProfile] = useState(null);
	const [showAddCourse, setShowAddCourse] = useState(false);
	const [showEditCourse, setShowEditCourse] = useState(null);
	const [showAddMedicine, setShowAddMedicine] = useState(false);
	const [showEditMedicine, setShowEditMedicine] = useState(null);
	const [showEditUserRole, setShowEditUserRole] = useState(null);
	const [newRole, setNewRole] = useState('');
	const [showDonorDetails, setShowDonorDetails] = useState(null);
	const [showAddPatient, setShowAddPatient] = useState(false);
	const [showPatientHistory, setShowPatientHistory] = useState(null);
	const [patientHistoryData, setPatientHistoryData] = useState({ labReports: [], appointments: [] });
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [showBookAppointment, setShowBookAppointment] = useState(null);
	const [appointmentForm, setAppointmentForm] = useState({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
	const [bookingLoading, setBookingLoading] = useState(false);
	const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
	const [doctorImage, setDoctorImage] = useState(null);
	const [doctorImagePreview, setDoctorImagePreview] = useState('');
	const [uploadingDoctorImage, setUploadingDoctorImage] = useState(false);
	const [showAddLab, setShowAddLab] = useState(false);
	const [showAssignLabTest, setShowAssignLabTest] = useState(false);
	const [showAddDonation, setShowAddDonation] = useState(false);
	const [showEditDonation, setShowEditDonation] = useState(null);
	const [showAddTeacher, setShowAddTeacher] = useState(false);
	const [showEditTeacher, setShowEditTeacher] = useState(null);
	const [showViewTeacherProfile, setShowViewTeacherProfile] = useState(null);
	const [receiptSearchId, setReceiptSearchId] = useState('');
	const [searchingReceipt, setSearchingReceipt] = useState(false);
	
	// Forms
	const [doctorForm, setDoctorForm] = useState({ name: '', specialization: '', degrees: '', discount_rate: 50, image_url: '', consultation_fee: '', timing: '', home_services: false });
	const [courseForm, setCourseForm] = useState({ title: '', description: '', duration: '', discount_rate: 70, trainer_id: '' });
	const [medicineForm, setMedicineForm] = useState(() => ({ ...DEFAULT_MEDICINE_FORM }));
	const [medicineImage, setMedicineImage] = useState(null);
	const [medicineImagePreview, setMedicineImagePreview] = useState('');
	const [uploadingMedicineImage, setUploadingMedicineImage] = useState(false);
	const [patientForm, setPatientForm] = useState({ name: '', email: '', password: '', age: '', gender: '', cnic: '', history: '' });
	const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '', image_url: '' });
	const [teacherImage, setTeacherImage] = useState(null);
	const [teacherImagePreview, setTeacherImagePreview] = useState('');
	const [uploadingTeacherImage, setUploadingTeacherImage] = useState(false);
	const [labForm, setLabForm] = useState({ 
		lab_name: '', 
		location: '', 
		contact_info: '', 
		services: [],
		home_services: false,
		// User account fields for lab registration
		user_name: '',
		email: '',
		password: ''
	});
	const [labTestForm, setLabTestForm] = useState({ patient_name: '', lab_id: '', test_type: '', remarks: '' });
	const [testPaperFile, setTestPaperFile] = useState(null);
	const [testPaperPreview, setTestPaperPreview] = useState('');
	const [uploadingTestPaper, setUploadingTestPaper] = useState(false);
	const [specialtyForm, setSpecialtyForm] = useState({ label: '', icon: '', display_order: 0, is_active: true });
	const [conditionForm, setConditionForm] = useState({ label: '', icon: '', search_keyword: '', display_order: 0, is_active: true });
	const [surgeryCategoryForm, setSurgeryCategoryForm] = useState({ name: '', icon: '', description: '', display_order: 0, is_active: true });
	const [showAddSpecialty, setShowAddSpecialty] = useState(false);
	const [showAddCondition, setShowAddCondition] = useState(false);
	const [showAddSurgeryCategory, setShowAddSurgeryCategory] = useState(false);
	const [editingSpecialty, setEditingSpecialty] = useState(null);
	const [editingCondition, setEditingCondition] = useState(null);
	const [editingSurgeryCategory, setEditingSurgeryCategory] = useState(null);
	const [showSpecialtyEmojiPicker, setShowSpecialtyEmojiPicker] = useState(false);
	const [showConditionEmojiPicker, setShowConditionEmojiPicker] = useState(false);
	const [showSurgeryCategoryEmojiPicker, setShowSurgeryCategoryEmojiPicker] = useState(false);
	const [donationForm, setDonationForm] = useState({ 
		amount: '', 
		purpose: 'medical', 
		donor_name: '', 
		donor_email: '', 
		donor_id: '',
		donor_type: 'local',
		cnic: '', 
		passport_number: '' 
	});

	// Add AbortController for request cancellation
	const abortControllerRef = useRef(null);
	const doctorImageInputRef = useRef(null);
	const teacherImageInputRef = useRef(null);
	const medicineImageInputRef = useRef(null);
	const testPaperInputRef = useRef(null);
	
	useEffect(() => {
		// Cancel any pending requests when tab changes
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		
		// Create new AbortController for this tab
		abortControllerRef.current = new AbortController();
		const controller = abortControllerRef.current;
		
		checkUserRole();
		loadData(controller);
		
		// Cleanup on unmount or tab change
		return () => {
			if (controller) {
				controller.abort();
			}
		};
	}, [activeTab]);

	// Add diagnostic function to check authentication and data
	useEffect(() => {
		async function checkAuthStatus() {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				if (!session) {
					console.warn('⚠️ No active session - user may need to log in');
					return;
				}
				console.log('✅ User is authenticated:', {
					userId: session.user.id,
					email: session.user.email
				});
				
				// Check user role
				const { data: userData } = await supabase
					.from('users')
					.select('role')
					.eq('id', session.user.id)
					.single();
				
				console.log('👤 User role:', userData?.role || 'not set');
			} catch (err) {
				console.error('❌ Error checking auth status:', err);
			}
		}
		checkAuthStatus();
	}, []);

	// Auto-refresh pending registrations every 30 seconds when on overview tab
	useEffect(() => {
		if (activeTab !== 'overview') return;
		
		const refreshInterval = setInterval(async () => {
			try {
				console.log('🔄 Auto-refreshing pending registrations...');
				clearCache('/api/users');
				const freshUsers = await apiRequest('/api/users', { noCache: true });
				const loadedUsers = freshUsers.users || [];
				const pendingCount = loadedUsers.filter(u => u && !u.verified).length;
				
				if (pendingCount !== users.filter(u => u && !u.verified).length) {
					console.log(`🆕 Found ${pendingCount} pending registrations (was ${users.filter(u => u && !u.verified).length})`);
					setUsers(loadedUsers);
				}
			} catch (err) {
				console.error('❌ Error auto-refreshing users:', err);
			}
		}, 30000); // Refresh every 30 seconds
		
		return () => clearInterval(refreshInterval);
	}, [activeTab, users]);

	async function checkUserRole() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (session) {
				try {
					const { data: userData } = await supabase
						.from('users')
						.select('role, email')
						.eq('id', session.user.id)
						.single();
					
					const role = userData?.role || session.user.user_metadata?.role || 'patient';
					setUserRole(role);
					
					if (role !== 'admin') {
						setRoleWarning(true);
						console.warn('⚠️ WARNING: You are logged in as', role, 'but accessing admin dashboard. Some features may not work.');
					} else {
						setRoleWarning(false);
					}
				} catch (dbErr) {
					// If users table query fails, try metadata only
					const role = session.user.user_metadata?.role || 'patient';
					setUserRole(role);
					if (role !== 'admin') {
						setRoleWarning(true);
					}
					console.warn('Could not fetch role from users table, using metadata:', role);
				}
			} else {
				setUserRole(null);
				setRoleWarning(false);
			}
		} catch (err) {
			console.error('Error checking user role:', err);
			// Set defaults to prevent crash
			setUserRole('patient');
			setRoleWarning(true);
		}
	}

	// Student management functions
	async function handleAddStudent() {
		try {
			const res = await apiRequest('/api/students/add', {
				method: 'POST',
				body: JSON.stringify(studentForm)
			});
			
			if (res.error) {
				throw new Error(res.error);
			}
			
			// Refresh students list
			await loadStudents();
			alert('Student added successfully');
			
			// Close modal and reset form
			setShowAddStudent(false);
			setStudentForm({
				name: '',
				email: '',
				phone: '',
				course_id: '',
				roll_number: '',
				admission_date: '',
				password: '',
				status: 'active'
			});
		} catch (err) {
			console.error('Error adding student:', err);
			alert('Failed to add student: ' + err.message);
		}
	}

	async function handleDeleteStudent(studentId) {
		try {
			const res = await apiRequest('/api/students/delete', {
				method: 'DELETE',
				body: JSON.stringify({ id: studentId })
			});
			
			if (res.error) {
				throw new Error(res.error);
			}
			
			// Refresh students list
			await loadStudents();
			alert('Student deleted successfully');
		} catch (err) {
			console.error('Error deleting student:', err);
			alert('Failed to delete student: ' + err.message);
		}
	}

	async function loadStudents() {
		try {
			const res = await apiRequest('/api/students');
			setStudents(res.students || []);
		} catch (err) {
			console.error('Error loading students:', err);
			setStudents([]);
		}
	}

	async function loadCourses() {
		try {
			const res = await apiRequest('/api/courses');
			setCourses(res.courses || []);
		} catch (err) {
			console.error('Error loading courses:', err);
			setCourses([]);
		}
	}

	// Search function
	async function handleSearch() {
		if (!searchQuery.trim()) {
			setShowSearchResults(false);
			return;
		}

		setLoading(true);
		setShowSearchResults(true);
		
		try {
			let results = [];

			if (searchCategory === 'all' || searchCategory === 'users') {
				const usersRes = await apiRequest('/api/users');
				const filteredUsers = (usersRes.users || []).filter(user =>
					user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					user.role?.toLowerCase().includes(searchQuery.toLowerCase())
				);
				results.push(...filteredUsers.map(u => ({ type: 'user', data: u })));
			}

			if (searchCategory === 'all' || searchCategory === 'doctors') {
				const { data: doctorsData } = await supabase.from('doctors').select('*');
				const filteredDoctors = (doctorsData || []).filter(doctor =>
					doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					doctor.degrees?.toLowerCase().includes(searchQuery.toLowerCase())
				);
				results.push(...filteredDoctors.map(d => ({ type: 'doctor', data: d })));
			}

			if (searchCategory === 'all' || searchCategory === 'patients') {
				const { data: patientsData } = await supabase.from('patients').select('*, users(*)');
				const filteredPatients = (patientsData || []).filter(patient =>
					patient.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					patient.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					patient.cnic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					patient.gender?.toLowerCase().includes(searchQuery.toLowerCase())
				);
				results.push(...filteredPatients.map(p => ({ type: 'patient', data: p })));
			}

			if (searchCategory === 'all' || searchCategory === 'donations') {
				const donationsRes = await apiRequest('/api/donations/all');
				const filteredDonations = (donationsRes.donations || []).filter(donation =>
					donation.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					donation.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					donation.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					donation.amount?.toString().includes(searchQuery)
				);
				results.push(...filteredDonations.map(d => ({ type: 'donation', data: d })));
			}

			if (searchCategory === 'all' || searchCategory === 'pharmacy') {
				const { data: pharmacyData } = await supabase.from('pharmacy_inventory').select('*');
				const filteredPharmacy = (pharmacyData || []).filter(item =>
					item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.description?.toLowerCase().includes(searchQuery.toLowerCase())
				);
				results.push(...filteredPharmacy.map(p => ({ type: 'pharmacy', data: p })));
			}

			if (searchCategory === 'all' || searchCategory === 'courses') {
				const coursesRes = await apiRequest('/api/courses');
				const filteredCourses = (coursesRes.courses || []).filter(course =>
					course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					course.description?.toLowerCase().includes(searchQuery.toLowerCase())
				);
				results.push(...filteredCourses.map(c => ({ type: 'course', data: c })));
			}

			if (searchCategory === 'all' || searchCategory === 'lab-reports') {
				const { data: labData } = await supabase.from('lab_reports').select('*');
				const filteredLab = (labData || []).filter(lab =>
					lab.test_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					lab.status?.toLowerCase().includes(searchQuery.toLowerCase())
				);
				results.push(...filteredLab.map(l => ({ type: 'lab-report', data: l })));
			}


			setSearchResults(results);
		} catch (err) {
			console.error('Search error:', err);
		} finally {
			setLoading(false);
		}
	}

	async function fetchAdminStats() {
		try {
			return await apiRequest('/api/admin/stats');
		} catch (err) {
			console.warn('Primary stats endpoint failed, trying public fallback...', err);
			const response = await fetch(`${API_URL}/api/admin/stats/public`, {
				method: 'GET',
				credentials: 'omit'
			});
			if (!response.ok) {
				throw new Error('Failed to fetch admin stats from public endpoint');
			}
			return response.json();
		}
	}

	async function loadData(abortController = null) {
		// Check if request was cancelled
		if (abortController?.signal.aborted) {
			return;
		}
		
		setLoading(true);
		const startTime = Date.now(); // Define startTime at the beginning of the function
		try {
			if (activeTab === 'overview') {
				// Clear cache to ensure fresh data (especially for new registrations)
				clearCache('/api/users');
				// Load both stats and users (for pending registrations)
				try {
					const [statsRes, usersRes] = await Promise.allSettled([
						fetchAdminStats(),
						apiRequest('/api/users', { noCache: true }).catch(() => ({ users: [] }))
					]);
					
					// Set stats
					if (statsRes.status === 'fulfilled') {
						setStats(prev => ({ ...prev, ...statsRes.value }));
					}
					
					// Set users (needed for pending registrations display)
					if (usersRes.status === 'fulfilled') {
						const loadedUsers = usersRes.value.users || [];
						console.log(`✅ Loaded ${loadedUsers.length} users for admin dashboard`);
						const pendingCount = loadedUsers.filter(u => !u.verified).length;
						if (pendingCount > 0) {
							console.log(`⏳ Found ${pendingCount} pending registrations:`, loadedUsers.filter(u => !u.verified).map(u => ({ id: u.id, name: u.name, role: u.role, email: u.email })));
						}
						setUsers(loadedUsers);
					} else {
						// Fallback: try to load users separately
						try {
							const fallbackUsers = await apiRequest('/api/users');
							const loadedUsers = fallbackUsers.users || [];
							console.log(`✅ Loaded ${loadedUsers.length} users (fallback)`);
							setUsers(loadedUsers);
						} catch (err) {
							console.error('Failed to load users:', err);
							setUsers([]);
						}
					}
				} catch (statsErr) {
					// Fallback to old method if stats endpoint fails
					console.warn('Stats endpoint failed, using fallback:', statsErr);
					// Fix: Wrap Supabase query in a proper promise
					const doctorsQuery = supabase.from('doctors').select('*', { count: 'exact', head: true });
					const [usersRes, donationsRes, doctorsResult, patientsRes, labsRes] = await Promise.allSettled([
						apiRequest('/api/users').catch(() => ({ users: [] })),
						apiRequest('/api/donations/all').catch(() => ({ donations: [] })),
						doctorsQuery.then(({ count }) => ({ count: count || 0 })).catch(() => ({ count: 0 })),
						apiRequest('/api/patients/all').catch(() => ({ patients: [] })),
						apiRequest('/api/labs').catch(() => ({ labs: [] }))
					]);
					const doctorsData = doctorsResult.status === 'fulfilled' ? doctorsResult.value : { count: 0 };
					const usersData = usersRes.status === 'fulfilled' ? usersRes.value : { users: [] };
					const donationsData = donationsRes.status === 'fulfilled' ? donationsRes.value : { donations: [] };
					const patientsData = patientsRes.status === 'fulfilled' ? patientsRes.value : { patients: [] };
					const labsData = labsRes.status === 'fulfilled' ? labsRes.value : { labs: [] };
					const students = (usersData.users || []).filter(user => user.role === 'student');
					const donors = (usersData.users || []).filter(user => user.role === 'donor');
					
					// IMPORTANT: Set users state so pending registrations can be displayed
					const loadedUsers = usersData.users || [];
					console.log(`✅ Loaded ${loadedUsers.length} users (fallback method)`);
					const pendingCount = loadedUsers.filter(u => !u.verified).length;
					if (pendingCount > 0) {
						console.log(`⏳ Found ${pendingCount} pending registrations`);
					}
					setUsers(loadedUsers);
					
					setStats(prev => ({ 
						...prev, 
						totalUsers: usersData.users?.length || 0,
						totalDonations: donationsData.donations?.length || 0,
						totalDoctors: doctorsData.doctors?.length || 0,
						totalPatients: patientsData.patients?.length || 0,
						totalLabs: labsData.labs?.length || 0,
						totalStudents: students?.length || 0,
						totalDonors: donors?.length || 0
					}));
				}
			} else if (activeTab === 'patients') {
				// Load both patients and doctors (for booking appointments)
				await loadPatientsData();
			} else if (activeTab === 'donations') {
				const res = await apiRequest('/api/donations/all');
				setDonations(res.donations || []);
				const total = res.donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
				setStats(prev => ({ ...prev, totalDonations: res.donations?.length || 0, totalAmount: total }));
			} else if (activeTab === 'doctors') {
				// Use API endpoint instead of direct Supabase query (bypasses RLS)
				try {
					console.log('🔄 Loading doctors...');
					const res = await apiRequest('/api/doctors');
					console.log('✅ Doctors loaded:', res.doctors?.length || 0);
					setDoctors(res.doctors || []);
				} catch (err) {
					console.error('❌ Failed to load doctors:', err);
					alert('Failed to load doctors: ' + err.message + '. Make sure you are logged in.');
					setDoctors([]);
				}
			} else if (activeTab === 'teachers') {
				let teachersList = [];
				try {
					// Try authenticated endpoint first
					const res = await apiRequest('/api/users');
					teachersList = (res.users || []).filter(user => user.role === 'teacher');
				} catch (err) {
					console.warn('⚠️ Authenticated users endpoint failed, trying public endpoint...', err);
					try {
						// Fallback to public endpoint
						const res = await apiRequest('/api/teachers/all-public');
						teachersList = res.teachers || [];
					} catch (publicErr) {
						console.error('❌ Public teachers endpoint also failed:', publicErr);
						// Last resort: direct Supabase query
						try {
							const { data, error } = await supabase
								.from('users')
								.select('*')
								.eq('role', 'teacher')
								.order('created_at', { ascending: false });
							if (!error) {
								teachersList = data || [];
							}
						} catch (supabaseErr) {
							console.error('❌ Direct Supabase query also failed:', supabaseErr);
						}
					}
				}
				
				// Sort teachers
				teachersList.sort((a, b) => {
					const nameA = a.name || a.email || '';
					const nameB = b.name || b.email || '';
					return nameA.localeCompare(nameB);
				});
				
				// If teachers already have profiles from public endpoint, use them
				if (teachersList.length > 0 && teachersList[0].teachers !== undefined) {
					console.log('📋 Using teachers with profiles from public endpoint');
					setTeachers(teachersList);
				} else {
					// Fetch all teacher profiles in a single query instead of N queries (much faster!)
					console.log('📋 Fetching teacher profiles in batch');
					try {
						const teacherIds = teachersList.map(t => t.id);
						if (teacherIds.length > 0) {
							const { data: teacherProfiles } = await supabase
								.from('teachers')
								.select('user_id, specialization, image_url')
								.in('user_id', teacherIds);
							
							// Create a map for quick lookup
							const profileMap = new Map();
							(teacherProfiles || []).forEach(profile => {
								profileMap.set(profile.user_id, profile);
							});
							
							// Merge profiles with teachers
							const teachersWithSpecialization = teachersList.map(teacher => ({
								...teacher,
								teachers: profileMap.get(teacher.id) || null
							}));
							
							setTeachers(teachersWithSpecialization);
						} else {
							setTeachers(teachersList);
						}
					} catch (err) {
						console.error('Error fetching teacher profiles:', err);
						// Fallback: set teachers without profiles
						setTeachers(teachersList.map(t => ({ ...t, teachers: null })));
					}
				}
			} else if (activeTab === 'courses') {
				// Use public endpoint first (no auth required), fallback to authenticated
				try {
					console.log('🔄 Loading courses...');
					let res;
					try {
						res = await apiRequest('/api/courses/public');
						console.log('✅ Courses loaded from public endpoint:', res.courses?.length || 0);
					} catch (publicErr) {
						console.warn('⚠️ Public endpoint failed, trying authenticated:', publicErr);
						res = await apiRequest('/api/courses');
						console.log('✅ Courses loaded from authenticated endpoint:', res.courses?.length || 0);
					}
					setCourses(res.courses || []);
				} catch (err) {
					console.error('❌ Failed to load courses:', err);
					alert('Failed to load courses: ' + err.message);
					setCourses([]);
				}
			} else if (activeTab === 'students') {
				// Load students using API endpoint
				await loadStudents();
				await loadCourses();
			} else if (activeTab === 'pharmacy') {
				// Use optimized API endpoint with shorter timeout and cache
				try {
					// Check if cancelled
					if (abortController?.signal.aborted) return;
					
					console.log('🔄 Loading pharmacy items...');
					const startTime = Date.now();
					
					// Shorter timeout - 3 seconds (fail fast, use cache if available)
					const timeoutPromise = new Promise((_, reject) => 
						setTimeout(() => reject(new Error('Request timeout after 3 seconds')), 3000)
					);
					
					// Use cache for faster loading (cache is cleared after add/update/delete)
					const res = await Promise.race([
						apiRequest('/api/pharmacy/inventory?limit=100', { noCache: false }),
						timeoutPromise
					]);
					
					// Check if cancelled before setting state
					if (abortController?.signal.aborted) return;
					
					const loadTime = Date.now() - startTime;
					console.log(`✅ Loaded ${res.items?.length || 0} pharmacy items in ${loadTime}ms`);
					setPharmacyItems(res.items || []);
				} catch (err) {
					// Don't process if cancelled
					if (abortController?.signal.aborted) return;
					
					console.error('❌ Failed to load pharmacy items:', err);
					
					// Fallback: try direct Supabase query without image_url (in case column doesn't exist)
					try {
						if (abortController?.signal.aborted) return;
						
						console.log('🔄 Trying fallback query without image_url...');
						const fallbackStartTime = Date.now();
						
						const queryPromise = supabase
							.from('pharmacy_inventory')
							.select('medicine_id, name, category, price, discount_percentage, stock_quantity, supplier_info')
							.order('name')
							.limit(100);
						
						const timeoutPromise = new Promise((_, reject) => 
							setTimeout(() => reject(new Error('Fallback query timeout')), 2000)
						);
						
						const { data, error } = await Promise.race([
							queryPromise,
							timeoutPromise
						]);
						
						// Check if cancelled before setting state
						if (abortController?.signal.aborted) return;
						
						const fallbackTime = Date.now() - fallbackStartTime;
						
						if (!error && data) {
							// Add null image_url for consistency
							const itemsWithNullImage = (data || []).map(item => ({ ...item, image_url: null }));
							console.log(`✅ Fallback loaded ${itemsWithNullImage.length} items in ${fallbackTime}ms`);
							setPharmacyItems(itemsWithNullImage);
						} else {
							console.warn('⚠️ Fallback query failed:', error?.message || 'timeout');
							setPharmacyItems([]);
						}
					} catch (fallbackErr) {
						if (abortController?.signal.aborted) return;
						console.error('❌ Fallback query also failed:', fallbackErr);
						setPharmacyItems([]);
					}
				}
			} else if (activeTab === 'labs') {
				const res = await apiRequest('/api/labs');
				setLabs(res.labs || []);
			} else if (activeTab === 'blood-bank') {
				// Load users with blood_bank role
				try {
					const res = await apiRequest('/api/users');
					const bloodBankUsers = (res.users || []).filter(user => user.role === 'blood_bank');
					setBloodBanks(bloodBankUsers);
					
					// Load inventory and requests if admin
					if (userRole === 'admin') {
						try {
							const [invRes, reqRes] = await Promise.allSettled([
								apiRequest('/api/blood-bank/inventory/all'),
								apiRequest('/api/blood-bank/requests/all')
							]);
							
							if (invRes.status === 'fulfilled') {
								setBloodInventory(invRes.value.inventory || []);
							}
							if (reqRes.status === 'fulfilled') {
								console.log('✅ Blood requests loaded:', reqRes.value.requests?.length || 0);
								setBloodRequests(reqRes.value.requests || []);
							} else {
								console.error('❌ Failed to load blood requests:', reqRes.reason);
							}
						} catch (err) {
							console.error('Failed to load blood bank data:', err);
						}
					}
				} catch (err) {
					console.error('Failed to load blood banks:', err);
					setBloodBanks([]);
				}
			} else if (activeTab === 'lab-reports') {
				// Use API endpoint instead of direct Supabase query
				try {
					const res = await apiRequest('/api/lab/reports/all');
					setLabReports(res.reports || []);
				} catch (err) {
					console.error('Failed to load lab reports:', err);
					setLabReports([]);
				}
			} else if (activeTab === 'specialties') {
				const res = await apiRequest('/api/admin/specialties');
				setSpecialties(res.specialties || []);
			} else if (activeTab === 'conditions') {
				const res = await apiRequest('/api/admin/conditions');
				setConditions(res.conditions || []);
			} else if (activeTab === 'surgery-categories') {
				try {
					const res = await apiRequest('/api/admin/surgery-categories');
					console.log('Surgery categories loaded:', res);
					setSurgeryCategories(res.categories || []);
				} catch (err) {
					console.error('Failed to load surgery categories:', err);
					alert('Failed to load surgery categories: ' + (err.message || 'Unknown error'));
					setSurgeryCategories([]);
				}
			} else if (activeTab === 'surgery-bookings') {
				try {
					const res = await apiRequest('/api/surgery-bookings');
					console.log('Surgery bookings loaded:', res);
					setSurgeryBookings(res.bookings || []);
				} catch (err) {
					console.error('Failed to load surgery bookings:', err);
					alert('Failed to load surgery bookings: ' + (err.message || 'Unknown error'));
					setSurgeryBookings([]);
				}
			} else if (activeTab === 'home-services') {
				try {
					const res = await apiRequest('/api/home-services/requests');
					console.log('Home services requests loaded:', res);
					setHomeServicesRequests(res.requests || []);
				} catch (err) {
					console.error('Failed to load home services requests:', err);
					alert('Failed to load home services requests: ' + (err.message || 'Unknown error'));
					setHomeServicesRequests([]);
				}
			} else if (activeTab === 'jobs') {
				try {
					console.log('🔄 Loading jobs...');
					// Clear cache to ensure fresh data
					clearCache('/api/jobs');
					clearCache('/api/jobs/applications/all');
					const res = await apiRequest('/api/jobs', { noCache: true });
					console.log('✅ Jobs loaded:', res.jobs?.length || 0);
					setJobs(res.jobs || []);
					
					// Load all applications
					const appsRes = await apiRequest('/api/jobs/applications/all', { noCache: true });
					console.log('✅ Applications loaded:', appsRes.applications?.length || 0);
					setJobApplications(appsRes.applications || []);
				} catch (err) {
					console.error('❌ Failed to load jobs:', err);
					alert('Failed to load jobs: ' + (err.message || 'Unknown error'));
					setJobs([]);
					setJobApplications([]);
				}
			}
		} catch (err) {
			// Don't log errors if request was cancelled
			if (abortController?.signal.aborted) {
				console.log('⏹️ Request cancelled');
				return;
			}
			console.error('❌ Error in loadData:', err);
			// Don't let errors crash the component
		} finally {
			// Don't update state if cancelled
			if (abortController?.signal.aborted) {
				return;
			}
			const loadTime = Date.now() - startTime;
			if (loadTime > 2000) {
				console.warn(`⚠️ loadData took ${loadTime}ms - consider optimizing`);
			}
			setLoading(false);
		}
	}

	async function approveUser(userId) {
		if (!userId) {
			alert('Error: User ID is missing');
			return;
		}
		if (approvingUserId) {
			console.log('⚠️ Approval already in progress');
			return; // Already processing
		}
		setApprovingUserId(userId);
		try {
			console.log('🔄 Approving user:', userId);
			const response = await apiRequest('/api/users/approve', { 
				method: 'POST', 
				body: JSON.stringify({ userId }) 
			});
			console.log('✅ Approval response:', response);
			
			// Success message
			alert('User approved successfully! The user can now access their dashboard.');
			
			// Clear cache and reload data
			clearCache('/api/users');
			// Refresh users list directly instead of full loadData
			try {
				const freshUsers = await apiRequest('/api/users', { noCache: true });
				const loadedUsers = freshUsers.users || [];
				setUsers(loadedUsers);
				console.log(`✅ Updated users list: ${loadedUsers.length} users`);
			} catch (refreshErr) {
				console.error('⚠️ Failed to refresh users, reloading full data:', refreshErr);
				await loadData();
			}
		} catch (err) {
			console.error('❌ Error approving user:', err);
			alert('Failed to approve user: ' + (err.message || 'Unknown error'));
		} finally {
			setApprovingUserId(null);
		}
	}

	async function rejectUser(userId) {
		if (!userId) {
			alert('Error: User ID is missing');
			return;
		}
		if (rejectingUserId) {
			console.log('⚠️ Rejection already in progress');
			return; // Already processing
		}
		if (!confirm('Are you sure you want to reject this registration? This will delete the user account permanently.')) {
			return;
		}
		setRejectingUserId(userId);
		try {
			console.log('🔄 Rejecting user:', userId);
			const response = await apiRequest('/api/users/reject', { 
				method: 'POST', 
				body: JSON.stringify({ userId }) 
			});
			console.log('✅ Rejection response:', response);
			alert('User registration rejected and account deleted.');
			// Remove from local state immediately for instant UI update
			setUsers(prevUsers => prevUsers.filter(u => u && u.id && u.id !== userId));
			// Clear cache and refresh users list
			clearCache('/api/users');
			try {
				const freshUsers = await apiRequest('/api/users', { noCache: true });
				const loadedUsers = freshUsers.users || [];
				setUsers(loadedUsers);
				console.log(`✅ Updated users list: ${loadedUsers.length} users`);
			} catch (refreshErr) {
				console.error('⚠️ Failed to refresh users, reloading full data:', refreshErr);
				await loadData();
			}
		} catch (err) {
			console.error('❌ Error rejecting user:', err);
			alert('Failed to reject user: ' + (err.message || 'Unknown error'));
		} finally {
			setRejectingUserId(null);
		}
	}

	async function updateUserRole(userId, role) {
		try {
			await apiRequest('/api/users/role', { method: 'PUT', body: JSON.stringify({ userId, role }) });
			setShowEditUserRole(null);
			setNewRole('');
			loadData();
		} catch (err) {
			alert(err.message);
		}
	}

	async function handleReceiptSearch() {
		if (!receiptSearchId.trim()) {
			alert('Please enter a receipt ID');
			return;
		}

		try {
			setSearchingReceipt(true);
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				throw new Error('Please log in');
			}

			// Fetch receipt HTML
			const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/donations/receipt/${receiptSearchId}`, {
				headers: {
					'Authorization': `Bearer ${session.access_token}`
				}
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Receipt not found' }));
				throw new Error(errorData.error || 'Receipt not found');
			}

			const html = await response.text();

			// Open receipt in new window
			const receiptWindow = window.open('', '_blank');
			if (receiptWindow) {
				receiptWindow.document.write(html);
				receiptWindow.document.close();
				setReceiptSearchId(''); // Clear search after successful view
			}
		} catch (err) {
			alert('Failed to load receipt: ' + (err.message || 'Unknown error'));
			console.error(err);
		} finally {
			setSearchingReceipt(false);
		}
	}

	async function addPatient() {
		try {
			console.log('➕ Starting to add new patient...');
			
			// Check if user already exists
			const { data: existingUser } = await supabase.auth.signInWithPassword({
				email: patientForm.email,
				password: patientForm.password
			}).catch(() => null);
			
			let userId;
			
			if (existingUser?.user) {
				// User already exists, use existing user ID
				userId = existingUser.user.id;
				console.log('ℹ️ User already exists, using existing user ID:', userId);
			} else {
				// Create new user in Supabase Auth
				const { data: authData, error: authError } = await supabase.auth.signUp({
					email: patientForm.email,
					password: patientForm.password,
					options: {
						data: { role: 'patient', name: patientForm.name }
					}
				});
				
				if (authError) {
					// If user already registered error, try to get the user
					if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
						console.warn('⚠️ User already registered, attempting to sign in...');
						// Try to sign in to get the user ID
						const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
							email: patientForm.email,
							password: patientForm.password
						});
						
						if (signInError) {
							throw new Error('User already exists but password is incorrect. Please use a different email or reset the password.');
						}
						
						userId = signInData.user.id;
						console.log('✅ Using existing user:', userId);
					} else {
						console.error('❌ Auth signup error:', authError);
						throw authError;
					}
				} else {
					userId = authData.user.id;
					console.log('✅ User created in Auth:', userId);
				}
			}

			// Set role via backend - this also creates the user in users table
			try {
				await apiRequest('/api/auth/set-role', {
					method: 'POST',
					body: JSON.stringify({ userId, role: 'patient', name: patientForm.name, email: patientForm.email })
				});
				console.log('✅ User role set and user created in users table');
			} catch (roleError) {
				console.error('❌ Error setting role:', roleError);
				throw new Error('Failed to create user profile: ' + roleError.message);
			}

			// Wait a moment to ensure users table is updated
			await new Promise(resolve => setTimeout(resolve, 300));

			// Create patient profile
			try {
				await apiRequest('/api/patients/profile', {
					method: 'POST',
					body: JSON.stringify({
						userId,
						age: parseInt(patientForm.age),
						gender: patientForm.gender,
						cnic: patientForm.cnic,
						history: patientForm.history
					})
				});
				console.log('✅ Patient profile created');
			} catch (profileError) {
				console.error('❌ Error creating patient profile:', profileError);
				throw new Error('Failed to create patient profile: ' + profileError.message);
			}

			setShowAddPatient(false);
			setPatientForm({ name: '', email: '', password: '', age: '', gender: '', cnic: '', history: '' });
			
			// Reload patients data specifically with proper delay
			if (activeTab === 'patients') {
				// Wait a bit longer to ensure database is fully updated
				setTimeout(() => {
					console.log('🔄 Reloading patients after adding new patient...');
					loadPatientsData();
				}, 1500); // Increased delay to 1.5 seconds
			} else {
				// If not on patients tab, just update overview stats
				loadData();
			}
			
			alert('Patient added successfully!');
		} catch (err) {
			console.error('❌ Error adding patient:', err);
			alert('Failed to add patient: ' + err.message);
		}
	}

	async function loadPatientsData() {
		try {
			console.log('🔄 Loading patients data...');
			
			// Load patients and doctors in parallel for better performance
			const [patientsRes, doctorsRes] = await Promise.allSettled([
				// Try public endpoint first, fallback to authenticated
				apiRequest('/api/patients/all-public').catch(() => apiRequest('/api/patients/all')),
				apiRequest('/api/doctors')
			]);
			
			// Handle patients result
			if (patientsRes.status === 'fulfilled' && patientsRes.value?.patients) {
				const validPatients = patientsRes.value.patients.filter(p => p && p.user_id);
				console.log(`✅ Loaded ${validPatients.length} patients`);
				setPatients(validPatients);
			} else {
				console.warn('⚠️ Failed to load patients:', patientsRes.reason);
				setPatients([]);
			}
			
			// Handle doctors result
			if (doctorsRes.status === 'fulfilled' && doctorsRes.value?.doctors) {
				setDoctors(doctorsRes.value.doctors || []);
			} else {
				console.warn('⚠️ Failed to load doctors:', doctorsRes.reason);
			}
		} catch (err) {
			console.error('❌ Error loading patients data:', err);
			setPatients([]);
		}
	}

	async function loadPatientHistory(patientId) {
		setLoadingHistory(true);
		try {
			const [labReports, appointments] = await Promise.all([
				supabase.from('lab_reports').select('*').eq('patient_id', patientId).order('report_date', { ascending: false }),
				supabase.from('appointments').select('*, doctors(name, specialization, degrees)').eq('patient_id', patientId).order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false })
			]);
			setPatientHistoryData({
				labReports: labReports.data || [],
				appointments: appointments.data || []
			});
		} catch (err) {
			console.error('Error loading patient history:', err);
		} finally {
			setLoadingHistory(false);
		}
	}

	async function handleBookAppointmentForPatient(e) {
		if (e) e.preventDefault();
		if (!showBookAppointment) return;

		if (!appointmentForm.doctor_id || !appointmentForm.appointment_date || !appointmentForm.appointment_time) {
			alert('Please fill in all required fields (Doctor, Date, Time)');
			return;
		}

		setBookingLoading(true);
		try {
			await apiRequest('/api/appointments', {
				method: 'POST',
				body: JSON.stringify({
					patient_id: showBookAppointment.user_id,
					doctor_id: appointmentForm.doctor_id,
					appointment_date: appointmentForm.appointment_date,
					appointment_time: appointmentForm.appointment_time,
					reason: appointmentForm.reason || null
				})
			});
			
			alert('Appointment booked successfully!');
			setShowBookAppointment(null);
			setAppointmentForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
			loadData();
		} catch (err) {
			alert(err.message || 'Failed to book appointment');
			setBookingLoading(false);
		}
	}

	async function handleDoctorImageUpload(file) {
		setUploadingDoctorImage(true);
		try {
			const formData = new FormData();
			formData.append('file', file);

			console.log('Uploading doctor image:', file.name, file.type, file.size);

			// Try public endpoint first (no auth required)
			const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/doctors/upload-image`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Upload failed:', response.status, errorText);
				let error;
				try {
					error = JSON.parse(errorText);
				} catch {
					error = { error: errorText || 'Upload failed' };
				}
				throw new Error(error.error || 'Upload failed');
			}

			const data = await response.json();
			console.log('Upload successful:', data.url);
			setDoctorForm(prev => ({ ...prev, image_url: data.url }));
			setDoctorImagePreview(data.url);
		} catch (err) {
			console.error('Image upload error:', err);
			alert('Image upload failed: ' + err.message);
		} finally {
			setUploadingDoctorImage(false);
		}
	}

	function handleDoctorImageChange(e) {
		const file = e.target.files?.[0];
		console.log('File selected:', file);
		if (file) {
			setDoctorImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setDoctorImagePreview(reader.result);
			};
			reader.readAsDataURL(file);
			handleDoctorImageUpload(file);
		}
		// Reset input value to allow selecting the same file again
		if (e.target) {
			e.target.value = '';
		}
	}

	async function handleTeacherImageUpload(file) {
		setUploadingTeacherImage(true);
		try {
			const formData = new FormData();
			formData.append('file', file);

			// Try authenticated endpoint first
			let response;
			try {
				const { data: { session } } = await supabase.auth.getSession();
				if (session) {
					response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/teacher/upload-image`, {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${session.access_token}`
						},
						body: formData
					});
					
					if (response.ok) {
						const data = await response.json();
						setTeacherForm(prev => ({ ...prev, image_url: data.url }));
						setTeacherImagePreview(data.url);
						return;
					}
				}
			} catch (authErr) {
				console.warn('⚠️ Authenticated upload failed, trying public endpoint...', authErr);
			}

			// Fallback to public endpoint
			response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/teachers/upload-image`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Upload failed' }));
				throw new Error(error.error || 'Upload failed');
			}

			const data = await response.json();
			setTeacherForm(prev => ({ ...prev, image_url: data.url }));
			setTeacherImagePreview(data.url);
		} catch (err) {
			alert('Image upload failed: ' + err.message);
		} finally {
			setUploadingTeacherImage(false);
		}
	}

	function handleTeacherImageChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}
		
		setTeacherImage(file);
		const reader = new FileReader();
		reader.onload = (e) => setTeacherImagePreview(e.target.result);
		reader.readAsDataURL(file);
		
		// Upload image
		handleTeacherImageUpload(file);
	}

	async function addDoctor() {
		try {
			await apiRequest('/api/doctors', { 
				method: 'POST', 
				body: JSON.stringify(doctorForm) 
			});
			setShowAddDoctor(false);
			setDoctorForm({ name: '', specialization: '', degrees: '', discount_rate: 50, image_url: '', consultation_fee: '', timing: '', home_services: false });
			setDoctorImagePreview('');
			setDoctorImage(null);
			loadData();
		} catch (err) {
			alert(err.message);
		}
	}

	async function addTeacher() {
		try {
			console.log('➕ Starting to add new teacher...');
			
			// Check if user already exists
			const { data: existingUser } = await supabase.auth.signInWithPassword({
				email: teacherForm.email,
				password: teacherForm.password
			}).catch(() => null);

			let userId;

			if (existingUser?.user) {
				userId = existingUser.user.id;
				console.log('ℹ️ User already exists, using existing user ID:', userId);
			} else {
				// Create new user in Supabase Auth
				const { data: authData, error: authError } = await supabase.auth.signUp({
					email: teacherForm.email,
					password: teacherForm.password,
					options: {
						data: { role: 'teacher', name: teacherForm.name }
					}
				});

				if (authError) {
					if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
						console.warn('⚠️ User already registered, attempting to sign in...');
						const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
							email: teacherForm.email,
							password: teacherForm.password
						});

						if (signInError) {
							throw new Error('User already exists but password is incorrect. Please use a different email or reset the password.');
						}

						userId = signInData.user.id;
						console.log('✅ Using existing user:', userId);
					} else {
						console.error('❌ Auth signup error:', authError);
						throw authError;
					}
				} else {
					userId = authData.user.id;
					console.log('✅ User created in Auth:', userId);
				}
			}

			// Set role via backend - this also creates the user in users table
			try {
				const roleResponse = await apiRequest('/api/auth/set-role', {
					method: 'POST',
					body: JSON.stringify({ 
						userId, 
						role: 'teacher', 
						name: teacherForm.name, 
						email: teacherForm.email,
						phone: teacherForm.phone || null
					})
				});
				console.log('✅ User role set and user created in users table:', roleResponse);
			} catch (roleError) {
				console.error('❌ Error setting role:', roleError);
				throw new Error('Failed to create user profile: ' + roleError.message);
			}

			// Wait a moment to ensure users table is updated
			await new Promise(resolve => setTimeout(resolve, 500));

			// Create teacher profile
			try {
				const profileResponse = await apiRequest('/api/teachers/profile', {
					method: 'POST',
					body: JSON.stringify({
						userId,
						specialization: teacherForm.specialization || null,
						image_url: teacherForm.image_url || null
					})
				});
				console.log('✅ Teacher profile created:', profileResponse);
				console.log('📸 Image URL saved:', teacherForm.image_url);
			} catch (profileError) {
				console.error('❌ Error creating teacher profile:', profileError);
				// Don't throw - teacher might still be usable without profile
				console.warn('⚠️ Continuing despite profile error - teacher user created');
			}

			setShowAddTeacher(false);
			setTeacherForm({ name: '', email: '', password: '', phone: '', specialization: '', image_url: '' });
			setTeacherImagePreview('');
			setTeacherImage(null);

			// Reload teachers data with longer delay to ensure database sync
			if (activeTab === 'teachers') {
				setTimeout(() => {
					console.log('🔄 Reloading teachers after adding new teacher...');
					loadData();
				}, 2000); // Increased delay to 2 seconds
			} else {
				// If not on teachers tab, switch to it and reload
				setActiveTab('teachers');
				setTimeout(() => {
					loadData();
				}, 500);
			}

			alert('Teacher added successfully!');
		} catch (err) {
			console.error('❌ Error adding teacher:', err);
			alert('Failed to add teacher: ' + err.message);
		}
	}

	async function updateTeacher() {
		if (!showEditTeacher) return;
		try {
			const teacherId = showEditTeacher.id;

			// Update user info (name, phone, password) via backend API
			const userUpdateData = {};
			if (teacherForm.name) userUpdateData.name = teacherForm.name;
			if (teacherForm.phone !== undefined) userUpdateData.phone = teacherForm.phone;
			if (teacherForm.password && teacherForm.password.trim()) {
				userUpdateData.password = teacherForm.password;
			}

			if (Object.keys(userUpdateData).length > 0) {
				try {
					// Try authenticated endpoint first
					await apiRequest(`/api/users/${teacherId}`, {
						method: 'PUT',
						body: JSON.stringify(userUpdateData)
					});
				} catch (err) {
					// Fallback to public endpoint if authenticated endpoint fails
					console.warn('⚠️ Authenticated endpoint failed, trying public endpoint...', err);
					await apiRequest(`/api/teachers/update-user/${teacherId}`, {
						method: 'PUT',
						body: JSON.stringify(userUpdateData)
					});
				}
			}

			// Update teacher specialization and image
			// Always update profile to ensure image_url is saved if a new image was uploaded
			const originalImageUrl = showEditTeacher.teachers?.image_url || '';
			const newImageUrl = teacherForm.image_url || '';
			const hasNewImage = teacherImagePreview && teacherImagePreview !== originalImageUrl;
			
			// Determine the image URL to save: use preview if new image uploaded, otherwise keep original or use form value
			// Remove cache-busting parameters before saving
			let finalImageUrl = originalImageUrl;
			if (hasNewImage) {
				// Remove cache-busting parameter from preview URL before saving
				finalImageUrl = teacherImagePreview.split('?')[0];
			} else if (newImageUrl && newImageUrl !== originalImageUrl) {
				finalImageUrl = newImageUrl.split('?')[0];
			}
			
			const updateData = {
				userId: teacherId,
				specialization: teacherForm.specialization !== undefined ? (teacherForm.specialization || null) : showEditTeacher.teachers?.specialization,
				image_url: finalImageUrl || null
			};
			
			console.log('📸 Updating teacher profile:');
			console.log('  - Original image:', originalImageUrl);
			console.log('  - Form image URL:', newImageUrl);
			console.log('  - Image preview:', teacherImagePreview);
			console.log('  - Final image URL to save:', finalImageUrl);
			console.log('  - Update data:', updateData);
			
			// Use PUT method to update existing profile
			await apiRequest('/api/teachers/profile', {
				method: 'PUT',
				body: JSON.stringify(updateData)
			});
			console.log('✅ Teacher profile updated successfully');

			setShowEditTeacher(null);
			setTeacherForm({ name: '', email: '', password: '', phone: '', specialization: '', image_url: '' });
			setTeacherImagePreview('');
			setTeacherImage(null);
			loadData();
			alert('Teacher updated successfully!');
		} catch (err) {
			alert('Failed to update teacher: ' + err.message);
		}
	}

	async function deleteTeacher(userId) {
		if (!confirm('Are you sure you want to delete this teacher? This will also delete their user account.')) return;
		try {
			await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
			loadData();
			alert('Teacher deleted successfully!');
		} catch (err) {
			alert('Failed to delete teacher: ' + err.message);
		}
	}

	async function addDonation() {
		try {
			if (!donationForm.amount || Number(donationForm.amount) <= 0) {
				alert('Please enter a valid amount');
				return;
			}
			if (!donationForm.purpose) {
				alert('Please select a purpose');
				return;
			}
			
			// Validate donor type specific fields
			if (donationForm.donor_type === 'local' && donationForm.cnic) {
				// CNIC validation could be added here
			}
			if (donationForm.donor_type === 'international' && donationForm.passport_number) {
				// Passport validation could be added here
			}
			
			await apiRequest('/api/donations/admin', { 
				method: 'POST', 
				body: JSON.stringify({
					amount: Number(donationForm.amount),
					purpose: donationForm.purpose,
					donor_name: donationForm.donor_name || null,
					donor_email: donationForm.donor_email || null,
					donor_id: donationForm.donor_id || null,
					donor_type: donationForm.donor_type,
					cnic: donationForm.donor_type === 'local' ? donationForm.cnic : null,
					passport_number: donationForm.donor_type === 'international' ? donationForm.passport_number : null
				})
			});
			
			setShowAddDonation(false);
			setDonationForm({ 
				amount: '', 
				purpose: 'medical', 
				donor_name: '', 
				donor_email: '', 
				donor_id: '',
				donor_type: 'local',
				cnic: '', 
				passport_number: '' 
			});
			loadData();
			alert('Donation added successfully!');
		} catch (err) {
			alert(err.message || 'Failed to add donation');
		}
	}

	async function updateDonation() {
		if (!showEditDonation) return;
		try {
			if (!donationForm.amount || Number(donationForm.amount) <= 0) {
				alert('Please enter a valid amount');
				return;
			}
			if (!donationForm.purpose) {
				alert('Please select a purpose');
				return;
			}
			
			await apiRequest(`/api/donations/admin/${showEditDonation.id}`, { 
				method: 'PUT', 
				body: JSON.stringify({
					amount: Number(donationForm.amount),
					purpose: donationForm.purpose,
					donor_name: donationForm.donor_name || null,
					donor_email: donationForm.donor_email || null,
					donor_id: donationForm.donor_id || null,
					donor_type: donationForm.donor_type,
					cnic: donationForm.donor_type === 'local' ? donationForm.cnic : null,
					passport_number: donationForm.donor_type === 'international' ? donationForm.passport_number : null
				})
			});
			
			setShowEditDonation(null);
			setDonationForm({ 
				amount: '', 
				purpose: 'medical', 
				donor_name: '', 
				donor_email: '', 
				donor_id: '',
				donor_type: 'local',
				cnic: '', 
				passport_number: '' 
			});
			loadData();
			alert('Donation updated successfully!');
		} catch (err) {
			alert(err.message || 'Failed to update donation');
		}
	}

	async function updateDoctor(id, updates) {
		try {
			await apiRequest(`/api/doctors/${id}`, {
				method: 'PUT',
				body: JSON.stringify(updates)
			});
			loadData();
		} catch (err) {
			alert(err.message);
		}
	}

	async function deleteDoctor(id) {
		if (!confirm('Are you sure you want to delete this doctor?')) return;
		try {
			await apiRequest(`/api/doctors/${id}`, { method: 'DELETE' });
			loadData();
		} catch (err) {
			alert(err.message);
		}
	}

	async function addCourse() {
		try {
			// Convert empty string trainer_id to null
			const courseData = { ...courseForm };
			if (courseData.trainer_id === '') {
				courseData.trainer_id = null;
			}
			console.log('➕ Adding new course with data:', courseData);
			const result = await apiRequest('/api/courses', {
				method: 'POST',
				body: JSON.stringify(courseData)
			});
			console.log('✅ Course added successfully:', result);
			setShowAddCourse(false);
			setCourseForm({ title: '', description: '', duration: '', discount_rate: 70, trainer_id: '' });
			loadData();
		} catch (err) {
			console.error('❌ Failed to add course:', err);
			alert(err.message);
		}
	}

	async function updateCourse(id, updates) {
		try {
			// Convert empty string trainer_id to null
			if (updates.trainer_id === '') {
				updates.trainer_id = null;
			}
			console.log('📝 Updating course:', id, 'with updates:', updates);
			const result = await apiRequest(`/api/courses/${id}`, {
				method: 'PUT',
				body: JSON.stringify(updates)
			});
			console.log('✅ Course updated successfully:', result);
			loadData();
		} catch (err) {
			console.error('❌ Failed to update course:', err);
			alert(err.message);
		}
	}

	async function deleteCourse(id) {
		if (!confirm('Are you sure you want to delete this course?')) return;
		try {
			await apiRequest(`/api/courses/${id}`, { method: 'DELETE' });
			loadData();
		} catch (err) {
			alert(err.message);
		}
	}

	async function updateMedicine(id, updates) {
		try {
			setUploadingMedicineImage(true);
			const formData = new FormData();
			
			// Add all update fields (excluding image_url - we'll handle it separately)
			Object.keys(updates).forEach(key => {
				if (updates[key] !== undefined && updates[key] !== null && key !== 'image_url') {
					formData.append(key, updates[key]);
				}
			});
			
			// Handle image: priority is new file > image_url from form > existing image_url from showEditMedicine
			if (medicineImage) {
				// New file selected - send file to backend, it will upload
				formData.append('image', medicineImage);
				console.log('📤 Sending new image file to backend');
			} else if (updates.image_url) {
				// No new file - preserve existing image_url from form
				// Remove cache-busting parameters before sending
				const cleanUrl = updates.image_url.split('?')[0];
				formData.append('image_url', cleanUrl);
				console.log('📤 Preserving existing image_url from form:', cleanUrl);
			} else if (showEditMedicine?.image_url) {
				// Fallback: use existing image_url from the medicine being edited
				const cleanUrl = showEditMedicine.image_url.split('?')[0];
				formData.append('image_url', cleanUrl);
				console.log('📤 Preserving existing image_url from showEditMedicine:', cleanUrl);
			}
			// If none of the above, backend will preserve existing image_url
			
			console.log('📤 Updating medicine:', { id, hasNewImage: !!medicineImage, hasImageUrl: !!formData.get('image_url') });
			
			await apiRequest(`/api/pharmacy/items/${id}`, {
				method: 'PUT',
				body: formData
			});
			
			// Clear cache to ensure fresh data
			clearCache('/api/pharmacy/inventory');
			
			setMedicineImage(null);
			setMedicineImagePreview('');
			
			// Force reload by clearing medicine form and reloading data
			// Longer delay to ensure database commit and cache invalidation
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Force a hard reload of the pharmacy data
			loadData();
			
			// Also trigger a page refresh hint for the user
			console.log('✅ Medicine updated. If image doesn\'t refresh, try hard refresh (Ctrl+F5)');
		} catch (err) {
			console.error('❌ Error updating medicine:', err);
			alert(err.message || 'Failed to update medicine');
		} finally {
			setUploadingMedicineImage(false);
		}
	}

	function resetMedicineForm() {
		setMedicineForm({ ...DEFAULT_MEDICINE_FORM });
		setMedicineImage(null);
		setMedicineImagePreview('');
	}

	function handleMedicineImageChange(e) {
		const file = e.target.files[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				alert('Image size must be less than 5MB');
				return;
			}
			setMedicineImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setMedicineImagePreview(reader.result);
			};
			reader.readAsDataURL(file);
		}
	}

	async function addMedicine() {
		try {
			setUploadingMedicineImage(true);
			const formData = new FormData();
			
			// Add all form fields
			Object.keys(medicineForm).forEach(key => {
				if (medicineForm[key] !== undefined && medicineForm[key] !== null && medicineForm[key] !== '') {
					formData.append(key, medicineForm[key]);
				}
			});
			
			// Add image if selected
			if (medicineImage) {
				formData.append('image', medicineImage);
			}
			
			console.log('📤 Adding new medicine...', {
				name: medicineForm.name,
				category: medicineForm.category,
				hasImage: !!medicineImage
			});
			
			const result = await apiRequest('/api/pharmacy/inventory', {
				method: 'POST',
				body: formData
			});
			
			console.log('✅ Medicine added successfully:', result);
			
			// Clear cache for pharmacy inventory to ensure fresh data
			clearCache('/api/pharmacy/inventory');
			
			setShowAddMedicine(false);
			resetMedicineForm();
			
			// Small delay to ensure database commit, then reload
			await new Promise(resolve => setTimeout(resolve, 300));
			
			// Force reload pharmacy data
			if (activeTab === 'pharmacy') {
				await loadData();
			} else {
				// If not on pharmacy tab, switch to it and load
				setActiveTab('pharmacy');
				// loadData will be called by useEffect when tab changes
			}
		} catch (err) {
			console.error('❌ Failed to add medicine:', err);
			alert('Failed to add medicine: ' + err.message);
		} finally {
			setUploadingMedicineImage(false);
		}
	}

	async function deleteMedicine(id) {
		if (!confirm('Are you sure you want to delete this medicine?')) return;
		try {
			await apiRequest(`/api/pharmacy/items/${id}`, { method: 'DELETE' });
			
			// Clear cache to ensure fresh data
			clearCache('/api/pharmacy/inventory');
			
			// Small delay to ensure database commit
			await new Promise(resolve => setTimeout(resolve, 300));
			loadData();
		} catch (err) {
			alert(err.message);
		}
	}

	async function addLab() {
		try {
			if (!labForm.lab_name || !labForm.user_name || !labForm.email || !labForm.password) {
				alert('Please fill in all required fields (Lab Name, Contact Person Name, Email, and Password)');
				return;
			}
			
			// Register lab with user account (requires admin approval)
			await apiRequest('/api/labs/register', {
				method: 'POST',
				body: JSON.stringify({
					lab_name: labForm.lab_name,
					location: labForm.location,
					contact_info: labForm.contact_info,
					services: labForm.services || [],
					home_services: labForm.home_services || false,
					user_name: labForm.user_name,
					email: labForm.email,
					password: labForm.password
				})
			});
			
			setShowAddLab(false);
			setLabForm({ 
				lab_name: '', 
				location: '', 
				contact_info: '', 
				services: [],
				home_services: false,
				user_name: '',
				email: '',
				password: ''
			});
			alert('Laboratory registration submitted! It will be reviewed by an admin for approval.');
			loadData();
		} catch (err) {
			alert(err.message);
		}
	}

	async function deleteLab(id) {
		if (!confirm('Are you sure you want to delete this lab?')) return;
		try {
			await apiRequest(`/api/labs/${id}`, { method: 'DELETE' });
			loadData();
		} catch (err) {
			alert(err.message);
		}
	}

	async function saveBloodInventory() {
		try {
			if (!bloodInventoryForm.blood_type || !bloodInventoryForm.quantity) {
				alert('Please fill in all required fields (Blood Type, Quantity)');
				return;
			}
			
			await apiRequest('/api/blood-bank/inventory/admin', {
				method: 'POST',
				body: JSON.stringify({
					blood_type: bloodInventoryForm.blood_type,
					quantity: parseInt(bloodInventoryForm.quantity),
					expiry_date: bloodInventoryForm.expiry_date || null,
					status: bloodInventoryForm.status,
					inventory_id: editingBloodInventory?.id || null
				})
			});
			
			alert(editingBloodInventory ? 'Inventory updated successfully!' : 'Inventory added successfully!');
			setShowAddBloodInventory(false);
			setEditingBloodInventory(null);
			setBloodInventoryForm({ blood_type: '', quantity: '', expiry_date: '', status: 'available' });
			clearCache('/api/blood-bank/inventory/all');
			loadData();
		} catch (err) {
			alert('Failed to save inventory: ' + err.message);
		}
	}

	async function deleteBloodInventory(id) {
		if (!confirm('Are you sure you want to delete this inventory item?')) return;
		try {
			await apiRequest(`/api/blood-bank/inventory/admin/${id}`, { method: 'DELETE' });
			alert('Inventory item deleted successfully');
			clearCache('/api/blood-bank/inventory/all');
			loadData();
		} catch (err) {
			alert('Failed to delete: ' + err.message);
		}
	}

	async function updateBloodRequest(requestId, status, notes = '') {
		try {
			await apiRequest(`/api/blood-bank/requests/${requestId}/admin`, {
				method: 'PUT',
				body: JSON.stringify({ status, notes })
			});
			
			alert('Request updated successfully!');
			clearCache('/api/blood-bank/requests/all');
			clearCache('/api/blood-bank/inventory/all');
			loadData();
		} catch (err) {
			alert('Failed to update request: ' + err.message);
		}
	}

	async function assignLabTest() {
		// Only admins can assign tests
		if (userRole !== 'admin') {
			alert('Only administrators can assign tests to labs. Lab members should upload reports from the Lab Dashboard.');
			setShowAssignLabTest(false);
			return;
		}
		
		try {
			// Validate required fields
			if (!labTestForm.patient_name || !labTestForm.patient_name.trim()) {
				alert('Please enter patient name');
				setUploadingTestPaper(false);
				return;
			}
			
			if (!labTestForm.lab_id || !labTestForm.lab_id.trim()) {
				alert('Please select a lab from the dropdown');
				setUploadingTestPaper(false);
				return;
			}
			
			setUploadingTestPaper(true);

			// Create FormData with all fields
			const formData = new FormData();
			formData.append('patient_name', labTestForm.patient_name.trim());
			formData.append('lab_id', labTestForm.lab_id.trim());
			
			if (labTestForm.test_type && labTestForm.test_type.trim()) {
				formData.append('test_type', labTestForm.test_type.trim());
			}
			if (labTestForm.remarks && labTestForm.remarks.trim()) {
				formData.append('remarks', labTestForm.remarks.trim());
			}
			
			console.log('📤 Assigning test with:', {
				patient_name: labTestForm.patient_name,
				lab_id: labTestForm.lab_id,
				test_type: labTestForm.test_type,
				remarks: labTestForm.remarks,
				hasFile: !!testPaperFile
			});
			
			if (testPaperFile) {
				formData.append('test_paper', testPaperFile);
			}

			// Get session and refresh if needed
			let { data: { session }, error: sessionError } = await supabase.auth.getSession();
			
			// If no session or session expired, try to refresh
			if (!session || (session.expires_at && session.expires_at * 1000 < Date.now())) {
				console.log('🔄 Session expired or missing, refreshing...');
				const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
				if (refreshError) {
					console.error('❌ Failed to refresh session:', refreshError);
					throw new Error('Session expired. Please log in again.');
				} else if (refreshedSession) {
					session = refreshedSession;
					console.log('✅ Session refreshed successfully');
				}
			}
			
			if (sessionError || !session || !session.access_token) {
				throw new Error('Session expired. Please log in again.');
			}
			
			console.log('🔑 Session info:', { 
				user_id: session.user.id, 
				email: session.user.email,
				has_token: !!session.access_token,
				expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
			});
			
			const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/lab/assign`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${session.access_token}`
				},
				body: formData
			});

			if (!response.ok) {
				let errorMessage = 'Failed to assign test';
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || `Server error (${response.status})`;
					console.error('❌ Assignment failed:', { status: response.status, error: errorData });
				} catch (parseError) {
					// If response is not JSON, try to get text
					try {
						const errorText = await response.text();
						errorMessage = errorText || `Server error (${response.status}): ${response.statusText}`;
						console.error('❌ Assignment failed (non-JSON response):', { status: response.status, text: errorText });
					} catch (textError) {
						errorMessage = `Server error (${response.status}): ${response.statusText || 'Unknown error'}`;
						console.error('❌ Assignment failed (could not parse response):', { status: response.status, error: textError });
					}
				}
				
				// If 401, try refreshing session once more
				if (response.status === 401) {
					console.log('🔄 Got 401, attempting to refresh session and retry...');
					const { data: { session: retrySession }, error: retryError } = await supabase.auth.refreshSession();
					if (!retryError && retrySession?.access_token) {
						// Retry the request with new token
						const retryResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/lab/assign`, {
							method: 'POST',
							headers: {
								'Authorization': `Bearer ${retrySession.access_token}`
							},
							body: formData
						});
						
						if (!retryResponse.ok) {
							let retryErrorMessage = 'Failed to assign test. Please log in again.';
							try {
								const retryErrorData = await retryResponse.json();
								retryErrorMessage = retryErrorData.error || retryErrorData.message || retryErrorMessage;
							} catch {
								retryErrorMessage = `Server error (${retryResponse.status}): ${retryResponse.statusText || 'Unknown error'}`;
							}
							throw new Error(retryErrorMessage);
						}
						// Success on retry - continue with success flow below
					} else {
						throw new Error('Session expired. Please log in again.');
					}
				} else {
					throw new Error(errorMessage);
				}
			}

			setShowAssignLabTest(false);
			setLabTestForm({ patient_name: '', lab_id: '', test_type: '', remarks: '' });
			setTestPaperFile(null);
			setTestPaperPreview('');
			alert('Test assigned to lab successfully!');
			// Clear cache and reload data
			clearCache('/api/lab/reports/all');
			clearCache('/api/lab/tasks');
			// Reload lab reports tab if active, otherwise reload current tab
			if (activeTab === 'lab-reports') {
				const res = await apiRequest('/api/lab/reports/all', { noCache: true });
				setLabReports(res.reports || []);
			} else {
				loadData();
			}
		} catch (err) {
			alert(err.message || 'Failed to assign test');
		} finally {
			setUploadingTestPaper(false);
		}
	}

		function handleTestPaperChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
		if (!validTypes.includes(file.type)) {
			alert('Please upload an image (JPG, PNG, GIF) or PDF file');
			return;
		}

		// Validate file size (max 20MB)
		if (file.size > 20 * 1024 * 1024) {
			alert('File size must be less than 20MB');
			return;
		}

		setTestPaperFile(file);

		// Create preview for images
		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setTestPaperPreview(reader.result);
			};
			reader.readAsDataURL(file);
		} else {
			setTestPaperPreview('');
		}
	}

	// Specialties CRUD
	async function addSpecialty() {
		try {
			if (!specialtyForm.label || !specialtyForm.icon) {
				alert('Label and icon are required');
				return;
			}
			await apiRequest('/api/admin/specialties', {
				method: 'POST',
				body: JSON.stringify(specialtyForm)
			});
			setShowAddSpecialty(false);
			setSpecialtyForm({ label: '', icon: '', display_order: 0, is_active: true });
			loadData();
			alert('Specialty added successfully!');
		} catch (err) {
			alert(err.message || 'Failed to add specialty');
		}
	}

	async function updateSpecialty(id) {
		try {
			await apiRequest(`/api/admin/specialties/${id}`, {
				method: 'PUT',
				body: JSON.stringify(editingSpecialty)
			});
			setEditingSpecialty(null);
			loadData();
			alert('Specialty updated successfully!');
		} catch (err) {
			alert(err.message || 'Failed to update specialty');
		}
	}

	async function deleteSpecialty(id) {
		if (!confirm('Are you sure you want to delete this specialty?')) return;
		try {
			await apiRequest(`/api/admin/specialties/${id}`, { method: 'DELETE' });
			loadData();
			alert('Specialty deleted successfully!');
		} catch (err) {
			alert(err.message || 'Failed to delete specialty');
		}
	}

	// Conditions CRUD
	async function addCondition() {
		try {
			if (!conditionForm.label || !conditionForm.icon || !conditionForm.search_keyword) {
				alert('Label, icon, and search keyword are required');
				return;
			}
			await apiRequest('/api/admin/conditions', {
				method: 'POST',
				body: JSON.stringify(conditionForm)
			});
			setShowAddCondition(false);
			setConditionForm({ label: '', icon: '', search_keyword: '', display_order: 0, is_active: true });
			loadData();
			alert('Condition added successfully!');
		} catch (err) {
			alert(err.message || 'Failed to add condition');
		}
	}

	async function updateCondition(id) {
		try {
			await apiRequest(`/api/admin/conditions/${id}`, {
				method: 'PUT',
				body: JSON.stringify(editingCondition)
			});
			setEditingCondition(null);
			loadData();
			alert('Condition updated successfully!');
		} catch (err) {
			alert(err.message || 'Failed to update condition');
		}
	}

	async function deleteCondition(id) {
		if (!confirm('Are you sure you want to delete this condition?')) return;
		try {
			await apiRequest(`/api/admin/conditions/${id}`, { method: 'DELETE' });
			loadData();
			alert('Condition deleted successfully!');
		} catch (err) {
			alert(err.message || 'Failed to delete condition');
		}
	}

	// Surgery Categories CRUD
	async function addSurgeryCategory() {
		try {
			if (!surgeryCategoryForm.name || !surgeryCategoryForm.icon) {
				alert('Name and icon are required');
				return;
			}
			await apiRequest('/api/admin/surgery-categories', {
				method: 'POST',
				body: JSON.stringify(surgeryCategoryForm)
			});
			setShowAddSurgeryCategory(false);
			setSurgeryCategoryForm({ name: '', icon: '', description: '', display_order: 0, is_active: true });
			loadData();
			alert('Surgery category added successfully!');
		} catch (err) {
			alert(err.message || 'Failed to add surgery category');
		}
	}

	async function updateSurgeryCategory(id) {
		try {
			await apiRequest(`/api/admin/surgery-categories/${id}`, {
				method: 'PUT',
				body: JSON.stringify(editingSurgeryCategory)
			});
			setEditingSurgeryCategory(null);
			setShowAddSurgeryCategory(false);
			loadData();
			alert('Surgery category updated successfully!');
		} catch (err) {
			alert(err.message || 'Failed to update surgery category');
		}
	}

	async function deleteSurgeryCategory(id) {
		if (!confirm('Are you sure you want to delete this surgery category?')) return;
		try {
			await apiRequest(`/api/admin/surgery-categories/${id}`, { method: 'DELETE' });
			loadData();
			alert('Surgery category deleted successfully!');
		} catch (err) {
			alert(err.message || 'Failed to delete surgery category');
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			<div className="max-w-7xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-extrabold text-gray-900 mb-2">
						🧑‍💼 Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-600">Dashboard</span>
					</h1>
					<p className="text-gray-600">Manage all aspects of the welfare foundation</p>
					
					{/* Role Warning */}
					{roleWarning && (
						<div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
							<div className="flex items-center">
								<div className="text-yellow-400 text-2xl mr-3">⚠️</div>
								<div>
									<p className="text-yellow-800 font-semibold">Warning: You are logged in as <strong>{userRole}</strong></p>
									<p className="text-yellow-700 text-sm mt-1">
										To access all admin features, please log in with an admin account. 
										Current user role: <strong>{userRole}</strong>
									</p>
									<p className="text-yellow-700 text-xs mt-2">
										To fix: Update your role in the database to 'admin' or log in with an admin account.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
				
				{/* Stats Overview */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all cursor-pointer" onClick={() => setActiveTab('doctors')}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-blue-100 text-sm font-medium mb-1">Doctors</p>
								<p className="text-3xl font-bold text-white">{stats.totalDoctors}</p>
							</div>
							<div className="text-4xl opacity-80">👨‍⚕️</div>
						</div>
					</div>
					<div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all cursor-pointer" onClick={() => setActiveTab('patients')}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-green-100 text-sm font-medium mb-1">Patients</p>
								<p className="text-3xl font-bold text-white">{stats.totalPatients}</p>
							</div>
							<div className="text-4xl opacity-80">🩺</div>
						</div>
					</div>
					<div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all cursor-pointer" onClick={() => setActiveTab('labs')}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-purple-100 text-sm font-medium mb-1">Labs</p>
								<p className="text-3xl font-bold text-white">{stats.totalLabs}</p>
							</div>
							<div className="text-4xl opacity-80">🔬</div>
						</div>
					</div>
					<div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all cursor-pointer" onClick={() => setActiveTab('students')}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-indigo-100 text-sm font-medium mb-1">Students</p>
								<p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
							</div>
							<div className="text-4xl opacity-80">👨‍🎓</div>
						</div>
					</div>
					<div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all cursor-pointer" onClick={() => setActiveTab('donations')}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-orange-100 text-sm font-medium mb-1">Donors</p>
								<p className="text-3xl font-bold text-white">{stats.totalDonors}</p>
							</div>
							<div className="text-4xl opacity-80">💝</div>
						</div>
					</div>
				</div>

				{/* Global Search */}
				<div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">🔍 Global Search</h2>
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
								placeholder="Search users, doctors, patients, donations, medicines, courses..."
							/>
						</div>
						<div className="md:w-48">
							<select
								value={searchCategory}
								onChange={(e) => setSearchCategory(e.target.value)}
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900 bg-white"
							>
								<option value="all">All Categories</option>
								<option value="users">Users</option>
								<option value="doctors">Doctors</option>
								<option value="patients">Patients</option>
								<option value="donations">Donations</option>
								<option value="pharmacy">Pharmacy</option>
								<option value="courses">Courses</option>
								<option value="lab-reports">Lab Reports</option>
							</select>
						</div>
						<button
							onClick={handleSearch}
							className="px-8 py-3 bg-gradient-to-r from-brand to-brand-dark text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
						>
							Search
						</button>
					</div>
				</div>

				{/* Search Results */}
				{showSearchResults && (
					<div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-2xl font-bold text-gray-900">
								Search Results ({searchResults.length})
							</h2>
							<button
								onClick={() => {
									setShowSearchResults(false);
									setSearchQuery('');
									setSearchResults([]);
								}}
								className="text-gray-500 hover:text-gray-900"
							>
								✕ Close
							</button>
						</div>
						{loading ? (
							<div className="text-center py-12">
								<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
								<p className="mt-4 text-gray-600">Searching...</p>
							</div>
						) : searchResults.length === 0 ? (
							<div className="text-center py-12">
								<div className="text-6xl mb-4">🔍</div>
								<h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
								<p className="text-gray-600">Try different keywords or categories</p>
							</div>
						) : (
							<div className="space-y-4">
								{searchResults.map((result, idx) => (
									<div
										key={idx}
										className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
									>
										{result.type === 'user' && (
											<div className="flex items-center justify-between">
												<div>
													<div className="flex items-center gap-2 mb-1">
														<span className="text-lg">👤</span>
														<span className="font-bold text-gray-900">{result.data.name || 'N/A'}</span>
														<span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
															{result.data.role}
														</span>
													</div>
													<p className="text-sm text-gray-600">{result.data.email}</p>
												</div>
												<div className="text-right flex gap-2">
													{!result.data.verified && (
														<>
															<button
																type="button"
																disabled={approvingUserId === result.data.id || rejectingUserId === result.data.id}
																onClick={(e) => {
																	e.preventDefault();
																	e.stopPropagation();
																	console.log('🔘 Approve button clicked (search result) for user:', result.data?.id);
																	if (result.data?.id) {
																		approveUser(result.data.id);
																	}
																}}
																className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
															>
																{approvingUserId === result.data.id ? 'Approving...' : '✓ Approve'}
															</button>
															<button
																type="button"
																disabled={approvingUserId === result.data.id || rejectingUserId === result.data.id}
																onClick={(e) => {
																	e.preventDefault();
																	e.stopPropagation();
																	console.log('🔘 Reject button clicked (search result) for user:', result.data?.id);
																	if (result.data?.id) {
																		rejectUser(result.data.id);
																	}
																}}
																className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
															>
																{rejectingUserId === result.data.id ? 'Rejecting...' : '✕ Reject'}
															</button>
														</>
													)}
													{result.data.verified && (
														<span className="px-3 py-1 text-xs rounded bg-green-100 text-green-800 font-semibold">
															✓ Approved
														</span>
													)}
												</div>
											</div>
										)}
										{result.type === 'doctor' && (
											<div>
												<div className="flex items-center gap-2 mb-1">
													<span className="text-lg">👨‍⚕️</span>
													<span className="font-bold text-gray-900">{result.data.name}</span>
													<span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
														{result.data.specialization}
													</span>
												</div>
												<p className="text-sm text-gray-600">{result.data.degrees}</p>
												<p className="text-sm text-brand font-semibold">{result.data.discount_rate}% Discount</p>
											</div>
										)}
										{result.type === 'patient' && (
											<div>
												<div className="flex items-center gap-2 mb-1">
													<span className="text-lg">🏥</span>
													<span className="font-bold text-gray-900">{result.data.users?.name || 'N/A'}</span>
													<span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
														Patient
													</span>
												</div>
												<p className="text-sm text-gray-600">{result.data.users?.email}</p>
												<p className="text-sm text-gray-500">Age: {result.data.age} | Gender: {result.data.gender}</p>
											</div>
										)}
										{result.type === 'donation' && (
											<div>
												<div className="flex items-center gap-2 mb-1">
													<span className="text-lg">💰</span>
													<span className="font-bold text-gray-900">{result.data.users?.name || 'Anonymous'}</span>
													<span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
														PKR {Number(result.data.amount).toLocaleString()}
													</span>
												</div>
												<p className="text-sm text-gray-600">{result.data.purpose || 'General Donation'}</p>
												<p className="text-sm text-gray-500">
													{new Date(result.data.created_at).toLocaleDateString()}
												</p>
											</div>
										)}
										{result.type === 'pharmacy' && (
											<div>
												<div className="flex items-center gap-2 mb-1">
													<span className="text-lg">💊</span>
													<span className="font-bold text-gray-900">{result.data.name}</span>
													<span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
														{result.data.category}
													</span>
												</div>
												<p className="text-sm text-gray-600">PKR {Number(result.data.price).toFixed(2)}</p>
												<p className="text-sm text-green-600">Stock: {result.data.stock_quantity} units</p>
											</div>
										)}
										{result.type === 'course' && (
											<div>
												<div className="flex items-center gap-2 mb-1">
													<span className="text-lg">📚</span>
													<span className="font-bold text-gray-900">{result.data.title}</span>
												</div>
												<p className="text-sm text-gray-600">{result.data.description}</p>
												<p className="text-sm text-brand font-semibold">{result.data.discount_rate}% OFF</p>
											</div>
										)}
										{result.type === 'lab-report' && (
											<div>
												<div className="flex items-center gap-2 mb-1">
													<span className="text-lg">🧪</span>
													<span className="font-bold text-gray-900">{result.data.test_type}</span>
													<span className={`px-2 py-1 text-xs rounded ${
														result.data.status === 'completed'
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-800'
													}`}>
														{result.data.status || 'Pending'}
													</span>
												</div>
												<p className="text-sm text-gray-500">
													{new Date(result.data.report_date).toLocaleDateString()}
												</p>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Tabs */}
				<div className="bg-white rounded-2xl shadow-xl mb-6">
					<div className="border-b border-gray-200">
						<nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
							{['overview', 'patients', 'donations', 'doctors', 'teachers', 'students', 'courses', 'pharmacy', 'labs', 'lab-reports', 'blood-bank', 'specialties', 'conditions', 'surgery-categories', 'surgery-bookings', 'home-services', 'jobs'].map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap transition-colors ${
										activeTab === tab
											? 'border-brand text-brand font-bold'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									{tab === 'lab-reports'
										? 'Lab Reports'
										: tab === 'blood-bank'
											? 'Blood Bank'
											: tab === 'surgery-categories'
												? 'Surgery Categories'
												: tab === 'surgery-bookings'
													? 'Surgery Bookings'
													: tab === 'home-services'
														? 'Home Services'
														: tab === 'jobs'
															? 'Jobs'
															: tab === 'students'
																? 'Students'
																: tab.charAt(0).toUpperCase() + tab.slice(1)}
								</button>
							))}
						</nav>
					</div>

				{/* Tab Content */}
				<div className="p-6">
					{activeTab === 'overview' && (
						<div className="space-y-6">
							<h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
							<div className="grid md:grid-cols-3 gap-6">
								<button 
									onClick={() => setActiveTab('patients')} 
									className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-6 rounded-2xl text-left transition-all shadow-md hover:shadow-xl transform hover:scale-105 border border-blue-200"
								>
									<div className="text-4xl mb-3">🩺</div>
									<h3 className="font-bold text-blue-900 mb-2 text-lg">Manage Patients</h3>
									<p className="text-sm text-blue-700">View patient profiles and medical records</p>
								</button>
								<button 
									onClick={() => setShowAddDoctor(true)} 
									className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 p-6 rounded-2xl text-left transition-all shadow-md hover:shadow-xl transform hover:scale-105 border border-green-200"
								>
									<div className="text-4xl mb-3">👨‍⚕️</div>
									<h3 className="font-bold text-green-900 mb-2 text-lg">Add Doctor</h3>
									<p className="text-sm text-green-700">Add new doctors with discount rates</p>
								</button>
								<button 
									onClick={() => setActiveTab('donations')} 
									className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-6 rounded-2xl text-left transition-all shadow-md hover:shadow-xl transform hover:scale-105 border border-purple-200"
								>
									<div className="text-4xl mb-3">💰</div>
									<h3 className="font-bold text-purple-900 mb-2 text-lg">View Donations</h3>
									<p className="text-sm text-purple-700">See all donation records</p>
								</button>
							</div>

							{/* Pending Registrations */}
							{users && users.filter(u => u && u.id && !u.verified).length > 0 && (
								<div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
									<div className="flex items-center justify-between mb-4">
										<div>
											<h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
												⏳ Pending Registrations
												<span className="px-3 py-1 text-sm bg-yellow-200 text-yellow-800 rounded-full font-semibold">
													{users.filter(u => u && u.id && !u.verified).length}
												</span>
											</h2>
											<p className="text-gray-600 mt-1">Review and approve or reject new user registrations</p>
										</div>
										<button
											onClick={async () => {
												console.log('🔄 Manually refreshing users list...');
												clearCache('/api/users');
												try {
													const freshUsers = await apiRequest('/api/users', { noCache: true });
													const loadedUsers = freshUsers.users || [];
													console.log(`✅ Refreshed: Loaded ${loadedUsers.length} users`);
													const pendingCount = loadedUsers.filter(u => u && !u.verified).length;
													console.log(`⏳ Found ${pendingCount} pending registrations after refresh`);
													setUsers(loadedUsers);
												} catch (err) {
													console.error('❌ Error refreshing users:', err);
													alert('Failed to refresh users list: ' + err.message);
												}
											}}
											className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-semibold flex items-center gap-2"
											title="Refresh pending registrations"
										>
											🔄 Refresh
										</button>
									</div>
													<div className="space-y-3 max-h-96 overflow-y-auto">
														{users.filter(u => u && u.id && !u.verified).map(user => (
											<div key={user.id} className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
												<div className="flex items-center justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-1">
															<span className="font-bold text-gray-900">{user.name || 'N/A'}</span>
															<span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 font-semibold">
																{user.role?.toUpperCase() || 'USER'}
															</span>
														</div>
														<p className="text-sm text-gray-600">{user.email}</p>
														{user.phone && (
															<p className="text-xs text-gray-500">Phone: {user.phone}</p>
														)}
														<p className="text-xs text-gray-400 mt-1">
															Registered: {new Date(user.created_at).toLocaleDateString()}
														</p>
													</div>
													<div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
														<button
															type="button"
															disabled={approvingUserId === user.id || rejectingUserId === user.id}
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																console.log('🔘 Approve button clicked for user:', user?.id, user);
																if (user?.id) {
																	approveUser(user.id);
																} else {
																	console.error('❌ User ID is missing:', user);
																	alert('Error: User ID is missing');
																}
															}}
															style={{ position: 'relative', zIndex: 10 }}
															className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
														>
															{approvingUserId === user.id ? 'Approving...' : '✓ Approve'}
														</button>
														<button
															type="button"
															disabled={approvingUserId === user.id || rejectingUserId === user.id}
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																console.log('🔘 Reject button clicked for user:', user?.id, user);
																if (user?.id) {
																	rejectUser(user.id);
																} else {
																	console.error('❌ User ID is missing:', user);
																	alert('Error: User ID is missing');
																}
															}}
															style={{ position: 'relative', zIndex: 10 }}
															className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
														>
															{rejectingUserId === user.id ? 'Rejecting...' : '✕ Reject'}
														</button>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{activeTab === 'patients' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Patient Management</h2>
								<button 
									onClick={() => setShowAddPatient(true)}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Patient
								</button>
							</div>
							
							{/* Search Bar */}
							<div className="mb-4">
								<div className="relative">
									<input
										type="text"
										placeholder="Search patients by name, email, age, gender, or CNIC..."
										value={patientSearchQuery}
										onChange={(e) => setPatientSearchQuery(e.target.value)}
										className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
									/>
									<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
									{patientSearchQuery && (
										<button
											onClick={() => setPatientSearchQuery('')}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											×
										</button>
									)}
								</div>
								{patientSearchQuery && (
									<p className="text-sm text-gray-600 mt-2">
										{patients.filter(patient => {
											const query = patientSearchQuery.toLowerCase();
											const name = (patient.users?.name || '').toLowerCase();
											const email = (patient.users?.email || '').toLowerCase();
											const age = String(patient.age || '');
											const gender = (patient.gender || '').toLowerCase();
											const cnic = (patient.cnic || '');
											return name.includes(query) || email.includes(query) || 
											       age.includes(query) || gender.includes(query) || cnic.includes(query);
										}).length} patient(s) found
									</p>
								)}
							</div>

							{loading ? (
								<div className="text-center py-8">
									<div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand border-t-transparent mb-4"></div>
									<p className="text-gray-600">Loading patients...</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									{/* Debug info - remove in production */}
									{process.env.NODE_ENV === 'development' && (
										<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
											<strong>Debug:</strong> Total patients loaded: {patients.length}
											{patients.length > 0 && (
												<div className="mt-2">
													Sample patient data: {JSON.stringify(patients[0], null, 2).substring(0, 200)}...
												</div>
											)}
										</div>
									)}
									
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNIC</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{patients.length === 0 ? (
												<tr>
													<td colSpan="6" className="px-6 py-8 text-center text-gray-500">
														No patients found. Click "+ Add Patient" to add your first patient.
													</td>
												</tr>
											) : patients.filter(patient => {
												if (!patientSearchQuery) return true;
												const query = patientSearchQuery.toLowerCase();
												const name = (patient.users?.name || patient.name || '').toLowerCase();
												const email = (patient.users?.email || patient.email || '').toLowerCase();
												const age = String(patient.age || '');
												const gender = (patient.gender || '').toLowerCase();
												const cnic = (patient.cnic || '');
												return name.includes(query) || email.includes(query) || 
												       age.includes(query) || gender.includes(query) || cnic.includes(query);
											}).map(patient => (
												<tr key={patient.user_id || patient.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
														{patient.users?.name || patient.name || 'N/A'}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{patient.users?.email || patient.email || 'N/A'}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{patient.age || 'N/A'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{patient.gender || 'N/A'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{patient.cnic || 'N/A'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
													<button 
														onClick={async () => {
															setShowPatientHistory(patient);
															await loadPatientHistory(patient.user_id || patient.id);
														}}
														className="text-brand hover:underline font-semibold"
													>
														📋 View History
													</button>
														<button 
														onClick={() => {
															setShowBookAppointment(patient);
															setAppointmentForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
															setDoctorSearchQuery('');
														}}
															className="text-green-600 hover:underline font-semibold"
														>
															📅 Book Appointment
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
									{patients.length === 0 && !patientSearchQuery && (
										<div className="text-center py-8 text-gray-500">
											No patients found. Click "+ Add Patient" to add your first patient.
										</div>
									)}
									{patients.filter(patient => {
										if (!patientSearchQuery) return false;
										const query = patientSearchQuery.toLowerCase();
										const name = (patient.users?.name || '').toLowerCase();
										const email = (patient.users?.email || '').toLowerCase();
										const age = String(patient.age || '');
										const gender = (patient.gender || '').toLowerCase();
										const cnic = (patient.cnic || '');
										return name.includes(query) || email.includes(query) || 
										       age.includes(query) || gender.includes(query) || cnic.includes(query);
									}).length === 0 && patientSearchQuery && (
										<div className="text-center py-8 text-gray-500">
											No patients found matching "{patientSearchQuery}"
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{activeTab === 'donations' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Donation Records</h2>
								<button 
									onClick={() => setShowAddDonation(true)}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Donation
								</button>
							</div>
							
							{/* Receipt Search by ID */}
							<div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-brand/20">
								<h3 className="text-lg font-semibold mb-4 text-gray-800">🔍 Search Receipt by Receipt ID</h3>
								<div className="flex gap-3">
									<input
										type="text"
										placeholder="Enter Receipt ID (e.g., 65ace86f-d7fa-480f-90aa-a1a89545c4a0)"
										value={receiptSearchId}
										onChange={e => setReceiptSearchId(e.target.value)}
										className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
										onKeyPress={e => {
											if (e.key === 'Enter') {
												handleReceiptSearch();
											}
										}}
									/>
									<button
										onClick={handleReceiptSearch}
										disabled={!receiptSearchId.trim() || searchingReceipt}
										className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
									>
										{searchingReceipt ? 'Searching...' : 'View Receipt'}
									</button>
								</div>
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt ID</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{donations.map(donation => (
												<tr key={donation.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{new Date(donation.created_at).toLocaleDateString()}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-xs text-gray-600">
														<span 
															onClick={() => {
																navigator.clipboard.writeText(donation.id);
																alert('Receipt ID copied to clipboard!');
															}}
															className="cursor-pointer hover:text-brand hover:underline"
															title="Click to copy"
														>
															{donation.id.substring(0, 8)}...
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{donation.users?.name || donation.donor_name || donation.users?.email || donation.donor_email || 'Anonymous'}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand">
														PKR {Number(donation.amount).toLocaleString()}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{donation.purpose || 'General'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<div className="flex gap-2">
															<button
																onClick={() => setShowDonorDetails(donation)}
																className="text-blue-600 hover:underline font-semibold"
															>
																📋 Details
															</button>
															<button
																onClick={async () => {
																	try {
																		const { data: { session } } = await supabase.auth.getSession();
																		if (!session) return;
																		const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/donations/receipt/${donation.id}`, {
																			headers: { 'Authorization': `Bearer ${session.access_token}` }
																		});
																		if (response.ok) {
																			const html = await response.text();
																			const receiptWindow = window.open('', '_blank');
																			if (receiptWindow) {
																				receiptWindow.document.write(html);
																				receiptWindow.document.close();
																			}
																		}
																	} catch (err) {
																		alert('Failed to view receipt');
																	}
																}}
																className="text-green-600 hover:underline font-semibold"
															>
																📄 Receipt
															</button>
															<button
																onClick={() => {
																	setShowEditDonation(donation);
																	setDonationForm({
																		amount: donation.amount,
																		purpose: donation.purpose || '',
																		donor_id: donation.donor_id || '',
																		donor_type: donation.donor_type || 'local',
																		cnic: donation.cnic || '',
																		passport_number: donation.passport_number || '',
																		donor_name: donation.donor_name || donation.users?.name || '',
																		donor_email: donation.donor_email || donation.users?.email || ''
																	});
																}}
																className="text-yellow-600 hover:underline font-semibold"
															>
																✏️ Edit
															</button>
															<button
																onClick={async () => {
																	if (!confirm('Are you sure you want to delete this donation?')) return;
																	try {
																		await apiRequest(`/api/donations/admin/${donation.id}`, {
																			method: 'DELETE'
																		});
																		alert('Donation deleted successfully!');
																		loadData();
																	} catch (err) {
																		alert(err.message || 'Failed to delete donation');
																	}
																}}
																className="text-red-600 hover:underline font-semibold"
															>
																🗑️ Delete
															</button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{activeTab === 'doctors' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Doctor Management</h2>
								<button 
									onClick={() => setShowAddDoctor(true)}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Doctor
								</button>
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Degrees</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{doctors.map(doctor => (
												<tr key={doctor.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{doctor.name}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{doctor.specialization}</td>
													<td className="px-6 py-4 text-sm">{doctor.degrees || '-'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand">{doctor.discount_rate}%</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<div className="flex gap-2">
															<button 
																onClick={() => setShowViewDoctorProfile(doctor)}
																className="text-green-600 hover:text-green-800 font-semibold"
															>
																👁️ View
															</button>
															<button 
															onClick={() => {
																setShowEditDoctor(doctor);
																setDoctorForm({
																	name: doctor.name || '',
																	specialization: doctor.specialization || '',
																	degrees: doctor.degrees || '',
																	discount_rate: doctor.discount_rate || 50,
																	image_url: doctor.image_url || '',
																	consultation_fee: doctor.consultation_fee || '',
																	timing: doctor.timing || ''
																});
																setDoctorImagePreview(doctor.image_url || '');
																setDoctorImage(null);
															}}
																className="text-blue-600 hover:text-blue-800 font-semibold"
															>
																✏️ Edit
															</button>
															<button 
																onClick={() => deleteDoctor(doctor.id)}
																className="text-red-600 hover:text-red-800 font-semibold"
															>
																🗑️ Delete
															</button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{activeTab === 'teachers' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Teacher Management</h2>
								<button
									onClick={() => setShowAddTeacher(true)}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Teacher
								</button>
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{teachers.map(teacher => (
												<tr key={teacher.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{teacher.name || 'N/A'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.email || 'N/A'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.phone || 'N/A'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.teachers?.specialization || 'N/A'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
														<span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
															{teacher.role || 'teacher'}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<div className="flex gap-2">
															<button 
																onClick={() => setShowViewTeacherProfile(teacher)}
																className="text-green-600 hover:text-green-800 font-semibold"
															>
																👁️ View
															</button>
															<button 
																onClick={() => {
																	setShowEditTeacher(teacher);
																	setTeacherForm({
																		name: teacher.name || '',
																		email: teacher.email || '',
																		phone: teacher.phone || '',
																		specialization: teacher.teachers?.specialization || '',
																		image_url: teacher.teachers?.image_url || '',
																		password: ''
																	});
																	setTeacherImagePreview(teacher.teachers?.image_url || '');
																	setTeacherImage(null);
																}}
																className="text-blue-600 hover:text-blue-800 font-semibold"
															>
																✏️ Edit
															</button>
															<button 
																onClick={() => deleteTeacher(teacher.id)}
																className="text-red-600 hover:text-red-800 font-semibold"
															>
																🗑️ Delete
															</button>
														</div>
													</td>
												</tr>
											))}
											{teachers.length === 0 && (
												<tr>
													<td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
														No teachers found. Click "+ Add Teacher" to add your first teacher.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{activeTab === 'courses' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Course Management</h2>
								{/* Debug Info */}
								<div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-sm">
									<strong>Debug:</strong> Total courses loaded: {courses.length}
								</div>
								<button 
									onClick={() => setShowAddCourse(true)}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Course
								</button>
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
									{courses.map(course => {
										const assignedTeacher = teachers.find(t => t.id === course.trainer_id);
										return (
											<div key={course.id} className="border rounded-lg p-4 flex flex-col">
												<h3 className="font-semibold text-lg mb-2">{course.title}</h3>
												<p className="text-sm text-gray-600 mb-3 flex-grow">{course.description}</p>
												<div className="space-y-2 text-sm mb-3">
													<div className="flex justify-between">
														<span>Duration: {course.duration}</span>
														<span className="text-brand font-semibold">{course.discount_rate}% OFF</span>
													</div>
													<div className="pt-2 border-t border-gray-200">
														<span className="text-gray-600">Teacher: </span>
														<span className={assignedTeacher ? 'text-green-600 font-semibold' : 'text-gray-400 italic'}>
															{assignedTeacher ? assignedTeacher.name : 'Not Assigned'}
														</span>
													</div>
												</div>
												<div className="flex gap-2 pt-3 border-t">
													<button 
														onClick={() => {
															setShowEditCourse(course);
															setCourseForm({
																title: course.title || '',
																description: course.description || '',
																duration: course.duration || '',
																discount_rate: course.discount_rate || 70,
																trainer_id: course.trainer_id || ''
															});
														}}
														className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-semibold py-2 border border-blue-600 rounded hover:bg-blue-50"
													>
														✏️ Edit
													</button>
													<button 
														onClick={() => deleteCourse(course.id)}
														className="flex-1 text-red-600 hover:text-red-800 text-sm font-semibold py-2 border border-red-600 rounded hover:bg-red-50"
													>
														🗑️ Delete
													</button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}

					{activeTab === 'pharmacy' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Pharmacy Management</h2>
								<button 
									onClick={() => {
										resetMedicineForm();
										setShowAddMedicine(true);
									}}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Medicine
								</button>
							</div>
							{loading ? (
								<div className="flex flex-col items-center justify-center py-12">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
									<p className="text-gray-600">Loading pharmacy items...</p>
								</div>
							) : pharmacyItems.length === 0 ? (
								<div className="text-center py-12">
									<div className="text-6xl mb-4">💊</div>
									<p className="text-gray-600">No medicines found. Add your first medicine!</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{pharmacyItems.map(item => (
												<tr key={item.medicine_id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.name}</td>
													<td className="px-6 py-4 text-sm">{item.category}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">PKR {Number(item.price).toFixed(2)}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{item.stock_quantity}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand">{item.discount_percentage}%</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<button 
															onClick={() => {
																setMedicineForm({
																	name: item.name || '',
																	category: item.category || '',
																	description: item.description || '',
																	price: item.price !== undefined && item.price !== null ? Number(item.price) : DEFAULT_MEDICINE_FORM.price,
																	discount_percentage: item.discount_percentage !== undefined && item.discount_percentage !== null ? Number(item.discount_percentage) : DEFAULT_MEDICINE_FORM.discount_percentage,
																	stock_quantity: item.stock_quantity !== undefined && item.stock_quantity !== null ? Number(item.stock_quantity) : DEFAULT_MEDICINE_FORM.stock_quantity,
																	supplier_info: item.supplier_info || '',
																	image_url: item.image_url || ''
																});
																setMedicineImage(null);
																setMedicineImagePreview('');
																setShowEditMedicine(item);
															}}
															className="text-blue-600 hover:text-blue-800 mr-3"
														>
															✏️ Edit
														</button>
														<button 
															onClick={() => deleteMedicine(item.medicine_id)}
															className="text-red-600 hover:text-red-800"
														>
															🗑️ Delete
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{activeTab === 'labs' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Labs Management</h2>
								<button 
									onClick={() => setShowAddLab(true)}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Register Laboratory
								</button>
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
									{labs.map(lab => (
										<div key={lab.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition" onClick={(e) => e.stopPropagation()}>
											<div className="flex items-start justify-between mb-4">
												<div className="text-4xl">🧪</div>
												<button 
													onClick={() => deleteLab(lab.id)}
													className="text-red-500 hover:text-red-700 text-xl"
												>
													🗑️
												</button>
											</div>
											<h3 className="text-xl font-bold text-gray-900 mb-2">{lab.name}</h3>
											<p className="text-sm text-gray-600 mb-4">📍 {lab.location}</p>
											<p className="text-sm text-gray-700 mb-4">📞 {lab.contact_info}</p>
											<div className="mb-4">
												<p className="text-xs font-semibold text-gray-600 mb-2">Services:</p>
												<div className="flex flex-wrap gap-2">
													{lab.services?.map((service, idx) => (
														<span key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
															{service}
														</span>
													))}
												</div>
											</div>
											{userRole === 'admin' && (
												<button 
													type="button"
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														e.nativeEvent?.stopImmediatePropagation();
														console.log('🔘 Assign Test button clicked for lab:', lab.id, lab.name);
														console.log('🔘 Current showAssignLabTest state:', showAssignLabTest);
														
														// Set lab ID first
														setLabTestForm(prev => {
															const newForm = { ...prev, lab_id: lab.id };
															console.log('📝 Setting labTestForm:', newForm);
															return newForm;
														});
														
														// Show modal
														console.log('✅ Setting showAssignLabTest to true');
														setShowAssignLabTest(true);
														
														// Verify state update
														setTimeout(() => {
															console.log('✅ After state update, showAssignLabTest should be true');
														}, 100);
													}}
													style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
													className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all cursor-pointer"
													disabled={false}
												>
													Assign Test
												</button>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{activeTab === 'blood-bank' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Blood Banks Management</h2>
							</div>
							
							{/* Tabs */}
							{userRole === 'admin' && (
								<div className="flex gap-2 mb-6 border-b border-gray-200">
									<button
										onClick={() => setBloodBankTab('banks')}
										className={`px-4 py-2 font-medium border-b-2 transition ${
											bloodBankTab === 'banks'
												? 'border-red-600 text-red-600'
												: 'border-transparent text-gray-600 hover:text-gray-900'
										}`}
									>
										Blood Banks
									</button>
									<button
										onClick={() => setBloodBankTab('inventory')}
										className={`px-4 py-2 font-medium border-b-2 transition ${
											bloodBankTab === 'inventory'
												? 'border-red-600 text-red-600'
												: 'border-transparent text-gray-600 hover:text-gray-900'
										}`}
									>
										Inventory ({bloodInventory.length})
									</button>
									<button
										onClick={() => setBloodBankTab('requests')}
										className={`px-4 py-2 font-medium border-b-2 transition ${
											bloodBankTab === 'requests'
												? 'border-red-600 text-red-600'
												: 'border-transparent text-gray-600 hover:text-gray-900'
										}`}
									>
										Requests ({bloodRequests.filter(r => r.status === 'pending').length} pending)
									</button>
								</div>
							)}
							
							{bloodBankTab === 'banks' && (
								loading ? (
									<p>Loading...</p>
								) : (
									<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
										{bloodBanks.length === 0 ? (
											<div className="col-span-full text-center py-8 text-gray-500">
												<p>No blood banks registered yet.</p>
											</div>
										) : (
											bloodBanks.map(bloodBank => (
												<div key={bloodBank.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition">
													<div className="flex items-start justify-between mb-4">
														<div className="text-4xl">🩸</div>
														{bloodBank.verified ? (
															<span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Verified</span>
														) : (
															<span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">Pending</span>
														)}
													</div>
													<h3 className="text-xl font-bold text-gray-900 mb-2">{bloodBank.name || 'Unnamed Blood Bank'}</h3>
													<p className="text-sm text-gray-600 mb-2">📧 {bloodBank.email}</p>
													{bloodBank.phone && (
														<p className="text-sm text-gray-700 mb-4">📞 {bloodBank.phone}</p>
													)}
													<div className="mt-4 pt-4 border-t border-gray-200">
														<p className="text-xs text-gray-500">Role: <span className="font-semibold text-gray-700">{bloodBank.role}</span></p>
														<p className="text-xs text-gray-500 mt-1">
															Registered: {new Date(bloodBank.created_at).toLocaleDateString()}
														</p>
													</div>
												</div>
											))
										)}
									</div>
								)
							)}
							
							{bloodBankTab === 'inventory' && userRole === 'admin' && (
								<div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
									<div className="p-4 border-b border-gray-200 flex justify-between items-center">
										<h3 className="text-lg font-semibold">Blood Inventory</h3>
										<button
											onClick={() => {
												setBloodInventoryForm({ blood_type: '', quantity: '', expiry_date: '', status: 'available' });
												setEditingBloodInventory(null);
												setShowAddBloodInventory(true);
											}}
											className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold"
										>
											+ Add Inventory
										</button>
									</div>
									<div className="overflow-x-auto">
										<table className="min-w-full divide-y divide-gray-200">
											<thead className="bg-gray-50">
												<tr>
													<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Type</th>
													<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
													<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Bank</th>
													<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
													<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
													<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{bloodInventory.length === 0 ? (
													<tr>
														<td colSpan="6" className="px-6 py-8 text-center text-gray-500">
															No inventory available. Click "+ Add Inventory" to add blood stock.
														</td>
													</tr>
												) : (
													bloodInventory.map(item => (
														<tr key={item.id}>
															<td className="px-6 py-4 whitespace-nowrap">
																<span className="text-lg font-bold text-red-600">{item.blood_type}</span>
															</td>
															<td className="px-6 py-4 whitespace-nowrap">{item.quantity} units</td>
															<td className="px-6 py-4 whitespace-nowrap">
																{item.blood_banks?.name || 'Admin Blood Bank'}
																{item.blood_banks?.location && (
																	<div className="text-xs text-gray-500">{item.blood_banks.location}</div>
																)}
															</td>
															<td className="px-6 py-4 whitespace-nowrap">
																<span className={`px-2 py-1 text-xs rounded ${
																	item.status === 'available' ? 'bg-green-100 text-green-800' :
																	item.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
																	'bg-red-100 text-red-800'
																}`}>
																	{item.status}
																</span>
															</td>
															<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
																{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
															</td>
															<td className="px-6 py-4 whitespace-nowrap">
																<button
																	onClick={() => {
																		setEditingBloodInventory(item);
																		setBloodInventoryForm({
																			blood_type: item.blood_type,
																			quantity: item.quantity.toString(),
																			expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
																			status: item.status
																		});
																		setShowAddBloodInventory(true);
																	}}
																	className="text-red-600 hover:text-red-700 text-sm font-medium mr-3"
																>
																	Edit
																</button>
																<button
																	onClick={() => deleteBloodInventory(item.id)}
																	className="text-red-600 hover:text-red-700 text-sm font-medium"
																>
																	Delete
																</button>
															</td>
														</tr>
													))
												)}
											</tbody>
										</table>
									</div>
								</div>
							)}
							
							{bloodBankTab === 'requests' && userRole === 'admin' && (
								<div className="space-y-4">
									{bloodRequests.length === 0 ? (
										<div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
											<p className="text-gray-500">No blood requests found</p>
										</div>
									) : (
										bloodRequests.map(request => (
											<div key={request.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-3 mb-3">
															<h3 className="text-lg font-semibold">
																Blood Type: <span className="text-red-600">{request.blood_type}</span>
															</h3>
															<span className={`px-3 py-1 text-xs rounded ${
																request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
																request.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
																request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
																'bg-red-100 text-red-800'
															}`}>
																{request.status}
															</span>
														</div>
														<div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
															<div>
																<p className="text-gray-500 text-xs">Patient</p>
																<p className="font-medium">{request.patients?.users?.name || 'N/A'}</p>
																{request.patients?.users?.email && (
																	<p className="text-xs text-gray-500">{request.patients.users.email}</p>
																)}
															</div>
															<div>
																<p className="text-gray-500 text-xs">Requester Name</p>
																<p className="font-medium">{request.requester_name || 'N/A'}</p>
															</div>
															<div>
																<p className="text-gray-500 text-xs">Contact Number</p>
																<p className="font-medium">
																	{request.contact_number ? (
																		<a href={`tel:${request.contact_number}`} className="text-blue-600 hover:underline">
																			📞 {request.contact_number}
																		</a>
																	) : (
																		<span className="text-gray-400">N/A</span>
																	)}
																</p>
															</div>
															<div>
																<p className="text-gray-500 text-xs">Quantity</p>
																<p className="font-medium">{request.quantity} units</p>
															</div>
															<div>
																<p className="text-gray-500 text-xs">Urgency</p>
																<p className="font-medium capitalize">{request.urgency || 'normal'}</p>
															</div>
															<div>
																<p className="text-gray-500 text-xs">Date</p>
																<p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
															</div>
														</div>
														{request.notes && (
															<div className="mt-3">
																<p className="text-xs text-gray-500">Notes:</p>
																<p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{request.notes}</p>
															</div>
														)}
													</div>
												</div>
											</div>
										))
									)}
								</div>
							)}
						</div>
					)}

					{activeTab === 'lab-reports' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Lab Reports Management</h2>
								{userRole === 'admin' && (
									<button 
										onClick={() => {
											setLabTestForm({ patient_name: '', lab_id: '', test_type: '', remarks: '' });
											setShowAssignLabTest(true);
										}}
										className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
									>
										+ Assign Test
									</button>
								)}
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Type</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{labReports.map(report => (
												<tr key={report.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{report.report_date ? new Date(report.report_date).toLocaleDateString() : 
														 report.assigned_at ? new Date(report.assigned_at).toLocaleDateString() : 'N/A'}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{report.patients?.users?.name || report.patient_name || 'N/A'}
														{report.patients?.users?.email && (
															<div className="text-xs text-gray-500">{report.patients.users.email}</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{report.labs?.name || report.lab_id || 'N/A'}
														{report.labs?.location && (
															<div className="text-xs text-gray-500">{report.labs.location}</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{report.test_type || 'N/A'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{report.status ? (
															<span className={`px-2 py-1 text-xs rounded ${
																report.status === 'completed' ? 'bg-green-100 text-green-800' :
																report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
																'bg-gray-100 text-gray-800'
															}`}>
																{report.status}
															</span>
														) : (
															<span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
																Pending
															</span>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														{(report.file_url || report.test_paper_url) && (
															<button
																type="button"
																onClick={async (e) => {
																	e.preventDefault();
																	e.stopPropagation();
																	try {
																		// Get and verify session with token
																		let { data: { session }, error: sessionError } = await supabase.auth.getSession();
																		
																		// If no session, try to refresh
																		if (!session || !session.access_token) {
																			console.log('🔄 No session found, attempting refresh...');
																			const refreshResult = await supabase.auth.refreshSession();
																			session = refreshResult.data?.session;
																			sessionError = refreshResult.error;
																		}
																		
																		// If still no valid session/token, redirect to login
																		if (sessionError || !session || !session.access_token) {
																			console.error('❌ No valid session/token found:', sessionError);
																			alert('You are not logged in. Please log in to view reports.');
																			window.location.href = '/login';
																			return;
																		}
																		
																		// Check if token is expired
																		if (session.expires_at && session.expires_at * 1000 < Date.now()) {
																			console.log('🔄 Token expired, attempting refresh...');
																			const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
																			if (refreshError || !refreshedSession || !refreshedSession.access_token) {
																				console.error('❌ Failed to refresh session:', refreshError);
																				alert('Your session has expired. Please log in again.');
																				window.location.href = '/login';
																				return;
																			}
																			session = refreshedSession;
																		}
																		
																		// Now make the request with the verified token
																		const token = session.access_token;
																		console.log('🔍 [Admin Dashboard] Fetching report URL');
																		console.log('   Report ID:', report.id);
																		console.log('   Report data:', { 
																			id: report.id, 
																			file_url: report.file_url, 
																			test_paper_url: report.test_paper_url,
																			status: report.status,
																			lab_id: report.lab_id
																		});
																		console.log('   Token present:', !!token);
																		
																		const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
																		const response = await fetch(`${API_URL}/api/lab/reports/${report.id}/url`, {
																			method: 'GET',
																			headers: {
																				'Content-Type': 'application/json',
																				'Authorization': `Bearer ${token}`
																			}
																		});
																		
																		if (!response.ok) {
																			const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
																			if (response.status === 401 || errorData.error?.includes('token') || errorData.error?.includes('Unauthorized')) {
																				alert('Your session has expired. Please log in again.');
																				window.location.href = '/login';
																				return;
																			}
																			throw new Error(errorData.error || `HTTP ${response.status}`);
																		}
																		
																		const res = await response.json();
																		console.log('✅ Got report URL:', res);
																		if (res && res.url) {
																			window.open(res.url, '_blank');
																		} else {
																			alert('Failed to get report URL. Please try again.');
																		}
																	} catch (err) {
																		console.error('❌ Failed to load report:', err);
																		const errorMessage = err.message || 'Unknown error';
																		if (errorMessage.includes('Missing token') || errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
																			alert('Your session has expired or you are not logged in. Please log in again.');
																			window.location.href = '/login';
																		} else {
																			alert('Failed to load report: ' + errorMessage);
																		}
																	}
																}}
																className="text-brand hover:underline cursor-pointer"
															>
																View Report
															</button>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{activeTab === 'students' && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Student Management</h2>
								<button 
									onClick={() => {
										setEditingStudent(null);
										setStudentForm({ 
											name: '', 
											email: '', 
											phone: '', 
											course_id: '',
											roll_number: '',
											admission_date: '',
											password: '',
											status: 'active'
										});
										setShowAddStudent(true);
									}}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Student
								</button>
							</div>
							{loading ? (
								<div className="flex justify-center items-center py-12">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
									<p className="text-gray-600">Loading students...</p>
								</div>
							) : students.length === 0 ? (
								<div className="text-center py-12">
									<div className="text-6xl mb-4">👨‍🎓</div>
									<p className="text-gray-600">No students found. Add your first student!</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr className="border-b border-gray-200">
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll Number</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{students.map(student => (
												<tr key={student.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{student.name}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{student.email}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{student.phone || '-'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{student.course_title || '-'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{student.roll_number || '-'}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<span className={`px-2 py-1 text-xs rounded ${
															student.status === 'active' 
																? 'bg-green-100 text-green-800' 
																: student.status === 'inactive' 
																	? 'bg-red-100 text-red-800' 
																		: 'bg-gray-100 text-gray-800'
														}`}>
															{student.status || 'Unknown'}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<button 
															onClick={() => {
																setEditingStudent(student);
																setStudentForm({
																	name: student.name || '',
																	email: student.email || '',
																	phone: student.phone || '',
																	course_id: student.course_id || '',
																	roll_number: student.roll_number || '',
																	grade: student.grade || '',
																	section: student.section || '',
																	admission_date: student.admission_date || '',
																	status: student.status || 'active'
																});
																setShowEditStudent(true);
															}}
															className="text-blue-600 hover:text-blue-800 text-sm font-semibold py-2 border border-blue-600 rounded hover:bg-blue-50"
														>
															✏️ Edit
														</button>
														<button 
															onClick={() => {
																if (confirm(`Are you sure you want to delete student "${student.name}"?`)) {
																	handleDeleteStudent(student.id);
																}
															}}
															className="text-red-600 hover:text-red-800 text-sm font-semibold py-2 border border-red-600 rounded hover:bg-red-50 ml-2"
														>
															🗑️ Delete
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{activeTab === 'specialties' && (
						<div>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold">Specialties Management</h2>
								<button 
									onClick={() => {
										setEditingSpecialty(null);
										setSpecialtyForm({ label: '', icon: '', display_order: 0, is_active: true });
										setShowAddSpecialty(true);
									}}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Specialty
								</button>
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
									{specialties.map(specialty => (
										<div key={specialty.id} className="bg-white border rounded-lg p-4 shadow-sm">
											<div className="flex items-center justify-between mb-3">
												<div className="text-4xl">{specialty.icon}</div>
												<div className="flex gap-2">
													<button
														onClick={() => {
															setEditingSpecialty({ ...specialty });
															setShowAddSpecialty(true);
														}}
														className="text-blue-600 hover:text-blue-800 text-sm"
													>
														✏️ Edit
													</button>
													<button
														onClick={() => deleteSpecialty(specialty.id)}
														className="text-red-600 hover:text-red-800 text-sm"
													>
														🗑️ Delete
													</button>
												</div>
											</div>
											<h3 className="font-semibold text-gray-800">{specialty.label}</h3>
											<div className="mt-2 text-xs text-gray-500">
												Order: {specialty.display_order} | {specialty.is_active ? '✅ Active' : '❌ Inactive'}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{activeTab === 'conditions' && (
						<div>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold">Conditions Management</h2>
								<button 
									onClick={() => {
										setEditingCondition(null);
										setConditionForm({ label: '', icon: '', search_keyword: '', display_order: 0, is_active: true });
										setShowAddCondition(true);
									}}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Condition
								</button>
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
									{conditions.map(condition => (
										<div key={condition.id} className="bg-white border rounded-lg p-4 shadow-sm">
											<div className="flex items-center justify-between mb-3">
												<div className="text-4xl">{condition.icon}</div>
												<div className="flex gap-2">
													<button
														onClick={() => {
															setEditingCondition({ ...condition });
															setShowAddCondition(true);
														}}
														className="text-blue-600 hover:text-blue-800 text-sm"
													>
														✏️ Edit
													</button>
													<button
														onClick={() => deleteCondition(condition.id)}
														className="text-red-600 hover:text-red-800 text-sm"
													>
														🗑️ Delete
													</button>
												</div>
											</div>
											<h3 className="font-semibold text-gray-800">{condition.label}</h3>
											<div className="mt-2 text-xs text-gray-500">
												Search: {condition.search_keyword}<br />
												Order: {condition.display_order} | {condition.is_active ? '✅ Active' : '❌ Inactive'}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{activeTab === 'surgery-bookings' && (
						<div>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold">Surgery Bookings</h2>
							</div>
							{loading ? (
								<div className="text-center py-12">
									<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
									<p className="mt-4 text-gray-600">Loading surgery bookings...</p>
								</div>
							) : surgeryBookings.length === 0 ? (
								<div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
									<div className="text-6xl mb-4">🏥</div>
									<h3 className="text-xl font-bold text-gray-900 mb-2">No surgery bookings found</h3>
									<p className="text-gray-600">Bookings will appear here when patients submit surgery consultation requests.</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surgery Type</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{surgeryBookings.map((booking) => (
												<tr key={booking.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{booking.patient_name}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{booking.phone}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{booking.city || 'N/A'}</td>
													<td className="px-6 py-4 text-sm">{booking.surgery_type}</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span className={`px-2 py-1 text-xs font-semibold rounded-full ${
															booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
															booking.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
															booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
															booking.status === 'completed' ? 'bg-purple-100 text-purple-800' :
															'bg-red-100 text-red-800'
														}`}>
															{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
														{new Date(booking.created_at).toLocaleDateString()} {new Date(booking.created_at).toLocaleTimeString()}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<select
															value={booking.status}
															onChange={async (e) => {
																const newStatus = e.target.value;
																try {
																	await apiRequest(`/api/surgery-bookings/${booking.id}`, {
																		method: 'PUT',
																		body: JSON.stringify({ status: newStatus })
																	});
																	setSurgeryBookings(prev => prev.map(b => 
																		b.id === booking.id ? { ...b, status: newStatus } : b
																	));
																} catch (err) {
																	alert('Failed to update status: ' + err.message);
																}
															}}
															className="text-sm border rounded px-2 py-1"
														>
															<option value="pending">Pending</option>
															<option value="contacted">Contacted</option>
															<option value="confirmed">Confirmed</option>
															<option value="completed">Completed</option>
															<option value="cancelled">Cancelled</option>
														</select>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{activeTab === 'surgery-categories' && (
						<div>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold">Surgery Categories Management</h2>
								<button 
									onClick={() => {
										setEditingSurgeryCategory(null);
										setSurgeryCategoryForm({ name: '', icon: '', description: '', display_order: 0, is_active: true });
										setShowAddSurgeryCategory(true);
									}}
									className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
								>
									+ Add Surgery Category
								</button>
							</div>
							{loading ? (
								<div className="text-center py-12">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
									<p className="mt-4 text-gray-600">Loading surgery categories...</p>
								</div>
							) : surgeryCategories.length === 0 ? (
								<div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
									<div className="text-6xl mb-4">🏥</div>
									<h3 className="text-xl font-bold text-gray-900 mb-2">No surgery categories found</h3>
									<p className="text-gray-600 mb-4">Get started by adding your first surgery category, or run the SQL script to load default categories.</p>
									<p className="text-sm text-gray-500">Check the browser console for any errors.</p>
								</div>
							) : (
								<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
									{surgeryCategories.map(category => (
										<div key={category.id} className="bg-white border rounded-lg p-4 shadow-sm">
											<div className="flex items-center justify-between mb-3">
												<div className="text-4xl">{category.icon}</div>
												<div className="flex gap-2">
													<button
														onClick={() => {
															setEditingSurgeryCategory({ ...category });
															setShowAddSurgeryCategory(true);
														}}
														className="text-blue-600 hover:text-blue-800 text-sm"
													>
														✏️ Edit
													</button>
													<button
														onClick={() => deleteSurgeryCategory(category.id)}
														className="text-red-600 hover:text-red-800 text-sm"
													>
														🗑️ Delete
													</button>
												</div>
											</div>
											<h3 className="font-semibold text-gray-800">{category.name}</h3>
											{category.description && (
												<p className="text-sm text-gray-600 mt-1">{category.description}</p>
											)}
											<div className="mt-2 text-xs text-gray-500">
												Order: {category.display_order} | {category.is_active ? '✅ Active' : '❌ Inactive'}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Home Services Requests */}
					{activeTab === 'home-services' && (
						<div>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold">Home Services Requests</h2>
							</div>
							{loading ? (
								<div className="text-center py-12">
									<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
									<p className="mt-4 text-gray-600">Loading home services requests...</p>
								</div>
							) : homeServicesRequests.length === 0 ? (
								<div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
									<div className="text-6xl mb-4">🏠</div>
									<h3 className="text-xl font-bold text-gray-900 mb-2">No home services requests found</h3>
									<p className="text-gray-600">Requests will appear here when patients submit home service requests.</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{homeServicesRequests.map((request) => (
												<tr key={request.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{request.patient_name}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">{request.patient_phone}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{request.service_type}</td>
													<td className="px-6 py-4 text-sm max-w-xs truncate">{request.address}</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span className={`px-2 py-1 text-xs font-semibold rounded-full ${
															request.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
															request.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
															'bg-blue-100 text-blue-800'
														}`}>
															{request.urgency ? request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1) : 'Normal'}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span className={`px-2 py-1 text-xs font-semibold rounded-full ${
															request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
															request.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
															request.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
															request.status === 'completed' ? 'bg-green-100 text-green-800' :
															'bg-red-100 text-red-800'
														}`}>
															{request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ') : 'Pending'}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
														{new Date(request.created_at).toLocaleDateString()} {new Date(request.created_at).toLocaleTimeString()}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<select
															value={request.status}
															onChange={async (e) => {
																const newStatus = e.target.value;
																try {
																	await apiRequest(`/api/home-services/requests/${request.id}`, {
																		method: 'PUT',
																		body: JSON.stringify({ status: newStatus })
																	});
																	setHomeServicesRequests(prev => prev.map(r => 
																		r.id === request.id ? { ...r, status: newStatus } : r
																	));
																} catch (err) {
																	alert('Failed to update status: ' + err.message);
																}
															}}
															className="text-sm border rounded px-2 py-1"
														>
															<option value="pending">Pending</option>
															<option value="confirmed">Confirmed</option>
															<option value="in_progress">In Progress</option>
															<option value="completed">Completed</option>
															<option value="cancelled">Cancelled</option>
														</select>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{/* Jobs Management */}
					{activeTab === 'jobs' && (
						<div>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-2xl font-bold text-gray-900">Jobs Management</h2>
								<button
									onClick={() => {
										setJobForm({
											title: '',
											department: '',
											description: '',
											requirements: '',
											location: '',
											employment_type: 'full-time',
											salary_range: '',
											experience_required: '',
											education_required: '',
											is_active: true
										});
										setShowAddJob(true);
									}}
									className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-semibold"
								>
									+ Add Job
								</button>
				</div>

							{/* Jobs List */}
							<div className="space-y-4">
								{jobs.filter(job => job.is_active !== false).length === 0 ? (
									<div className="text-center py-12 bg-gray-50 rounded-lg">
										<p className="text-gray-500">No jobs posted yet</p>
			</div>
								) : (
									jobs.filter(job => job.is_active !== false).map((job) => (
										<div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
											<div className="flex justify-between items-start">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
														{job.department && (
															<span className="px-2 py-1 bg-brand/10 text-brand rounded text-sm font-semibold">
																{job.department}
															</span>
														)}
														<span className={`px-2 py-1 rounded text-xs font-semibold ${
															job.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
														}`}>
															{job.is_active ? 'Active' : 'Inactive'}
														</span>
													</div>
													<p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
													<div className="flex flex-wrap gap-4 text-sm text-gray-500">
														{job.location && <span>📍 {job.location}</span>}
														{job.employment_type && <span>💼 {job.employment_type}</span>}
														{job.salary_range && <span>💰 {job.salary_range}</span>}
														<span>📅 {new Date(job.created_at).toLocaleDateString()}</span>
													</div>
													<div className="mt-3">
														<span className="text-sm text-brand font-semibold">
															{jobApplications.filter(app => app.job_id === job.id).length} Application(s)
														</span>
													</div>
												</div>
												<div className="flex gap-2 ml-4">
													<button
														onClick={() => {
															setSelectedJobForApplications(job.id);
															setShowApplications(true);
														}}
														className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold"
													>
														View Applications
													</button>
													<button
														onClick={() => {
															setJobForm({
																title: job.title,
																department: job.department || '',
																description: job.description,
																requirements: job.requirements || '',
																location: job.location || '',
																employment_type: job.employment_type || 'full-time',
																salary_range: job.salary_range || '',
																experience_required: job.experience_required || '',
																education_required: job.education_required || '',
																is_active: job.is_active
															});
															setShowEditJob(job.id);
														}}
														className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-semibold"
													>
														Edit
													</button>
													<button
														onClick={async () => {
															if (confirm('Are you sure you want to delete this job?')) {
																try {
																	// Clear cache before delete
																	clearCache('/api/jobs');
																	clearCache('/api/jobs/applications/all');
																	const result = await apiRequest(`/api/jobs/${job.id}`, { method: 'DELETE', noCache: true });
																	console.log('Delete result:', result);
																	// Clear cache again after delete
																	clearCache('/api/jobs');
																	clearCache('/api/jobs/applications/all');
																	if (activeTab === 'jobs') {
																		loadData();
																	}
																} catch (err) {
																	console.error('Delete error:', err);
																	alert('Error deleting job: ' + (err.message || 'Unknown error'));
																}
															}
														}}
														className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-semibold"
													>
														Delete
													</button>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}

				</div>
			</div>

			{/* Add Job Modal */}
			{showAddJob && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Job</h3>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Job Title *</label>
									<input
										type="text"
										value={jobForm.title}
										onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Department</label>
									<input
										type="text"
										value={jobForm.department}
										onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Description *</label>
								<textarea
									rows={4}
									value={jobForm.description}
									onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
									className="w-full px-4 py-2 border rounded-lg"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Requirements</label>
								<textarea
									rows={3}
									value={jobForm.requirements}
									onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
									className="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Location</label>
									<input
										type="text"
										value={jobForm.location}
										onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Employment Type</label>
									<select
										value={jobForm.employment_type}
										onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
									>
										<option value="full-time">Full Time</option>
										<option value="part-time">Part Time</option>
										<option value="contract">Contract</option>
										<option value="internship">Internship</option>
									</select>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Salary Range</label>
									<input
										type="text"
										value={jobForm.salary_range}
										onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
										placeholder="e.g., PKR 50,000 - 80,000"
										className="w-full px-4 py-2 border rounded-lg"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Experience Required</label>
									<input
										type="text"
										value={jobForm.experience_required}
										onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })}
										placeholder="e.g., 2-3 years"
										className="w-full px-4 py-2 border rounded-lg"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Education Required</label>
								<input
									type="text"
									value={jobForm.education_required}
									onChange={(e) => setJobForm({ ...jobForm, education_required: e.target.value })}
									placeholder="e.g., Bachelor's degree"
									className="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={jobForm.is_active}
									onChange={(e) => setJobForm({ ...jobForm, is_active: e.target.checked })}
									className="w-4 h-4"
								/>
								<label className="text-sm font-medium">Active (visible to public)</label>
							</div>
							<div className="flex gap-3 pt-4">
								<button
									onClick={async () => {
										try {
											// Clear cache before create
											clearCache('/api/jobs');
											clearCache('/api/jobs/applications/all');
											await apiRequest('/api/jobs', {
												method: 'POST',
												body: jobForm,
												noCache: true
											});
											// Clear cache again after create
											clearCache('/api/jobs');
											clearCache('/api/jobs/applications/all');
											setShowAddJob(false);
											// Reload jobs data
											if (activeTab === 'jobs') {
												loadData();
											}
										} catch (err) {
											alert('Error creating job: ' + (err.message || 'Unknown error'));
										}
									}}
									className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-semibold"
								>
									Create Job
								</button>
								<button
									onClick={() => setShowAddJob(false)}
									className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Edit Job Modal */}
			{showEditJob && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Job</h3>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Job Title *</label>
									<input
										type="text"
										value={jobForm.title}
										onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Department</label>
									<input
										type="text"
										value={jobForm.department}
										onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Description *</label>
								<textarea
									rows={4}
									value={jobForm.description}
									onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
									className="w-full px-4 py-2 border rounded-lg"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Requirements</label>
								<textarea
									rows={3}
									value={jobForm.requirements}
									onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
									className="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Location</label>
									<input
										type="text"
										value={jobForm.location}
										onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Employment Type</label>
									<select
										value={jobForm.employment_type}
										onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
									>
										<option value="full-time">Full Time</option>
										<option value="part-time">Part Time</option>
										<option value="contract">Contract</option>
										<option value="internship">Internship</option>
									</select>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Salary Range</label>
									<input
										type="text"
										value={jobForm.salary_range}
										onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Experience Required</label>
									<input
										type="text"
										value={jobForm.experience_required}
										onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })}
										className="w-full px-4 py-2 border rounded-lg"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Education Required</label>
								<input
									type="text"
									value={jobForm.education_required}
									onChange={(e) => setJobForm({ ...jobForm, education_required: e.target.value })}
									className="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={jobForm.is_active}
									onChange={(e) => setJobForm({ ...jobForm, is_active: e.target.checked })}
									className="w-4 h-4"
								/>
								<label className="text-sm font-medium">Active (visible to public)</label>
							</div>
							<div className="flex gap-3 pt-4">
								<button
									onClick={async () => {
										try {
											console.log('Updating job:', showEditJob, jobForm);
											// Clear cache before update
											clearCache('/api/jobs');
											clearCache('/api/jobs/applications/all');
											const result = await apiRequest(`/api/jobs/${showEditJob}`, {
												method: 'PUT',
												body: jobForm,
												noCache: true
											});
											console.log('Update result:', result);
											// Clear cache again after update
											clearCache('/api/jobs');
											clearCache('/api/jobs/applications/all');
											setShowEditJob(null);
											if (activeTab === 'jobs') {
												loadData();
											}
										} catch (err) {
											console.error('Update error:', err);
											alert('Error updating job: ' + (err.message || 'Unknown error'));
										}
									}}
									className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-semibold"
								>
									Update Job
								</button>
								<button
									onClick={() => setShowEditJob(null)}
									className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Applications Modal */}
			{showApplications && selectedJobForApplications && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-2xl font-bold text-gray-900">
								Applications for {jobs.find(j => j.id === selectedJobForApplications)?.title}
							</h3>
							<button
								onClick={() => {
									setShowApplications(false);
									setSelectedJobForApplications(null);
								}}
								className="text-gray-500 hover:text-gray-700 text-2xl"
							>
								×
							</button>
						</div>
						<div className="space-y-4">
							{jobApplications.filter(app => app.job_id === selectedJobForApplications).length === 0 ? (
								<p className="text-gray-500 text-center py-8">No applications yet</p>
							) : (
								jobApplications
									.filter(app => app.job_id === selectedJobForApplications)
									.map((application) => (
										<div key={application.id} className="border border-gray-200 rounded-lg p-6">
											<div className="mb-4">
												<h4 className="text-lg font-bold text-gray-900 mb-3">{application.applicant_name}</h4>
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<span className="text-sm text-gray-500">📧 Email:</span>
														<a 
															href={`mailto:${application.applicant_email}`}
															className="text-brand hover:underline font-semibold"
														>
															{application.applicant_email}
														</a>
													</div>
													<div className="flex items-center gap-2">
														<span className="text-sm text-gray-500">📞 Phone:</span>
														<a 
															href={`tel:${application.applicant_phone}`}
															className="text-brand hover:underline font-semibold"
														>
															{application.applicant_phone}
														</a>
													</div>
												</div>
											</div>
											{application.cover_letter && (
												<div className="mb-4">
													<p className="text-sm font-semibold text-gray-700 mb-1">Cover Letter:</p>
													<p className="text-sm text-gray-600 whitespace-pre-wrap">{application.cover_letter}</p>
												</div>
											)}
											<p className="text-xs text-gray-500 mt-4">
												Applied: {new Date(application.created_at).toLocaleString()}
											</p>
										</div>
									))
							)}
						</div>
					</div>
				</div>
			)}

			{/* Add Doctor Modal */}
			{showAddDoctor && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Doctor</h3>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium mb-1">Name</label>
								<input 
									className="w-full border p-2 rounded"
									value={doctorForm.name}
									onChange={e => setDoctorForm({...doctorForm, name: e.target.value})}
									placeholder="Dr. Ahmed Khan"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Specialization</label>
								<input 
									className="w-full border p-2 rounded"
									value={doctorForm.specialization}
									onChange={e => setDoctorForm({...doctorForm, specialization: e.target.value})}
									placeholder="Cardiologist"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Degrees</label>
								<input 
									className="w-full border p-2 rounded"
									value={doctorForm.degrees}
									onChange={e => setDoctorForm({...doctorForm, degrees: e.target.value})}
									placeholder="MBBS, FCPS"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Discount Rate (%)</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={doctorForm.discount_rate}
									onChange={e => setDoctorForm({...doctorForm, discount_rate: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Consultation Fee (PKR)</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={doctorForm.consultation_fee}
									onChange={e => setDoctorForm({...doctorForm, consultation_fee: e.target.value})}
									placeholder="e.g., 2000"
									min="0"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Consultation Timing</label>
								<input 
									type="text"
									className="w-full border p-2 rounded"
									value={doctorForm.timing}
									onChange={e => setDoctorForm({...doctorForm, timing: e.target.value})}
									placeholder="e.g., Mon-Fri: 9 AM - 5 PM"
								/>
							</div>
							<div>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={doctorForm.home_services || false}
										onChange={e => setDoctorForm({...doctorForm, home_services: e.target.checked})}
										className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
									/>
									<span className="text-sm font-medium">Provide Home Services</span>
								</label>
								<p className="text-xs text-gray-500 mt-1 ml-6">Check this if the doctor offers home visit services</p>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={addDoctor}
								className="flex-1 bg-brand text-white px-4 py-2 rounded"
							>
								Add Doctor
							</button>
							<button 
								onClick={() => {
									setShowAddDoctor(false);
									setDoctorForm({ name: '', specialization: '', degrees: '', discount_rate: 50, image_url: '', consultation_fee: '', timing: '', home_services: false });
									setDoctorImagePreview('');
									setDoctorImage(null);
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Doctor Modal */}
			{showEditDoctor && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Edit Doctor</h3>
							<button
								onClick={() => {
									setShowEditDoctor(null);
									setDoctorForm({ name: '', specialization: '', degrees: '', discount_rate: 50, image_url: '', consultation_fee: '', timing: '', home_services: false });
									setDoctorImagePreview('');
									setDoctorImage(null);
								}}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium mb-1">Name</label>
								<input 
									className="w-full border p-2 rounded"
									value={doctorForm.name || showEditDoctor.name}
									onChange={e => setDoctorForm({...doctorForm, name: e.target.value})}
									placeholder="Dr. Ahmed Khan"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Specialization</label>
								<input 
									className="w-full border p-2 rounded"
									value={doctorForm.specialization !== undefined ? doctorForm.specialization : (showEditDoctor.specialization || '')}
									onChange={e => setDoctorForm({...doctorForm, specialization: e.target.value})}
									placeholder="Cardiologist"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Degrees</label>
								<input 
									className="w-full border p-2 rounded"
									value={doctorForm.degrees !== undefined ? doctorForm.degrees : (showEditDoctor.degrees || '')}
									onChange={e => setDoctorForm({...doctorForm, degrees: e.target.value})}
									placeholder="MBBS, FCPS"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Discount Rate (%)</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={doctorForm.discount_rate !== undefined ? doctorForm.discount_rate : (showEditDoctor.discount_rate || 50)}
									onChange={e => setDoctorForm({...doctorForm, discount_rate: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Consultation Fee (PKR)</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={doctorForm.consultation_fee !== undefined ? doctorForm.consultation_fee : (showEditDoctor.consultation_fee || '')}
									onChange={e => setDoctorForm({...doctorForm, consultation_fee: e.target.value})}
									placeholder="e.g., 2000"
									min="0"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Consultation Timing</label>
								<input 
									type="text"
									className="w-full border p-2 rounded"
									value={doctorForm.timing !== undefined ? doctorForm.timing : (showEditDoctor.timing || '')}
									onChange={e => setDoctorForm({...doctorForm, timing: e.target.value})}
									placeholder="e.g., Mon-Fri: 9 AM - 5 PM"
								/>
							</div>
							<div>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={doctorForm.home_services !== undefined ? doctorForm.home_services : (showEditDoctor.home_services || false)}
										onChange={e => setDoctorForm({...doctorForm, home_services: e.target.checked})}
										className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
									/>
									<span className="text-sm font-medium">Provide Home Services</span>
								</label>
								<p className="text-xs text-gray-500 mt-1 ml-6">Check this if the doctor offers home visit services</p>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={async () => {
									// Merge form data with existing doctor data, keeping image_url if no new image was uploaded
									const updates = {
										name: doctorForm.name || showEditDoctor.name,
										specialization: doctorForm.specialization !== undefined ? doctorForm.specialization : showEditDoctor.specialization,
										degrees: doctorForm.degrees !== undefined ? doctorForm.degrees : showEditDoctor.degrees,
										discount_rate: doctorForm.discount_rate !== undefined ? doctorForm.discount_rate : showEditDoctor.discount_rate,
										image_url: doctorForm.image_url || showEditDoctor.image_url || null,
										consultation_fee: doctorForm.consultation_fee !== undefined ? (doctorForm.consultation_fee ? Number(doctorForm.consultation_fee) : null) : showEditDoctor.consultation_fee,
										timing: doctorForm.timing !== undefined ? doctorForm.timing : showEditDoctor.timing,
										home_services: doctorForm.home_services !== undefined ? doctorForm.home_services : (showEditDoctor.home_services || false)
									};
									await updateDoctor(showEditDoctor.id, updates);
									setShowEditDoctor(null);
									setDoctorForm({ name: '', specialization: '', degrees: '', discount_rate: 50, image_url: '', consultation_fee: '', timing: '', home_services: false });
									setDoctorImagePreview('');
									setDoctorImage(null);
								}}
								className="flex-1 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
							>
								Update Doctor
							</button>
							<button 
								onClick={() => {
									setShowEditDoctor(null);
									setDoctorForm({ name: '', specialization: '', degrees: '', discount_rate: 50, image_url: '', consultation_fee: '', timing: '', home_services: false });
									setDoctorImagePreview('');
									setDoctorImage(null);
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add Teacher Modal */}
			{showAddTeacher && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Add New Teacher</h3>
							<button 
								onClick={() => {
									setShowAddTeacher(false);
									setTeacherForm({ name: '', email: '', password: '', phone: '', specialization: '', image_url: '' });
									setTeacherImagePreview('');
									setTeacherImage(null);
								}}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>
						<div className="space-y-3">
							{/* Photo Upload */}
							<div>
								<label className="block text-sm font-medium mb-1">Teacher Photo</label>
								<div className="flex items-center gap-4">
									<div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
										{teacherImagePreview ? (
											<img src={teacherImagePreview} alt="Preview" className="w-full h-full object-cover" />
										) : (
											<div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
												👨‍🏫
											</div>
										)}
									</div>
									<div className="flex-1">
										<label
											htmlFor="teacher-image-input-add"
											className="inline-block bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
											style={{ pointerEvents: uploadingTeacherImage ? 'none' : 'auto' }}
										>
											Choose File
										</label>
										<input
											id="teacher-image-input-add"
											ref={teacherImageInputRef}
											type="file"
											accept="image/*"
											onChange={handleTeacherImageChange}
											disabled={uploadingTeacherImage}
											style={{
												position: 'absolute',
												width: '1px',
												height: '1px',
												padding: 0,
												margin: '-1px',
												overflow: 'hidden',
												clip: 'rect(0, 0, 0, 0)',
												whiteSpace: 'nowrap',
												borderWidth: 0
											}}
										/>
										{teacherImagePreview && (
											<p className="text-xs text-gray-600 mt-2">✓ Image selected</p>
										)}
										{uploadingTeacherImage && (
											<p className="text-xs text-gray-500 mt-1">Uploading image...</p>
										)}
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Name *</label>
								<input 
									className="w-full border p-2 rounded"
									value={teacherForm.name}
									onChange={e => setTeacherForm({...teacherForm, name: e.target.value})}
									placeholder="John Doe"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Email *</label>
								<input 
									type="email"
									className="w-full border p-2 rounded"
									value={teacherForm.email}
									onChange={e => setTeacherForm({...teacherForm, email: e.target.value})}
									placeholder="teacher@example.com"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Phone</label>
								<input 
									type="tel"
									className="w-full border p-2 rounded"
									value={teacherForm.phone}
									onChange={e => setTeacherForm({...teacherForm, phone: e.target.value})}
									placeholder="+92 300 1234567"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Password *</label>
								<input 
									type="password"
									className="w-full border p-2 rounded"
									value={teacherForm.password}
									onChange={e => setTeacherForm({...teacherForm, password: e.target.value})}
									placeholder="Minimum 6 characters"
									required
									minLength="6"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Specialization</label>
								<input 
									className="w-full border p-2 rounded"
									value={teacherForm.specialization}
									onChange={e => setTeacherForm({...teacherForm, specialization: e.target.value})}
									placeholder="e.g., Mathematics, Science, English"
								/>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={addTeacher}
								className="flex-1 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
							>
								Add Teacher
							</button>
							<button 
								onClick={() => {
									setShowAddTeacher(false);
									setTeacherForm({ name: '', email: '', password: '', phone: '', specialization: '', image_url: '' });
									setTeacherImagePreview('');
									setTeacherImage(null);
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Teacher Modal */}
			{showEditTeacher && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Edit Teacher</h3>
							<button 
								onClick={() => {
									setShowEditTeacher(null);
									setTeacherForm({ name: '', email: '', password: '', phone: '', specialization: '', image_url: '' });
									setTeacherImagePreview('');
									setTeacherImage(null);
								}}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>
						<div className="space-y-3">
							{/* Photo Upload */}
							<div>
								<label className="block text-sm font-medium mb-1">Teacher Photo</label>
								<div className="flex items-center gap-4">
									<div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
									{teacherImagePreview || showEditTeacher.teachers?.image_url ? (
										<img 
											src={(() => {
												const url = teacherImagePreview || showEditTeacher.teachers?.image_url;
												return url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
											})()} 
											alt="Preview" 
											className="w-full h-full object-cover" 
											key={teacherImagePreview || showEditTeacher.teachers?.image_url}
										/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
												👨‍🏫
											</div>
										)}
									</div>
									<div className="flex-1">
										<button
											type="button"
											onClick={() => teacherImageInputRef.current?.click()}
											disabled={uploadingTeacherImage}
											className="inline-block bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Choose File
										</button>
										<input
											ref={teacherImageInputRef}
											type="file"
											accept="image/*"
											onChange={handleTeacherImageChange}
											className="hidden"
											disabled={uploadingTeacherImage}
										/>
										{teacherImagePreview && (
											<p className="text-xs text-gray-600 mt-2">✓ Image selected</p>
										)}
										{uploadingTeacherImage && (
											<p className="text-xs text-gray-500 mt-1">Uploading image...</p>
										)}
										{showEditTeacher.teachers?.image_url && !teacherImagePreview && (
											<p className="text-xs text-gray-500 mt-1">Current image will be kept if no new image is uploaded</p>
										)}
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Name *</label>
								<input 
									className="w-full border p-2 rounded"
									value={teacherForm.name || showEditTeacher.name}
									onChange={e => setTeacherForm({...teacherForm, name: e.target.value})}
									placeholder="John Doe"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Email</label>
								<input 
									type="email"
									className="w-full border p-2 rounded bg-gray-100"
									value={showEditTeacher.email}
									disabled
									title="Email cannot be changed"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Phone</label>
								<input 
									type="tel"
									className="w-full border p-2 rounded"
									value={teacherForm.phone !== undefined ? teacherForm.phone : (showEditTeacher.phone || '')}
									onChange={e => setTeacherForm({...teacherForm, phone: e.target.value})}
									placeholder="+92 300 1234567"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">New Password (leave blank to keep current)</label>
								<input 
									type="password"
									className="w-full border p-2 rounded"
									value={teacherForm.password}
									onChange={e => setTeacherForm({...teacherForm, password: e.target.value})}
									placeholder="Minimum 6 characters"
									minLength="6"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Specialization</label>
								<input 
									className="w-full border p-2 rounded"
									value={teacherForm.specialization !== undefined ? teacherForm.specialization : (showEditTeacher.teachers?.specialization || '')}
									onChange={e => setTeacherForm({...teacherForm, specialization: e.target.value})}
									placeholder="e.g., Mathematics, Science, English"
								/>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={updateTeacher}
								className="flex-1 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
							>
								Update Teacher
							</button>
							<button 
								onClick={() => {
									setShowEditTeacher(null);
									setTeacherForm({ name: '', email: '', password: '', phone: '', specialization: '', image_url: '' });
									setTeacherImagePreview('');
									setTeacherImage(null);
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* View Teacher Profile Modal */}
			{showViewTeacherProfile && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Teacher Profile</h3>
							<button
								onClick={() => setShowViewTeacherProfile(null)}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>

						<div className="space-y-6">
							{/* Profile Avatar */}
							<div className="flex justify-center">
								<div className="relative">
									{(() => {
										const imageUrl = showViewTeacherProfile.teachers?.image_url;
										console.log('🖼️ View Teacher Profile - Teacher:', showViewTeacherProfile.name);
										console.log('🖼️ Image URL:', imageUrl);
										console.log('🖼️ Full teachers object:', showViewTeacherProfile.teachers);
										
									if (imageUrl) {
										// Add cache-busting parameter to force browser refresh
										const imageUrlWithCacheBust = imageUrl.includes('?') 
											? `${imageUrl}&t=${Date.now()}` 
											: `${imageUrl}?t=${Date.now()}`;
										return (
											<div className="w-48 h-48 rounded-full overflow-hidden shadow-xl border-4 border-white">
												<img 
													src={imageUrlWithCacheBust} 
													alt={showViewTeacherProfile.name} 
													className="w-full h-full object-cover"
													onError={(e) => {
														console.error('❌ Failed to load teacher image:', imageUrl);
														e.target.style.display = 'none';
														e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-purple-100 to-purple-400">👨‍🏫</div>';
													}}
													onLoad={() => {
														console.log('✅ Teacher image loaded successfully:', imageUrl);
													}}
												/>
											</div>
										);
										} else {
											console.warn('⚠️ No image_url found for teacher:', showViewTeacherProfile.name);
											return (
												<div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-purple-400 flex items-center justify-center text-7xl shadow-xl border-4 border-white">
													👨‍🏫
												</div>
											);
										}
									})()}
									<div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white">
										<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
										</svg>
									</div>
								</div>
							</div>

							{/* Teacher Information */}
							<div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-6 space-y-4">
								<div className="text-center mb-4">
									<h2 className="text-3xl font-bold text-gray-900 mb-2">{showViewTeacherProfile.name || 'N/A'}</h2>
									<span className="bg-gradient-to-r from-purple-400 to-purple-600 text-white text-sm px-3 py-1 rounded-full font-semibold inline-block">
										✓ VERIFIED TEACHER
									</span>
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
										<p className="text-lg font-semibold text-gray-900">{showViewTeacherProfile.email || 'N/A'}</p>
									</div>

									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone</label>
										<p className="text-lg font-semibold text-gray-900">{showViewTeacherProfile.phone || 'N/A'}</p>
									</div>

									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Specialization</label>
										<p className="text-lg font-semibold text-brand">{showViewTeacherProfile.teachers?.specialization || 'N/A'}</p>
									</div>

									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teacher ID</label>
										<p className="text-sm font-mono text-gray-600 break-all">{showViewTeacherProfile.id}</p>
									</div>
								</div>

								<div className="bg-white rounded-lg p-4 shadow-sm">
									<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
									<p className="text-lg font-semibold text-purple-600 capitalize">{showViewTeacherProfile.role || 'teacher'}</p>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={() => {
										setShowViewTeacherProfile(null);
										setShowEditTeacher(showViewTeacherProfile);
										setTeacherForm({
											name: showViewTeacherProfile.name || '',
											email: showViewTeacherProfile.email || '',
																		phone: showViewTeacherProfile.phone || '',
																		specialization: showViewTeacherProfile.teachers?.specialization || '',
																		image_url: showViewTeacherProfile.teachers?.image_url || '',
																		password: ''
																	});
																	setTeacherImagePreview(showViewTeacherProfile.teachers?.image_url || '');
																	setTeacherImage(null);
									}}
									className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition"
								>
									✏️ Edit Profile
								</button>
								<button
									onClick={() => setShowViewTeacherProfile(null)}
									className="flex-1 bg-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* View Doctor Profile Modal */}
			{showViewDoctorProfile && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Doctor Profile</h3>
							<button
								onClick={() => setShowViewDoctorProfile(null)}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>

						<div className="space-y-6">
							{/* Profile Image */}
							<div className="flex justify-center">
								<div className="relative">
									{showViewDoctorProfile.image_url ? (
										<div className="w-48 h-48 rounded-full overflow-hidden shadow-xl border-4 border-white">
											<img 
												src={showViewDoctorProfile.image_url} 
												alt={showViewDoctorProfile.name} 
												className="w-full h-full object-cover" 
											/>
										</div>
									) : (
										<div className="w-48 h-48 rounded-full bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-7xl shadow-xl border-4 border-white">
											👨‍⚕️
										</div>
									)}
									<div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white">
										<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
										</svg>
									</div>
								</div>
							</div>

							{/* Doctor Information */}
							<div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 space-y-4">
								<div className="text-center mb-4">
									<h2 className="text-3xl font-bold text-gray-900 mb-2">{showViewDoctorProfile.name}</h2>
									<span className="bg-gradient-to-r from-green-400 to-green-600 text-white text-sm px-3 py-1 rounded-full font-semibold inline-block">
										✓ VERIFIED
									</span>
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Specialization</label>
										<p className="text-lg font-semibold text-brand">{showViewDoctorProfile.specialization || 'N/A'}</p>
									</div>

									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Degrees</label>
										<p className="text-lg font-semibold text-gray-900">{showViewDoctorProfile.degrees || 'N/A'}</p>
									</div>

									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Discount Rate</label>
										<p className="text-2xl font-bold text-green-600">{showViewDoctorProfile.discount_rate || 50}%</p>
									</div>

									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Doctor ID</label>
										<p className="text-sm font-mono text-gray-600 break-all">{showViewDoctorProfile.id}</p>
									</div>
								</div>

								{showViewDoctorProfile.consultation_fee && (
									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Consultation Fee</label>
										<p className="text-xl font-bold text-gray-900">PKR {Number(showViewDoctorProfile.consultation_fee).toLocaleString()}</p>
									</div>
								)}

								{showViewDoctorProfile.timing && (
									<div className="bg-white rounded-lg p-4 shadow-sm">
										<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Timing</label>
										<p className="text-sm text-gray-700">{showViewDoctorProfile.timing}</p>
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={() => {
										setShowViewDoctorProfile(null);
										setShowEditDoctor(showViewDoctorProfile);
										setDoctorForm({
											name: showViewDoctorProfile.name || '',
											specialization: showViewDoctorProfile.specialization || '',
											degrees: showViewDoctorProfile.degrees || '',
											discount_rate: showViewDoctorProfile.discount_rate || 50,
											image_url: showViewDoctorProfile.image_url || '',
											consultation_fee: showViewDoctorProfile.consultation_fee || '',
											timing: showViewDoctorProfile.timing || ''
										});
										setDoctorImagePreview(showViewDoctorProfile.image_url || '');
										setDoctorImage(null);
									}}
									className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition"
								>
									✏️ Edit Profile
								</button>
								<button
									onClick={() => setShowViewDoctorProfile(null)}
									className="flex-1 bg-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Add Course Modal */}
			{showAddCourse && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Course</h3>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium mb-1">Title</label>
								<input 
									className="w-full border p-2 rounded"
									value={courseForm.title}
									onChange={e => setCourseForm({...courseForm, title: e.target.value})}
									placeholder="Basic Nursing Care"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Description</label>
								<textarea 
									className="w-full border p-2 rounded"
									rows="3"
									value={courseForm.description}
									onChange={e => setCourseForm({...courseForm, description: e.target.value})}
									placeholder="Course description..."
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Duration</label>
								<input 
									className="w-full border p-2 rounded"
									value={courseForm.duration}
									onChange={e => setCourseForm({...courseForm, duration: e.target.value})}
									placeholder="3 months"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Discount Rate (%)</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={courseForm.discount_rate}
									onChange={e => setCourseForm({...courseForm, discount_rate: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Assign Teacher</label>
								<select
									className="w-full border p-2 rounded"
									value={courseForm.trainer_id || ''}
									onChange={e => setCourseForm({...courseForm, trainer_id: e.target.value})}
								>
									<option value="">-- No Teacher Assigned --</option>
									{teachers.map(teacher => (
										<option key={teacher.id} value={teacher.id}>
											{teacher.name} {teacher.email ? `(${teacher.email})` : ''}
										</option>
									))}
								</select>
								<p className="text-xs text-gray-500 mt-1">
									Select a teacher to assign this course to. Leave empty to create an unassigned course.
								</p>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={addCourse}
								className="flex-1 bg-brand text-white px-4 py-2 rounded"
							>
								Add Course
							</button>
							<button 
								onClick={() => setShowAddCourse(false)}
								className="flex-1 bg-gray-200 px-4 py-2 rounded"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Course Modal */}
			{showEditCourse && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Course</h3>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium mb-1">Title</label>
								<input 
									className="w-full border p-2 rounded"
									defaultValue={showEditCourse.title}
									onChange={e => setCourseForm({...courseForm, title: e.target.value})}
									placeholder="Basic Nursing Care"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Description</label>
								<textarea 
									className="w-full border p-2 rounded"
									rows="3"
									defaultValue={showEditCourse.description}
									onChange={e => setCourseForm({...courseForm, description: e.target.value})}
									placeholder="Course description..."
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Duration</label>
								<input 
									className="w-full border p-2 rounded"
									defaultValue={showEditCourse.duration}
									onChange={e => setCourseForm({...courseForm, duration: e.target.value})}
									placeholder="3 months"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Discount Rate (%)</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									defaultValue={showEditCourse.discount_rate}
									onChange={e => setCourseForm({...courseForm, discount_rate: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Assign Teacher</label>
								<select
									className="w-full border p-2 rounded"
									value={courseForm.trainer_id !== undefined ? (courseForm.trainer_id || '') : (showEditCourse.trainer_id || '')}
									onChange={e => setCourseForm({...courseForm, trainer_id: e.target.value})}
								>
									<option value="">-- No Teacher Assigned --</option>
									{teachers.map(teacher => (
										<option key={teacher.id} value={teacher.id}>
											{teacher.name} {teacher.email ? `(${teacher.email})` : ''}
										</option>
									))}
								</select>
								<p className="text-xs text-gray-500 mt-1">
									{showEditCourse.trainer_id 
										? `Currently assigned to: ${teachers.find(t => t.id === showEditCourse.trainer_id)?.name || 'Unknown'}`
										: 'No teacher currently assigned. Select a teacher to assign this course.'}
								</p>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={async () => {
									// Merge form data with existing course data
									const updates = {
										title: courseForm.title || showEditCourse.title,
										description: courseForm.description !== undefined ? courseForm.description : showEditCourse.description,
										duration: courseForm.duration || showEditCourse.duration,
										discount_rate: courseForm.discount_rate !== undefined ? courseForm.discount_rate : showEditCourse.discount_rate,
										trainer_id: courseForm.trainer_id !== undefined ? (courseForm.trainer_id || null) : showEditCourse.trainer_id
									};
									await updateCourse(showEditCourse.id, updates);
									setShowEditCourse(null);
									setCourseForm({ title: '', description: '', duration: '', discount_rate: 70, trainer_id: '' });
								}}
								className="flex-1 bg-brand text-white px-4 py-2 rounded"
							>
								Update Course
							</button>
							<button 
								onClick={() => {
									setShowEditCourse(null);
									setCourseForm({ title: '', description: '', duration: '', discount_rate: 70, trainer_id: '' });
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add Medicine Modal */}
			{showAddMedicine && !showEditMedicine && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Medicine</h3>
						<div className="space-y-3">
							{/* Image Upload */}
							<div>
								<label className="block text-sm font-medium mb-1">Medicine Image</label>
								<div className="flex items-center gap-4">
									<div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
										{medicineImagePreview ? (
											<img src={medicineImagePreview} alt="Preview" className="w-full h-full object-cover" />
										) : (
											<div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
												📷
											</div>
										)}
									</div>
									<div className="flex-1">
										<button
											type="button"
											onClick={() => medicineImageInputRef.current?.click()}
											disabled={uploadingMedicineImage}
											className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Choose File
										</button>
										<input
											ref={medicineImageInputRef}
											type="file"
											accept="image/*"
											onChange={handleMedicineImageChange}
											className="hidden"
											disabled={uploadingMedicineImage}
										/>
										{medicineImagePreview && (
											<p className="text-xs text-gray-600 mt-2">✓ Image selected</p>
										)}
										{uploadingMedicineImage && (
											<p className="text-xs text-gray-500 mt-1">Uploading image...</p>
										)}
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Name</label>
								<input 
									className="w-full border p-2 rounded"
									value={medicineForm.name}
									onChange={e => setMedicineForm({...medicineForm, name: e.target.value})}
									placeholder="Paracetamol 500mg"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Category</label>
								<input 
									className="w-full border p-2 rounded"
									value={medicineForm.category}
									onChange={e => setMedicineForm({...medicineForm, category: e.target.value})}
									placeholder="Pain Relief & Analgesics"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Description</label>
								<textarea 
									className="w-full border p-2 rounded"
									rows="2"
									value={medicineForm.description}
									onChange={e => setMedicineForm({...medicineForm, description: e.target.value})}
									placeholder="Medicine description..."
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Price (PKR)</label>
								<input 
									type="number"
									step="0.01"
									className="w-full border p-2 rounded"
									value={medicineForm.price}
									onChange={e => setMedicineForm({...medicineForm, price: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Discount (%)</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={medicineForm.discount_percentage}
									onChange={e => setMedicineForm({...medicineForm, discount_percentage: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Stock Quantity</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={medicineForm.stock_quantity}
									onChange={e => setMedicineForm({...medicineForm, stock_quantity: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Supplier Info</label>
								<input 
									className="w-full border p-2 rounded"
									value={medicineForm.supplier_info}
									onChange={e => setMedicineForm({...medicineForm, supplier_info: e.target.value})}
									placeholder="PharmaCo"
								/>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={addMedicine}
								disabled={uploadingMedicineImage}
								className="flex-1 bg-brand text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{uploadingMedicineImage ? 'Uploading...' : 'Add Medicine'}
							</button>
							<button 
								onClick={() => {
									setShowAddMedicine(false);
									resetMedicineForm();
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Medicine Modal */}
			{showEditMedicine && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Medicine</h3>
						<div className="space-y-3">
							{/* Image Upload/Preview */}
							<div>
								<label className="block text-sm font-medium mb-1">Medicine Image</label>
								<div className="flex items-center gap-4">
									<div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
										{medicineImagePreview ? (
											<img src={medicineImagePreview} alt="Preview" className="w-full h-full object-cover" />
										) : showEditMedicine.image_url ? (
											<img 
												src={(() => {
													const url = showEditMedicine.image_url;
													const urlHash = url.split('/').pop() || '';
													const cacheBuster = `v=${Date.now()}&h=${urlHash.substring(0, 8)}`;
													return url.includes('?') ? `${url.split('?')[0]}?${cacheBuster}` : `${url}?${cacheBuster}`;
												})()} 
												alt="Current" 
												className="w-full h-full object-cover"
												key={`edit-preview-${showEditMedicine.medicine_id}-${showEditMedicine.image_url}`}
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
												📷
											</div>
										)}
									</div>
									<div className="flex-1">
										<input
											type="file"
											accept="image/*"
											onChange={handleMedicineImageChange}
											className="block w-full text-sm text-gray-500
												file:mr-4 file:py-2 file:px-4
												file:rounded file:border-0
												file:text-sm file:font-semibold
												file:bg-purple-600 file:text-white
												hover:file:bg-purple-700"
											disabled={uploadingMedicineImage}
										/>
										<p className="text-xs text-gray-500 mt-1">
											{showEditMedicine.image_url ? 'Select new image to replace' : 'Upload image'}
										</p>
										{uploadingMedicineImage && (
											<p className="text-xs text-gray-500 mt-1">Uploading image...</p>
										)}
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Price (PKR)</label>
								<input 
									type="number"
									step="0.01"
									className="w-full border p-2 rounded"
									value={medicineForm.price ?? ''}
									onChange={e => setMedicineForm({...medicineForm, price: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Stock Quantity</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={medicineForm.stock_quantity ?? ''}
									onChange={e => setMedicineForm({...medicineForm, stock_quantity: Number(e.target.value)})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Discount (%)</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={medicineForm.discount_percentage ?? ''}
									onChange={e => setMedicineForm({...medicineForm, discount_percentage: Number(e.target.value)})}
								/>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={async () => {
									await updateMedicine(showEditMedicine.medicine_id, medicineForm);
									setShowEditMedicine(null);
									resetMedicineForm();
								}}
								disabled={uploadingMedicineImage}
								className="flex-1 bg-brand text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{uploadingMedicineImage ? 'Uploading...' : 'Update Medicine'}
							</button>
							<button 
								onClick={() => {
									setShowEditMedicine(null);
									resetMedicineForm();
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit User Role Modal */}
			{showEditUserRole && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Change User Role</h3>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium mb-1">Select New Role</label>
								<select 
									className="w-full border p-2 rounded text-gray-900"
									value={newRole}
									onChange={e => setNewRole(e.target.value)}
								>
									<option value="patient">Patient</option>
									<option value="donor">Donor</option>
									<option value="admin">Admin</option>
									<option value="lab">Lab</option>
									<option value="student">Student</option>
									<option value="teacher">Teacher</option>
									<option value="pharmacy">Pharmacy Staff</option>
								</select>
							</div>
							<p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
								⚠️ Changing a user's role will affect their dashboard access and permissions.
							</p>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={async () => await updateUserRole(showEditUserRole, newRole)}
								className="flex-1 bg-brand text-white px-4 py-2 rounded"
							>
								Update Role
							</button>
							<button 
								onClick={() => {
									setShowEditUserRole(null);
									setNewRole('');
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Donor Details Modal */}
			{showDonorDetails && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Donor Details & Receipt</h3>
							<button
								onClick={() => setShowDonorDetails(null)}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>

						{/* Receipt Content - Printable */}
						<div id="donor-receipt" className="space-y-6">
							{/* Foundation Header */}
							<div className="text-center border-b-2 border-gray-300 pb-4">
								<h1 className="text-3xl font-bold text-brand mb-2">Dr. Sanaullah Welfare Foundation</h1>
								<p className="text-gray-600">Official Donation Receipt</p>
							</div>

							{/* Donation Info */}
							<div className="grid md:grid-cols-2 gap-6">
								<div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
									<p className="text-xs text-gray-600 mb-1">Receipt Number</p>
									<p className="font-bold text-gray-900 font-mono">{showDonorDetails.id}</p>
								</div>
								<div className="bg-green-50 rounded-xl p-4 border border-green-200">
									<p className="text-xs text-gray-600 mb-1">Date</p>
									<p className="font-bold text-gray-900">
										{new Date(showDonorDetails.created_at).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</p>
								</div>
							</div>

							{/* Donor Information */}
							<div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
								<h4 className="font-bold text-lg text-gray-900 mb-4">Donor Information</h4>
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-gray-600 mb-1">Full Name</p>
										<p className="font-semibold text-gray-900">{showDonorDetails.users?.name || 'N/A'}</p>
									</div>
									<div>
										<p className="text-xs text-gray-600 mb-1">Email Address</p>
										<p className="font-semibold text-gray-900">{showDonorDetails.users?.email || 'N/A'}</p>
									</div>
									<div>
										<p className="text-xs text-gray-600 mb-1">Donor Type</p>
										<p className="font-semibold text-gray-900 capitalize">
											{showDonorDetails.donor_type || 'N/A'}
										</p>
									</div>
									{showDonorDetails.cnic && (
										<div>
											<p className="text-xs text-gray-600 mb-1">CNIC Number</p>
											<p className="font-semibold text-gray-900">{showDonorDetails.cnic}</p>
										</div>
									)}
									{showDonorDetails.passport_number && (
										<div>
											<p className="text-xs text-gray-600 mb-1">Passport Number</p>
											<p className="font-semibold text-gray-900">{showDonorDetails.passport_number}</p>
										</div>
									)}
								</div>
							</div>

							{/* Donation Details */}
							<div className="border-2 border-brand rounded-xl p-6 bg-gradient-to-br from-brand/5 to-green-50">
								<h4 className="font-bold text-lg text-gray-900 mb-4">Donation Details</h4>
								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-gray-700">Purpose</span>
										<span className="font-bold text-gray-900 capitalize">{showDonorDetails.purpose || 'General Donation'}</span>
									</div>
									<div className="flex justify-between items-center border-t border-gray-300 pt-3">
										<span className="text-xl font-bold text-gray-900">Total Amount</span>
										<span className="text-3xl font-black text-brand">PKR {Number(showDonorDetails.amount).toLocaleString()}</span>
									</div>
								</div>
							</div>

							{/* Thank You Message */}
							<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 text-center">
								<p className="text-lg font-semibold text-gray-900 mb-2">🎉 Thank You!</p>
								<p className="text-sm text-gray-700">
									Your generous donation helps us provide essential healthcare and education services to those in need.
								</p>
							</div>

							{/* Footer */}
							<div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-4 space-y-2">
								<p><strong>Dr. Sanaullah Welfare Foundation</strong></p>
								<p>Registered NGO | Tax-Exempt Status | Serving Pakistan Since [Year]</p>
								<p className="text-gray-500">This is an official tax-deductible receipt for your records.</p>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 mt-8 border-t border-gray-200 pt-6">
							<button
								onClick={() => {
									const printContent = document.getElementById('donor-receipt').innerHTML;
									const originalContent = document.body.innerHTML;
									document.body.innerHTML = printContent;
									window.print();
									document.body.innerHTML = originalContent;
									window.location.reload();
								}}
								className="flex-1 bg-gradient-to-r from-brand to-brand-dark text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
							>
								🖨️ Print Receipt
							</button>
							<button
								onClick={() => setShowDonorDetails(null)}
								className="flex-1 bg-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{showAddStudent && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Add New Student</h3>
							<button
								onClick={() => {
									setShowAddStudent(false);
									setEditingStudent(null);
									setStudentForm({
										name: '',
										email: '',
										phone: '',
										course_id: '',
										roll_number: '',
										grade: '',
										section: '',
										admission_date: '',
										password: '',
										status: 'active'
									});
								}}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium mb-1">Name *</label>
								<input
									className="w-full border p-2 rounded"
									value={studentForm.name}
									onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
									placeholder="Student Name"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Email</label>
								<input
									type="email"
									className="w-full border p-2 rounded"
									value={studentForm.email}
									onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
									placeholder="student@example.com"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Phone</label>
								<input
									type="tel"
									className="w-full border p-2 rounded"
									value={studentForm.phone}
									onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
									placeholder="+92 3xx xxxxxxx"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Password *</label>
								<input
									type="password"
									className="w-full border p-2 rounded"
									value={studentForm.password}
									onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
									placeholder="Enter password"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Course</label>
								<select
									className="w-full border p-2 rounded"
									value={studentForm.course_id}
									onChange={(e) => setStudentForm({ ...studentForm, course_id: e.target.value })}
								>
									<option value="">Select a course</option>
									{courses.map((c) => (
										<option key={c.id} value={c.id}>
											{c.title}
										</option>
									))}
								</select>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium mb-1">Roll Number</label>
									<input
										className="w-full border p-2 rounded"
										value={studentForm.roll_number}
										onChange={(e) => setStudentForm({ ...studentForm, roll_number: e.target.value })}
										placeholder="e.g. 12"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Status</label>
									<select
										className="w-full border p-2 rounded"
										value={studentForm.status}
										onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
									>
										<option value="active">Active</option>
										<option value="inactive">Inactive</option>
									</select>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Admission Date</label>
								<input
									type="date"
									className="w-full border p-2 rounded"
									value={studentForm.admission_date}
									onChange={(e) => setStudentForm({ ...studentForm, admission_date: e.target.value })}
								/>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button
								onClick={async () => {
									await handleAddStudent();
								}}
								className="flex-1 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
							>
								Save Student
							</button>
							<button
								onClick={() => {
									setShowAddStudent(false);
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add Patient Modal */}
			{showAddPatient && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Patient</h3>
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">Full Name</label>
								<input 
									className="w-full border p-2 rounded"
									value={patientForm.name}
									onChange={e => setPatientForm({...patientForm, name: e.target.value})}
									placeholder="Patient Name"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Email</label>
								<input 
									className="w-full border p-2 rounded"
									value={patientForm.email}
									onChange={e => setPatientForm({...patientForm, email: e.target.value})}
									type="email"
									placeholder="patient@example.com"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Password</label>
								<input 
									className="w-full border p-2 rounded"
									value={patientForm.password}
									onChange={e => setPatientForm({...patientForm, password: e.target.value})}
									type="password"
									placeholder="Create password"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Age</label>
								<input 
									className="w-full border p-2 rounded"
									value={patientForm.age}
									onChange={e => setPatientForm({...patientForm, age: e.target.value})}
									type="number"
									placeholder="25"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Gender</label>
								<select
									className="w-full border p-2 rounded"
									value={patientForm.gender}
									onChange={e => setPatientForm({...patientForm, gender: e.target.value})}
								>
									<option value="">Select</option>
									<option value="male">Male</option>
									<option value="female">Female</option>
									<option value="other">Other</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">CNIC</label>
								<input 
									className="w-full border p-2 rounded"
									value={patientForm.cnic}
									onChange={e => setPatientForm({...patientForm, cnic: e.target.value})}
									placeholder="12345-6789012-3"
								/>
							</div>
							<div className="md:col-span-2">
								<label className="block text-sm font-medium mb-1">Medical History</label>
								<textarea
									className="w-full border p-2 rounded"
									value={patientForm.history}
									onChange={e => setPatientForm({...patientForm, history: e.target.value})}
									rows="3"
									placeholder="Any medical conditions, allergies, etc."
								/>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button onClick={addPatient} className="flex-1 bg-brand text-white px-4 py-2 rounded">Add Patient</button>
							<button onClick={() => setShowAddPatient(false)} className="flex-1 bg-gray-200 px-4 py-2 rounded">Cancel</button>
						</div>
					</div>
				</div>
			)}

			{/* Patient History Modal */}
			{showPatientHistory && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Patient Medical History</h3>
							<button
								onClick={() => {
									setShowPatientHistory(null);
									setPatientHistoryData({ labReports: [], appointments: [] });
								}}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>

						{/* Printable Receipt Content */}
						<div id="patient-receipt" className="space-y-6">
							{/* Foundation Header */}
							<div className="text-center border-b-2 border-gray-300 pb-4">
								<img src="/last-logo.png" alt="DSWF Logo" className="h-20 mx-auto mb-2" />
								<h1 className="text-3xl font-bold text-brand mb-2">Dr. Sanaullah Welfare Foundation</h1>
								<p className="text-gray-600">Official Patient Medical Record</p>
							</div>

							{/* Patient Info */}
							<div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
								<h4 className="font-bold text-lg text-gray-900 mb-4">Patient Information</h4>
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-gray-600 mb-1">Full Name</p>
										<p className="font-semibold text-gray-900 text-lg">{showPatientHistory.users?.name || 'N/A'}</p>
									</div>
									<div>
										<p className="text-xs text-gray-600 mb-1">Email Address</p>
										<p className="font-semibold text-gray-900">{showPatientHistory.users?.email || 'N/A'}</p>
									</div>
									<div>
										<p className="text-xs text-gray-600 mb-1">Age</p>
										<p className="font-semibold text-gray-900">{showPatientHistory.age || 'N/A'} years</p>
									</div>
									<div>
										<p className="text-xs text-gray-600 mb-1">Gender</p>
										<p className="font-semibold text-gray-900 capitalize">{showPatientHistory.gender || 'N/A'}</p>
									</div>
									<div className="md:col-span-2">
										<p className="text-xs text-gray-600 mb-1">CNIC Number</p>
										<p className="font-semibold text-gray-900 font-mono">{showPatientHistory.cnic || 'N/A'}</p>
									</div>
									<div className="md:col-span-2">
										<p className="text-xs text-gray-600 mb-1">Medical History</p>
										<p className="font-semibold text-gray-900">{showPatientHistory.history || 'No medical history recorded'}</p>
									</div>
								</div>
							</div>

							{/* Lab Reports Section */}
							<div className="mb-6">
								<h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
									<span className="text-2xl">🧪</span>
									Lab Reports ({patientHistoryData.labReports.length})
								</h4>
								{loadingHistory ? (
									<div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
										<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
										<p className="text-sm text-gray-600 mt-2">Loading lab reports...</p>
									</div>
								) : patientHistoryData.labReports.length === 0 ? (
									<div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
										<p className="text-sm text-gray-600">No lab reports available for this patient.</p>
									</div>
								) : (
									<div className="space-y-3">
										{patientHistoryData.labReports.map(report => (
											<div key={report.id} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200 flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">
														🧪
													</div>
													<div>
														<p className="font-bold text-gray-900">Report #{report.id.substring(0, 12)}...</p>
														<p className="text-sm text-gray-600">
															{new Date(report.report_date).toLocaleDateString('en-US', {
																year: 'numeric',
																month: 'long',
																day: 'numeric'
															})}
														</p>
														{report.remarks && (
															<p className="text-xs text-gray-500 mt-1">{report.remarks}</p>
														)}
													</div>
												</div>
												<button
													onClick={async () => {
														const res = await apiRequest(`/api/lab/reports/${report.id}/download`);
														window.open(res.url, '_blank');
													}}
													className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
													disabled={!report.file_url}
												>
													📥 Download
												</button>
											</div>
										))}
									</div>
								)}
							</div>


							{/* Appointments/Doctor Visits Section */}
							<div className="mb-6">
								<h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
									<span className="text-2xl">👨‍⚕️</span>
									Doctor Visits & Appointments ({patientHistoryData.appointments.length})
								</h4>
								{loadingHistory ? (
									<div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
										<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
										<p className="text-sm text-gray-600 mt-2">Loading appointments...</p>
									</div>
								) : patientHistoryData.appointments.length === 0 ? (
									<div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
										<p className="text-sm text-gray-600">No appointments or doctor visits recorded for this patient.</p>
									</div>
								) : (
									<div className="space-y-3">
										{patientHistoryData.appointments.map(appointment => (
											<div key={appointment.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
												<div className="flex items-start justify-between">
													<div className="flex items-start gap-3">
														<div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
															👨‍⚕️
														</div>
														<div className="flex-1">
															<p className="font-bold text-gray-900">
																{appointment.doctors?.name || 'Unknown Doctor'}
															</p>
															<p className="text-sm text-gray-600 mt-1">
																{appointment.doctors?.specialization && (
																	<span className="text-brand font-semibold">{appointment.doctors.specialization}</span>
																)}
																{appointment.doctors?.degrees && ` - ${appointment.doctors.degrees}`}
															</p>
															<div className="mt-2 space-y-1">
																<p className="text-sm text-gray-700">
																	📅 <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
																		year: 'numeric',
																		month: 'long',
																		day: 'numeric'
																	})}
																</p>
																<p className="text-sm text-gray-700">
																	🕐 <strong>Time:</strong> {appointment.appointment_time}
																</p>
																{appointment.reason && (
																	<p className="text-sm text-gray-700">
																		📝 <strong>Reason:</strong> {appointment.reason}
																	</p>
																)}
																<p className="text-sm">
																	<span className={`px-2 py-1 rounded-full text-xs font-semibold ${
																		appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
																		appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
																		appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
																		'bg-red-100 text-red-800'
																	}`}>
																		{appointment.status?.toUpperCase() || 'PENDING'}
																	</span>
																</p>
																{appointment.final_fee && (
																	<p className="text-sm text-gray-700 mt-1">
																		💰 <strong>Fee:</strong> PKR {Number(appointment.final_fee).toLocaleString()}
																		{appointment.discount_applied && ` (${appointment.discount_applied}% discount applied)`}
																	</p>
																)}
															</div>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Footer */}
							<div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-4 space-y-2">
								<p><strong>Dr. Sanaullah Welfare Foundation</strong></p>
								<p>Registered NGO | Serving Pakistan Since [Year]</p>
								<p className="text-gray-500">This is an official medical record for your records.</p>
							</div>
						</div>

						<div className="flex gap-3 mt-8 border-t border-gray-200 pt-6">
							<button
								onClick={() => {
									const printContent = document.getElementById('patient-receipt').innerHTML;
									const originalContent = document.body.innerHTML;
									document.body.innerHTML = printContent;
									window.print();
									document.body.innerHTML = originalContent;
									window.location.reload();
								}}
								className="flex-1 bg-gradient-to-r from-brand to-brand-dark text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
							>
								🖨️ Print Medical Record
							</button>
							<button
								onClick={() => {
									setShowPatientHistory(null);
									setPatientHistoryData({ labReports: [], appointments: [] });
								}}
								className="flex-1 bg-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Book Appointment Modal */}
			{showBookAppointment && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Book Appointment</h3>
							<button
								onClick={() => {
									setShowBookAppointment(null);
									setAppointmentForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
									setDoctorSearchQuery('');
								}}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>
						
						<div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
							<p className="text-sm text-gray-700">
								<strong>Patient:</strong> {showBookAppointment.users?.name || 'N/A'}
							</p>
							<p className="text-sm text-gray-700">
								<strong>Email:</strong> {showBookAppointment.users?.email || 'N/A'}
							</p>
						</div>

						<form onSubmit={handleBookAppointmentForPatient} className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Search & Select Doctor *</label>
								
								{/* Doctor Search Input */}
								<div className="relative mb-2">
									<input
										type="text"
										value={doctorSearchQuery}
										onChange={e => setDoctorSearchQuery(e.target.value)}
										className="w-full border-2 border-gray-200 p-3 pl-10 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20"
										placeholder="Search doctors by name, specialization, or degrees..."
										disabled={bookingLoading}
									/>
									<span className="absolute left-3 top-3.5 text-gray-400 text-lg">🔍</span>
									{doctorSearchQuery && (
										<button
											type="button"
											onClick={() => setDoctorSearchQuery('')}
											className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 text-xl"
										>
											×
										</button>
									)}
								</div>
								
								{/* Filtered Doctors Count */}
								{doctorSearchQuery && (
									<p className="text-xs text-gray-600 mb-2">
										{doctors.filter(doctor => {
											const query = doctorSearchQuery.toLowerCase();
											const name = (doctor.name || '').toLowerCase();
											const specialization = (doctor.specialization || '').toLowerCase();
											const degrees = (doctor.degrees || '').toLowerCase();
											return name.includes(query) || specialization.includes(query) || degrees.includes(query);
										}).length} doctor(s) found
									</p>
								)}
								
								{/* Doctor Dropdown */}
								<select
									className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20"
									value={appointmentForm.doctor_id}
									onChange={e => setAppointmentForm({...appointmentForm, doctor_id: e.target.value})}
									required
									disabled={bookingLoading}
								>
									<option value="">Choose a doctor...</option>
									{doctors.filter(doctor => {
										if (!doctorSearchQuery) return true;
										const query = doctorSearchQuery.toLowerCase();
										const name = (doctor.name || '').toLowerCase();
										const specialization = (doctor.specialization || '').toLowerCase();
										const degrees = (doctor.degrees || '').toLowerCase();
										return name.includes(query) || specialization.includes(query) || degrees.includes(query);
									}).map(doctor => (
										<option key={doctor.id} value={doctor.id}>
											Dr. {doctor.name} - {doctor.specialization}
											{doctor.degrees && ` (${doctor.degrees})`}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Appointment Date *</label>
								<input
									type="date"
									className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20"
									value={appointmentForm.appointment_date}
									onChange={e => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
									required
									min={new Date().toISOString().split('T')[0]}
									disabled={bookingLoading}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Appointment Time *</label>
								<input
									type="time"
									className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20"
									value={appointmentForm.appointment_time}
									onChange={e => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
									required
									disabled={bookingLoading}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Reason for Visit</label>
								<textarea
									className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
									rows="3"
									value={appointmentForm.reason}
									onChange={e => setAppointmentForm({...appointmentForm, reason: e.target.value})}
									placeholder="Brief description of the reason for appointment..."
									disabled={bookingLoading}
								/>
							</div>

							<div className="flex gap-3 mt-6">
								<button
									type="submit"
									disabled={bookingLoading}
									className="flex-1 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-50"
								>
									{bookingLoading ? 'Booking...' : 'Book Appointment'}
								</button>
								<button
									type="button"
									onClick={() => {
										setShowBookAppointment(null);
										setAppointmentForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
										setDoctorSearchQuery('');
									}}
									className="flex-1 bg-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
									disabled={bookingLoading}
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Add Lab Modal */}
			{showAddLab && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Register New Laboratory</h3>
						<p className="text-sm text-gray-600 mb-4">Register a new laboratory. The registration will require admin approval.</p>
						<div className="space-y-3">
							<div className="border-t pt-3">
								<h4 className="font-semibold text-gray-700 mb-2">Laboratory Information</h4>
								<div>
									<label className="block text-sm font-medium mb-1">Lab Name <span className="text-red-500">*</span></label>
									<input 
										className="w-full border p-2 rounded"
										value={labForm.lab_name}
										onChange={e => setLabForm({...labForm, lab_name: e.target.value})}
										placeholder="City Diagnostic Lab"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Location</label>
									<input 
										className="w-full border p-2 rounded"
										value={labForm.location}
										onChange={e => setLabForm({...labForm, location: e.target.value})}
										placeholder="Karachi, Pakistan"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Contact Info</label>
									<input 
										className="w-full border p-2 rounded"
										value={labForm.contact_info}
										onChange={e => setLabForm({...labForm, contact_info: e.target.value})}
										placeholder="Tel: 021-12345678"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Services (comma-separated)</label>
									<input 
										className="w-full border p-2 rounded"
										value={labForm.services?.join(', ') || ''}
										onChange={e => setLabForm({...labForm, services: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
										placeholder="Blood Tests, X-Ray, Ultrasound, ECG"
									/>
								</div>
								<div>
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={labForm.home_services || false}
											onChange={e => setLabForm({...labForm, home_services: e.target.checked})}
											className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
										/>
										<span className="text-sm font-medium">Provide Home Services</span>
									</label>
									<p className="text-xs text-gray-500 mt-1 ml-6">Check this if the lab offers home sample collection services</p>
								</div>
							</div>
							<div className="border-t pt-3">
								<h4 className="font-semibold text-gray-700 mb-2">Account Information</h4>
								<div>
									<label className="block text-sm font-medium mb-1">Contact Person Name <span className="text-red-500">*</span></label>
									<input 
										className="w-full border p-2 rounded"
										value={labForm.user_name}
										onChange={e => setLabForm({...labForm, user_name: e.target.value})}
										placeholder="Dr. John Smith"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
									<input 
										type="email"
										className="w-full border p-2 rounded"
										value={labForm.email}
										onChange={e => setLabForm({...labForm, email: e.target.value})}
										placeholder="lab@example.com"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Password <span className="text-red-500">*</span></label>
									<input 
										type="password"
										className="w-full border p-2 rounded"
										value={labForm.password}
										onChange={e => setLabForm({...labForm, password: e.target.value})}
										placeholder="Minimum 6 characters"
										required
										minLength={6}
									/>
								</div>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button onClick={addLab} className="flex-1 bg-brand text-white px-4 py-2 rounded">Register Laboratory</button>
							<button onClick={() => setShowAddLab(false)} className="flex-1 bg-gray-200 px-4 py-2 rounded">Cancel</button>
						</div>
					</div>
				</div>
			)}

			{/* Assign Lab Test Modal - Only show for admin users */}
			{showAssignLabTest && userRole === 'admin' && (
				<div 
					className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
					onClick={(e) => {
						if (e.target === e.currentTarget) {
							setShowAssignLabTest(false);
							setLabTestForm({ patient_name: '', lab_id: '', test_type: '', remarks: '' });
							setTestPaperFile(null);
							setTestPaperPreview('');
						}
					}}
				>
					<div 
						className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Assign Test to Lab</h3>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium mb-1">Select Lab</label>
								<select
									className="w-full border p-2 rounded"
									value={labTestForm.lab_id}
									onChange={e => setLabTestForm({...labTestForm, lab_id: e.target.value})}
								>
									<option value="">Choose Lab</option>
									{labs.map(lab => (
										<option key={lab.id} value={lab.id}>{lab.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Patient Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									className="w-full border p-2 rounded"
									placeholder="Enter patient name (e.g., Dr. Salman, Patient Salman, etc.)"
									value={labTestForm.patient_name}
									onChange={e => setLabTestForm({...labTestForm, patient_name: e.target.value})}
									required
								/>
								<p className="text-xs text-gray-500 mt-1">You can enter any patient name - registration is not required</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Test Type</label>
								<input 
									className="w-full border p-2 rounded"
									value={labTestForm.test_type}
									onChange={e => setLabTestForm({...labTestForm, test_type: e.target.value})}
									placeholder="Blood Test, X-Ray, etc."
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Remarks</label>
								<textarea 
									className="w-full border p-2 rounded"
									value={labTestForm.remarks}
									onChange={e => setLabTestForm({...labTestForm, remarks: e.target.value})}
									rows="3"
									placeholder="Any special instructions..."
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Upload Test Paper (Optional)</label>
								<div className="space-y-2">
									<button
										type="button"
										onClick={() => testPaperInputRef.current?.click()}
										disabled={uploadingTestPaper}
										className="inline-block bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Choose File
									</button>
									<input 
										ref={testPaperInputRef}
										type="file"
										accept="image/*,application/pdf"
										onChange={handleTestPaperChange}
										className="hidden"
										disabled={uploadingTestPaper}
									/>
									{testPaperFile && (
										<div className="mt-2">
											<p className="text-sm text-gray-600 mb-2">
												Selected: <strong>{testPaperFile.name}</strong> ({(testPaperFile.size / 1024).toFixed(2)} KB)
											</p>
											{testPaperPreview && (
												<div className="mt-2 border rounded p-2 bg-gray-50">
													<img src={testPaperPreview} alt="Test paper preview" className="max-w-full h-auto max-h-48 rounded" />
												</div>
											)}
											{!testPaperPreview && testPaperFile.type === 'application/pdf' && (
												<div className="mt-2 border rounded p-4 bg-gray-50 text-center">
													<span className="text-4xl">📄</span>
													<p className="text-sm text-gray-600 mt-1">PDF File Selected</p>
												</div>
											)}
											<button
												onClick={() => {
													setTestPaperFile(null);
													setTestPaperPreview('');
												}}
												className="mt-2 text-sm text-red-600 hover:text-red-800"
											>
												Remove File
											</button>
										</div>
									)}
									<p className="text-xs text-gray-500">Accepted formats: JPG, PNG, GIF, PDF (Max 20MB)</p>
								</div>
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={assignLabTest} 
								disabled={uploadingTestPaper}
								className="flex-1 bg-brand text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{uploadingTestPaper ? 'Assigning...' : 'Assign Test'}
							</button>
							<button 
								onClick={() => {
									setShowAssignLabTest(false);
									setLabTestForm({ patient_name: '', lab_id: '', test_type: '', remarks: '' });
									setTestPaperFile(null);
									setTestPaperPreview('');
								}} 
								className="flex-1 bg-gray-200 px-4 py-2 rounded"
								disabled={uploadingTestPaper}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add Donation Modal */}
			{showAddDonation && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Donation</h3>
						<div className="space-y-4">
							{/* Donor Information */}
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<h4 className="font-semibold text-gray-900 mb-3">Donor Information</h4>
								<div className="space-y-3">
									<div>
										<label className="block text-sm font-medium mb-1">Donor Name (Optional)</label>
										<input 
											type="text"
											className="w-full border p-2 rounded"
											value={donationForm.donor_name}
											onChange={e => setDonationForm({...donationForm, donor_name: e.target.value})}
											placeholder="Enter donor name"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Donor Email (Optional)</label>
										<input 
											type="email"
											className="w-full border p-2 rounded"
											value={donationForm.donor_email}
											onChange={e => setDonationForm({...donationForm, donor_email: e.target.value})}
											placeholder="donor@example.com"
										/>
										<p className="text-xs text-gray-500 mt-1">Leave blank for anonymous donation</p>
									</div>
								</div>
							</div>

							{/* Donation Details */}
							<div>
								<label className="block text-sm font-medium mb-1">Amount (PKR) *</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={donationForm.amount}
									onChange={e => setDonationForm({...donationForm, amount: e.target.value})}
									placeholder="Enter amount"
									required
									min="1"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Purpose *</label>
								<select
									className="w-full border p-2 rounded"
									value={donationForm.purpose}
									onChange={e => setDonationForm({...donationForm, purpose: e.target.value})}
									required
								>
									<option value="medical">🏥 Medical Support</option>
									<option value="education">🎓 Education & Training</option>
									<option value="orphan">👶 Orphan Support</option>
									<option value="general">❤️ General Fund</option>
								</select>
							</div>

							{/* Donor Type */}
							<div>
								<label className="block text-sm font-medium mb-1">Donor Type</label>
								<select
									className="w-full border p-2 rounded"
									value={donationForm.donor_type}
									onChange={e => setDonationForm({...donationForm, donor_type: e.target.value, cnic: '', passport_number: ''})}
								>
									<option value="local">Local (Pakistani)</option>
									<option value="international">International</option>
								</select>
							</div>

							{/* Conditional Fields Based on Donor Type */}
							{donationForm.donor_type === 'local' && (
								<div>
									<label className="block text-sm font-medium mb-1">CNIC (Optional)</label>
									<input 
										type="text"
										className="w-full border p-2 rounded"
										value={donationForm.cnic}
										onChange={e => setDonationForm({...donationForm, cnic: e.target.value})}
										placeholder="12345-6789012-3"
										pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
									/>
								</div>
							)}

							{donationForm.donor_type === 'international' && (
								<div>
									<label className="block text-sm font-medium mb-1">Passport Number (Optional)</label>
									<input 
										type="text"
										className="w-full border p-2 rounded"
										value={donationForm.passport_number}
										onChange={e => setDonationForm({...donationForm, passport_number: e.target.value})}
										placeholder="Enter passport number"
									/>
								</div>
							)}
						</div>

						<div className="flex gap-2 mt-6">
							<button 
								onClick={addDonation} 
								className="flex-1 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
							>
								Add Donation
							</button>
							<button 
								onClick={() => {
									setShowAddDonation(false);
									setDonationForm({ 
										amount: '', 
										purpose: 'medical', 
										donor_name: '', 
										donor_email: '', 
										donor_id: '',
										donor_type: 'local',
										cnic: '', 
										passport_number: '' 
									});
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Donation Modal */}
			{showEditDonation && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">Edit Donation</h3>
							<button
								onClick={() => {
									setShowEditDonation(null);
									setDonationForm({ 
										amount: '', 
										purpose: 'medical', 
										donor_name: '', 
										donor_email: '', 
										donor_id: '',
										donor_type: 'local',
										cnic: '', 
										passport_number: '' 
									});
								}}
								className="text-gray-500 hover:text-gray-900 text-2xl"
							>
								✕
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Amount (PKR) *</label>
								<input
									type="number"
									className="w-full border p-2 rounded"
									value={donationForm.amount}
									onChange={e => setDonationForm({...donationForm, amount: e.target.value})}
									placeholder="Enter amount"
									required
									min="1"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Purpose *</label>
								<select
									className="w-full border p-2 rounded"
									value={donationForm.purpose}
									onChange={e => setDonationForm({...donationForm, purpose: e.target.value})}
									required
								>
									<option value="medical">🏥 Medical Support</option>
									<option value="education">🎓 Education & Training</option>
									<option value="orphan">👶 Orphan Support</option>
									<option value="general">❤️ General Fund</option>
								</select>
							</div>

							{/* Donor Information */}
							<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
								<h4 className="font-semibold text-gray-900 mb-3">Donor Information</h4>
								<div className="space-y-3">
									<div>
										<label className="block text-sm font-medium mb-1">Donor Name (Optional)</label>
										<input
											type="text"
											className="w-full border p-2 rounded"
											value={donationForm.donor_name}
											onChange={e => setDonationForm({...donationForm, donor_name: e.target.value})}
											placeholder="Enter donor name"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Donor Email (Optional)</label>
										<input
											type="email"
											className="w-full border p-2 rounded"
											value={donationForm.donor_email}
											onChange={e => setDonationForm({...donationForm, donor_email: e.target.value})}
											placeholder="donor@example.com"
										/>
									</div>
								</div>
							</div>

							{/* Donor Type */}
							<div>
								<label className="block text-sm font-medium mb-1">Donor Type</label>
								<select
									className="w-full border p-2 rounded"
									value={donationForm.donor_type}
									onChange={e => setDonationForm({...donationForm, donor_type: e.target.value, cnic: '', passport_number: ''})}
								>
									<option value="local">Local (Pakistani)</option>
									<option value="international">International</option>
								</select>
							</div>

							{/* Conditional Fields Based on Donor Type */}
							{donationForm.donor_type === 'local' && (
								<div>
									<label className="block text-sm font-medium mb-1">CNIC Number (Optional)</label>
									<input
										type="text"
										className="w-full border p-2 rounded"
										value={donationForm.cnic}
										onChange={e => setDonationForm({...donationForm, cnic: e.target.value})}
										placeholder="12345-6789012-3"
										pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
									/>
									<p className="text-xs text-gray-500 mt-1">Format: 12345-6789012-3</p>
								</div>
							)}

							{donationForm.donor_type === 'international' && (
								<div>
									<label className="block text-sm font-medium mb-1">Passport Number (Optional)</label>
									<input
										type="text"
										className="w-full border p-2 rounded"
										value={donationForm.passport_number}
										onChange={e => setDonationForm({...donationForm, passport_number: e.target.value})}
										placeholder="Enter passport number"
									/>
								</div>
							)}
						</div>

						<div className="flex gap-2 mt-6">
							<button 
								onClick={updateDonation} 
								className="flex-1 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
							>
								Update Donation
							</button>
							<button 
								onClick={() => {
									setShowEditDonation(null);
									setDonationForm({ 
										amount: '', 
										purpose: 'medical', 
										donor_name: '', 
										donor_email: '', 
										donor_id: '',
										donor_type: 'local',
										cnic: '', 
										passport_number: '' 
									});
								}}
								className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add/Edit Specialty Modal */}
			{showAddSpecialty && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">
							{editingSpecialty ? 'Edit Specialty' : 'Add New Specialty'}
						</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Label *</label>
								<input 
									type="text"
									className="w-full border p-2 rounded"
									value={editingSpecialty ? editingSpecialty.label : specialtyForm.label}
									onChange={e => editingSpecialty 
										? setEditingSpecialty({...editingSpecialty, label: e.target.value})
										: setSpecialtyForm({...specialtyForm, label: e.target.value})}
									placeholder="e.g., Cardiologist"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Icon (Emoji) *</label>
								<div className="flex gap-2">
									<input 
										type="text"
										className="flex-1 border p-2 rounded"
										value={editingSpecialty ? editingSpecialty.icon : specialtyForm.icon}
										onChange={e => editingSpecialty 
											? setEditingSpecialty({...editingSpecialty, icon: e.target.value})
											: setSpecialtyForm({...specialtyForm, icon: e.target.value})}
										placeholder="e.g., ❤️"
										required
									/>
									<button
										type="button"
										onClick={() => setShowSpecialtyEmojiPicker(!showSpecialtyEmojiPicker)}
										className="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200"
									>
										😀 Pick
									</button>
								</div>
								{showSpecialtyEmojiPicker && (
								<div className="grid grid-cols-8 gap-2 mt-2 p-3 bg-gray-50 border rounded-lg max-h-48 overflow-y-auto">
									{['👋', '🤰', '🫁', '🫃', '🪥', '👂', '🦴', '🧠', '👶', '🩺', '👓', '🩹', '❤️', '🫀', '🫁', '🧬', '🩸', '💊', '💉', '🦷', '👁️', '👃', '👄', '👅', '👤', '👥', '🏥', '🚑', '⚕️', '🧪', '🔬', '📋', '📝', '💉', '🩻', '🔍', '📡', '💓', '💗', '💖', '💝', '✅', '❌', '⚠️', 'ℹ️', '⭐', '🌟', '✨'].map((emoji) => (
										<button
											key={emoji}
											type="button"
											onClick={() => {
												if (editingSpecialty) {
													setEditingSpecialty({...editingSpecialty, icon: emoji});
												} else {
													setSpecialtyForm({...specialtyForm, icon: emoji});
												}
												setShowSpecialtyEmojiPicker(false);
											}}
											className="text-2xl hover:bg-white hover:scale-125 transition rounded p-1"
											title={emoji}
										>
											{emoji}
										</button>
									))}
								</div>
								)}
								<p className="text-xs text-gray-500 mt-1">Click "Pick" to choose from common emojis or type your own</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Display Order</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={editingSpecialty ? editingSpecialty.display_order : specialtyForm.display_order}
									onChange={e => editingSpecialty 
										? setEditingSpecialty({...editingSpecialty, display_order: parseInt(e.target.value) || 0})
										: setSpecialtyForm({...specialtyForm, display_order: parseInt(e.target.value) || 0})}
									min="0"
								/>
							</div>
							<div>
								<label className="flex items-center gap-2">
									<input 
										type="checkbox"
										checked={editingSpecialty ? editingSpecialty.is_active : specialtyForm.is_active}
										onChange={e => editingSpecialty 
											? setEditingSpecialty({...editingSpecialty, is_active: e.target.checked})
											: setSpecialtyForm({...specialtyForm, is_active: e.target.checked})}
									/>
									<span className="text-sm font-medium">Active</span>
								</label>
							</div>
						</div>
						<div className="flex gap-2 mt-6">
							<button 
								onClick={() => editingSpecialty ? updateSpecialty(editingSpecialty.id) : addSpecialty()} 
								className="flex-1 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
							>
								{editingSpecialty ? 'Update' : 'Add'} Specialty
							</button>
							<button 
								onClick={() => {
									setShowAddSpecialty(false);
									setEditingSpecialty(null);
									setSpecialtyForm({ label: '', icon: '', display_order: 0, is_active: true });
									setShowSpecialtyEmojiPicker(false);
								}} 
								className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add/Edit Condition Modal */}
			{showAddCondition && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">
							{editingCondition ? 'Edit Condition' : 'Add New Condition'}
						</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Label *</label>
								<input 
									type="text"
									className="w-full border p-2 rounded"
									value={editingCondition ? editingCondition.label : conditionForm.label}
									onChange={e => editingCondition 
										? setEditingCondition({...editingCondition, label: e.target.value})
										: setConditionForm({...conditionForm, label: e.target.value})}
									placeholder="e.g., Fever"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Icon (Emoji) *</label>
								<div className="flex gap-2">
									<input 
										type="text"
										className="flex-1 border p-2 rounded"
										value={editingCondition ? editingCondition.icon : conditionForm.icon}
										onChange={e => editingCondition 
											? setEditingCondition({...editingCondition, icon: e.target.value})
											: setConditionForm({...conditionForm, icon: e.target.value})}
										placeholder="e.g., 🤒"
										required
									/>
									<button
										type="button"
										onClick={() => setShowConditionEmojiPicker(!showConditionEmojiPicker)}
										className="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200"
									>
										😀 Pick
									</button>
								</div>
								{showConditionEmojiPicker && (
								<div className="grid grid-cols-8 gap-2 mt-2 p-3 bg-gray-50 border rounded-lg max-h-48 overflow-y-auto">
									{['🤒', '🤕', '🤢', '🤮', '🤧', '😷', '🤯', '😰', '😨', '😱', '😵', '😵‍💫', '😴', '😪', '😫', '😩', '😤', '😠', '😡', '😢', '😭', '❤️', '🫀', '🫁', '🧠', '🩸', '💊', '💉', '🦷', '👁️', '👂', '👃', '👄', '👅', '🤰', '👶', '🧒', '👨', '👩', '👴', '👵', '🏥', '🚑', '⚕️', '🧪', '🔬', '💊', '🩻', '📋', '✅', '❌', '⚠️', '💡', '🔥', '❄️', '🌡️', '💧', '💨'].map((emoji) => (
										<button
											key={emoji}
											type="button"
											onClick={() => {
												if (editingCondition) {
													setEditingCondition({...editingCondition, icon: emoji});
												} else {
													setConditionForm({...conditionForm, icon: emoji});
												}
												setShowConditionEmojiPicker(false);
											}}
											className="text-2xl hover:bg-white hover:scale-125 transition rounded p-1"
											title={emoji}
										>
											{emoji}
										</button>
									))}
								</div>
								)}
								<p className="text-xs text-gray-500 mt-1">Click "Pick" to choose from common emojis or type your own</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Search Keyword *</label>
								<input 
									type="text"
									className="w-full border p-2 rounded"
									value={editingCondition ? editingCondition.search_keyword : conditionForm.search_keyword}
									onChange={e => editingCondition 
										? setEditingCondition({...editingCondition, search_keyword: e.target.value})
										: setConditionForm({...conditionForm, search_keyword: e.target.value})}
									placeholder="e.g., General Physician"
									required
								/>
								<p className="text-xs text-gray-500 mt-1">What to search for when clicked (e.g., specialty name)</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Display Order</label>
								<input 
									type="number"
									className="w-full border p-2 rounded"
									value={editingCondition ? editingCondition.display_order : conditionForm.display_order}
									onChange={e => editingCondition 
										? setEditingCondition({...editingCondition, display_order: parseInt(e.target.value) || 0})
										: setConditionForm({...conditionForm, display_order: parseInt(e.target.value) || 0})}
									min="0"
								/>
							</div>
							<div>
								<label className="flex items-center gap-2">
									<input 
										type="checkbox"
										checked={editingCondition ? editingCondition.is_active : conditionForm.is_active}
										onChange={e => editingCondition 
											? setEditingCondition({...editingCondition, is_active: e.target.checked})
											: setConditionForm({...conditionForm, is_active: e.target.checked})}
									/>
									<span className="text-sm font-medium">Active</span>
								</label>
							</div>
						</div>
						<div className="flex gap-2 mt-6">
							<button 
								onClick={() => editingCondition ? updateCondition(editingCondition.id) : addCondition()} 
								className="flex-1 bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
							>
								{editingCondition ? 'Update' : 'Add'} Condition
							</button>
							<button 
								onClick={() => {
									setShowAddCondition(false);
									setEditingCondition(null);
									setConditionForm({ label: '', icon: '', search_keyword: '', display_order: 0, is_active: true });
									setShowConditionEmojiPicker(false);
								}} 
								className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add/Edit Blood Inventory Modal */}
			{showAddBloodInventory && userRole === 'admin' && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">
							{editingBloodInventory ? 'Edit Inventory' : 'Add Blood Inventory'}
						</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Blood Type *</label>
								<select
									className="w-full border p-2 rounded"
									value={bloodInventoryForm.blood_type}
									onChange={e => setBloodInventoryForm({...bloodInventoryForm, blood_type: e.target.value})}
									required
								>
									<option value="">Select Blood Type</option>
									{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
										<option key={type} value={type}>{type}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Quantity (Units) *</label>
								<input
									type="number"
									min="0"
									className="w-full border p-2 rounded"
									value={bloodInventoryForm.quantity}
									onChange={e => setBloodInventoryForm({...bloodInventoryForm, quantity: e.target.value})}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
								<input
									type="date"
									className="w-full border p-2 rounded"
									value={bloodInventoryForm.expiry_date}
									onChange={e => setBloodInventoryForm({...bloodInventoryForm, expiry_date: e.target.value})}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Status *</label>
								<select
									className="w-full border p-2 rounded"
									value={bloodInventoryForm.status}
									onChange={e => setBloodInventoryForm({...bloodInventoryForm, status: e.target.value})}
									required
								>
									<option value="available">Available</option>
									<option value="low_stock">Low Stock</option>
									<option value="out_of_stock">Out of Stock</option>
								</select>
							</div>
							<div className="flex gap-2 mt-6">
								<button
									onClick={saveBloodInventory}
									className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
								>
									{editingBloodInventory ? 'Update' : 'Add'} Inventory
								</button>
								<button
									onClick={() => {
										setShowAddBloodInventory(false);
										setEditingBloodInventory(null);
										setBloodInventoryForm({ blood_type: '', quantity: '', expiry_date: '', status: 'available' });
									}}
									className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Add/Edit Surgery Category Modal */}
			{showAddSurgeryCategory && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<h3 className="text-2xl font-bold text-gray-900 mb-6">
							{editingSurgeryCategory ? 'Edit Surgery Category' : 'Add New Surgery Category'}
						</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Name *</label>
								<input
									type="text"
									className="w-full border p-2 rounded"
									value={editingSurgeryCategory ? editingSurgeryCategory.name : surgeryCategoryForm.name}
									onChange={e => editingSurgeryCategory
										? setEditingSurgeryCategory({ ...editingSurgeryCategory, name: e.target.value })
										: setSurgeryCategoryForm({ ...surgeryCategoryForm, name: e.target.value })}
									placeholder="e.g., Piles Surgery"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Icon (Emoji) *</label>
								<div className="flex gap-2">
									<input
										type="text"
										className="flex-1 border p-2 rounded"
										value={editingSurgeryCategory ? editingSurgeryCategory.icon : surgeryCategoryForm.icon}
										onChange={e => editingSurgeryCategory
											? setEditingSurgeryCategory({ ...editingSurgeryCategory, icon: e.target.value })
											: setSurgeryCategoryForm({ ...surgeryCategoryForm, icon: e.target.value })}
										placeholder="e.g., 🔴"
										required
									/>
									<button
										type="button"
										onClick={() => setShowSurgeryCategoryEmojiPicker(!showSurgeryCategoryEmojiPicker)}
										className="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200"
									>
										😀 Pick
									</button>
								</div>
								{showSurgeryCategoryEmojiPicker && (
									<div className="grid grid-cols-8 gap-2 mt-2 p-3 bg-gray-50 border rounded-lg max-h-48 overflow-y-auto">
										{['🔴', '🦴', '🫀', '👄', '🍑', '💧', '🫘', '❤️', '🏋️', '🟡', '❤️‍🩹', '⚕️', '💎', '🔵', '⚪', '🟢', '👁️', '🩺', '💉', '🔬', '🧬', '🦷', '👂', '👃', '🏥', '🚑', '🧪', '💊', '🩻', '📋', '✅', '❌', '⚠️', '💡', '🔥', '❄️', '🌡️'].map(emoji => (
											<button
												key={emoji}
												type="button"
												onClick={() => {
												if (editingSurgeryCategory) {
													setEditingSurgeryCategory({ ...editingSurgeryCategory, icon: emoji });
												} else {
													setSurgeryCategoryForm({ ...surgeryCategoryForm, icon: emoji });
												}
												setShowSurgeryCategoryEmojiPicker(false);
											}}
											className="text-2xl hover:bg-white hover:scale-125 transition rounded p-1"
											title={emoji}
										>
											{emoji}
										</button>
									))}
									</div>
								)}
								<p className="text-xs text-gray-500 mt-1">Click "Pick" to choose from common emojis or type your own</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Description (Optional)</label>
								<textarea
									className="w-full border p-2 rounded"
									rows={3}
									value={editingSurgeryCategory ? editingSurgeryCategory.description || '' : surgeryCategoryForm.description}
									onChange={e => editingSurgeryCategory
										? setEditingSurgeryCategory({ ...editingSurgeryCategory, description: e.target.value })
										: setSurgeryCategoryForm({ ...surgeryCategoryForm, description: e.target.value })}
									placeholder="Brief description of the surgery..."
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Display Order</label>
								<input
									type="number"
									className="w-full border p-2 rounded"
									value={editingSurgeryCategory ? editingSurgeryCategory.display_order : surgeryCategoryForm.display_order}
									onChange={e => editingSurgeryCategory
										? setEditingSurgeryCategory({ ...editingSurgeryCategory, display_order: parseInt(e.target.value) || 0 })
										: setSurgeryCategoryForm({ ...surgeryCategoryForm, display_order: parseInt(e.target.value) || 0 })}
								/>
							</div>
							<div>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={editingSurgeryCategory ? editingSurgeryCategory.is_active : surgeryCategoryForm.is_active}
										onChange={e => editingSurgeryCategory
											? setEditingSurgeryCategory({ ...editingSurgeryCategory, is_active: e.target.checked })
											: setSurgeryCategoryForm({ ...surgeryCategoryForm, is_active: e.target.checked })}
									/>
									<span className="text-sm font-medium">Active (visible on website)</span>
								</label>
							</div>
							<div className="flex gap-2 mt-6">
								<button
									onClick={() => editingSurgeryCategory ? updateSurgeryCategory(editingSurgeryCategory.id) : addSurgeryCategory()}
									className="flex-1 bg-brand text-white px-4 py-3 rounded-lg font-semibold hover:bg-brand-dark transition"
								>
									{editingSurgeryCategory ? 'Update Category' : 'Add Category'}
								</button>
								<button
									onClick={() => {
										setShowAddSurgeryCategory(false);
										setEditingSurgeryCategory(null);
										setSurgeryCategoryForm({ name: '', icon: '', description: '', display_order: 0, is_active: true });
										setShowSurgeryCategoryEmojiPicker(false);
									}}
									className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			</div>
		</div>
	);
}
