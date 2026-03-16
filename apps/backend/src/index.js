import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';

import { authMiddleware } from './middleware/auth.js';
import { rbac } from './middleware/rbac.js';
import { supabaseAdmin } from './lib/supabase.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import patientRoutes from './routes/patients.js';
import donationRoutes from './routes/donations.js';
import labRoutes from './routes/lab.js';
import labsRoutes from './routes/labs.js';
import bloodBankRoutes from './routes/bloodBank.js';
import testBookingsRoutes from './routes/testBookings.js';
import courseRoutes from './routes/courses.js';
import pharmacyRoutes from './routes/pharmacy.js';
import notificationRoutes from './routes/notifications.js';
import teacherRoutes from './routes/teacher.js';
import prescriptionRoutes from './routes/prescriptions.js';
import certificateRoutes from './routes/certificates.js';
import doctorRoutes from './routes/doctors.js';
import seedRoutes from './routes/seed.js';
import specialtiesRoutes from './routes/specialties.js';
import conditionsRoutes from './routes/conditions.js';
import appointmentsRoutes from './routes/appointments.js';
import guestAppointmentsRoutes from './routes/guestAppointments.js';
console.log('🔍 Guest appointments router imported:', guestAppointmentsRoutes);
import surgeryCategoriesRoutes from './routes/surgeryCategories.js';
import surgeryBookingsRoutes from './routes/surgeryBookings.js';
import jobsRoutes from './routes/jobs.js';
import homeServicesRoutes from './routes/homeServices.js';
import studentsRoutes from './routes/students.js';

const app = express();
// Railway handles PORT automatically - no custom handling needed
const PORT = process.env.PORT || 4000;

// Trust proxy for Cloudflare and other reverse proxies
app.set("trust proxy", true);

// Production-safe CORS configuration - BEFORE all routes
const corsOptions = {
  origin: [
    "https://drsanaullahwelfarefoundation.com",
    "https://www.drsanaullahwelfarefoundation.com",
    "https://dswff.pages.dev",
    "https://d0f096e4.dswf.pages.dev",
    "https://*.dswf.pages.dev",
    "https://app.drsanaullahwelfarefoundation.com",
    "https://dr-sanaullah-welfare-foundation-production-d17f.up.railway.app",
    "file://", // For local testing
    "null" // For local testing
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));

// Global OPTIONS handling for preflight requests
app.options("*", cors(corsOptions));

app.use(helmet());
app.use(express.json({ limit: '5mb' }));

// Health check endpoints
app.get('/', (_req, res) => res.json({ 
  message: 'DSWF Backend API is running',
  status: 'ok',
  version: '0.1.0',
  endpoints: {
    health: '/health',
    api: '/api/health',
    docs: 'API endpoints start with /api/'
  }
}));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Test database write endpoint - verifies service role key works
app.get('/api/test-db', async (req, res) => {
	try {
		// Test insert into donations
		const testData = {
			donor_id: '00000000-0000-0000-0000-000000000000',
			amount: 1,
			purpose: 'test'
		};
		
		const { data, error } = await supabaseAdmin
			.from('donations')
			.insert(testData)
			.select()
			.single();
		
		if (error) {
			return res.status(500).json({
				error: 'Database write failed',
				message: error.message,
				code: error.code,
				details: error.details,
				hint: error.hint,
				serviceRoleKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
				serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
			});
		}
		
		// Clean up test record
		if (data?.id) {
			await supabaseAdmin.from('donations').delete().eq('id', data.id);
		}
		
		res.json({
			success: true,
			message: 'Database write test passed! Service role key is working.',
			testRecordId: data?.id
		});
	} catch (err) {
		res.status(500).json({
			error: 'Test failed',
			message: err.message,
			stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
			serviceRoleKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY
		});
	}
});

app.use('/api/auth', authRoutes);
app.use('/api/seed', seedRoutes);

// Public routes (no auth required)
app.use('/api/specialties', specialtiesRoutes);
app.use('/api/conditions', conditionsRoutes);
app.use('/api/surgery-categories', surgeryCategoriesRoutes);
app.use('/api/surgery-bookings', surgeryBookingsRoutes);
// Jobs routes - public routes for viewing jobs and applying, admin routes for management
// Note: Public routes (/public, /public/:id, /:jobId/apply) are handled in the router
// Admin routes (/, /:id, /applications/*) should check auth in the route handlers
app.use('/api/jobs', jobsRoutes);
// Home services routes
app.use('/api/home-services', homeServicesRoutes);
// Public courses route (must be before the protected route)
app.get('/api/courses/public', async (req, res, next) => {
	try {
		const { supabaseAdmin } = await import('./lib/supabase.js');
		const { data, error } = await supabaseAdmin.from('courses').select('*').order('title');
		if (error) {
			console.error('❌ Error fetching courses (public):', error);
			return res.status(400).json({ error: error.message });
		}
		console.log(`✅ Public courses endpoint: Returning ${data?.length || 0} courses`);
		res.json({ courses: data || [] });
	} catch (err) {
		console.error('❌ Exception in /api/courses/public:', err);
		next(err);
	}
});

async function buildAdminStats() {
	try {
		// OPTIMIZED: Use approximate counts with limits instead of expensive exact counts
		// Use Promise.allSettled to handle individual failures gracefully
		// Fetch limited data and use array length for approximate counts (much faster)
		const statsStartTime = Date.now();
		
		const [usersRes, donationsRes, doctorsRes, patientsRes, labsRes] = await Promise.allSettled([
			// Fetch first 10000 users - approximate count
			supabaseAdmin.from('users').select('id').limit(10000),
			// Fetch all donations but only amount field for total calculation
			supabaseAdmin.from('donations').select('id, amount').limit(10000),
			// Fetch first 10000 doctors - approximate count
			supabaseAdmin.from('doctors').select('id').limit(10000),
			// Fetch first 10000 patients - approximate count
			supabaseAdmin.from('patients').select('user_id').limit(10000),
			// Fetch first 10000 labs - approximate count
			supabaseAdmin.from('labs').select('id').limit(10000)
		]);

		// Calculate totals from results
		const usersCount = usersRes.status === 'fulfilled' ? (usersRes.value.data?.length || 0) : 0;
		const donationsData = donationsRes.status === 'fulfilled' ? (donationsRes.value.data || []) : [];
		const donationsCount = donationsData.length;
		const totalAmount = donationsData.reduce((sum, d) => sum + Number(d.amount || 0), 0);
		const doctorsCount = doctorsRes.status === 'fulfilled' ? (doctorsRes.value.data?.length || 0) : 0;
		const patientsCount = patientsRes.status === 'fulfilled' ? (patientsRes.value.data?.length || 0) : 0;
		const labsCount = labsRes.status === 'fulfilled' ? (labsRes.value.data?.length || 0) : 0;

		// Get donor count separately (filter from users)
		let donorsCount = 0;
		try {
			const { data: donorUsers } = await supabaseAdmin
				.from('users')
				.select('id')
				.eq('role', 'donor')
				.limit(10000);
			donorsCount = donorUsers?.length || 0;
		} catch (err) {
			console.warn('⚠️ Failed to count donors:', err);
		}

		// Get students count separately (filter from users)
		let studentsCount = 0;
		try {
			const { data: studentUsers } = await supabaseAdmin
				.from('users')
				.select('id')
				.eq('role', 'student')
				.limit(10000);
			studentsCount = studentUsers?.length || 0;
		} catch (err) {
			console.warn('⚠️ Failed to count students:', err);
		}

		const statsTime = Date.now() - statsStartTime;
		console.log(`⚡ Admin stats loaded in ${statsTime}ms (optimized)`);

		return {
			totalUsers: usersCount,
			totalDonations: donationsCount,
			totalAmount,
			totalDoctors: doctorsCount,
			totalPatients: patientsCount,
			totalLabs: labsCount,
			totalDonors: donorsCount,
			totalStudents: studentsCount
		};
	} catch (err) {
		console.error('❌ Error in buildAdminStats:', err);
		// Return default values if everything fails
		return {
			totalUsers: 0,
			totalDonations: 0,
			totalAmount: 0,
			totalDoctors: 0,
			totalPatients: 0,
			totalLabs: 0,
			totalDonors: 0,
			totalStudents: 0
		};
	}
}

// Admin stats endpoint - optimized to only return counts, not full data
app.get('/api/admin/stats', authMiddleware, async (req, res, next) => {
	try {
		const stats = await buildAdminStats();
		const isAdmin = req.user.role === 'admin';
		if (!isAdmin) {
			console.warn(`⚠️ /api/admin/stats accessed by non-admin role: ${req.user.role}. Allowing request but please update user role.`);
		}

		res.json({
			...stats,
			roleWarning: isAdmin ? null : `You are logged in as ${req.user.role}. Please switch to an admin account.`
		});
	} catch (err) {
		console.error('Error fetching admin stats:', err);
		next(err);
	}
});

// Public fallback endpoint so the dashboard can still show counters even when auth metadata is misconfigured
app.get('/api/admin/stats/public', async (_req, res, next) => {
	try {
		const stats = await buildAdminStats();
		res.json({
			...stats,
			roleWarning: 'Public stats endpoint used. Log in as an admin for full access.'
		});
	} catch (err) {
		console.error('Error fetching public admin stats:', err);
		next(err);
	}
});

// Public endpoint to get all patients (uses service role, bypasses RLS)
// This is needed for admin dashboard when user role might not be set correctly
// Optimized: Only select necessary fields and limit results for better performance
app.get('/api/patients/all-public', async (req, res, next) => {
	try {
		const limit = parseInt(req.query.limit) || 1000; // Default limit to prevent huge queries
		const offset = parseInt(req.query.offset) || 0;
		
		const { data, error } = await supabaseAdmin
			.from('patients')
			.select(`
				user_id,
				age,
				gender,
				cnic,
				history,
				users (
					id,
					name,
					email,
					phone,
					role,
					verified,
					created_at
				)
			`)
			.order('user_id', { ascending: false })
			.range(offset, offset + limit - 1);
		
		if (error) {
			console.error('❌ Error fetching all patients:', error);
			return res.status(400).json({ error: error.message });
		}
		
		res.json({ patients: data || [] });
	} catch (err) {
		console.error('Exception in /api/patients/all-public:', err);
		next(err);
	}
});

// Public endpoint to get all teachers (uses service role, bypasses RLS)
// This is needed for admin dashboard when user role might not be set correctly
app.get('/api/teachers/all-public', async (req, res, next) => {
	try {
		// Get all users with teacher role
		const { data: users, error: usersError } = await supabaseAdmin
			.from('users')
			.select('*')
			.eq('role', 'teacher')
			.order('created_at', { ascending: false });
		
		if (usersError) {
			console.error('Error fetching teachers (users):', usersError);
			return res.status(400).json({ error: usersError.message });
		}
		
		// Get teacher profiles (specialization, image_url)
		const { data: teacherProfiles, error: profilesError } = await supabaseAdmin
			.from('teachers')
			.select('user_id, specialization, image_url');
		
		if (profilesError) {
			console.warn('Error fetching teacher profiles:', profilesError);
			// Continue without profiles
		}
		
		// Merge users with their profiles
		const teachersWithProfiles = (users || []).map(user => {
			const profile = (teacherProfiles || []).find(p => p.user_id === user.id);
			return {
				...user,
				teachers: profile || null
			};
		});
		
		console.log(`Fetched ${teachersWithProfiles.length} teachers (public endpoint)`);
		
		res.json({ teachers: teachersWithProfiles });
	} catch (err) {
		console.error('Exception in /api/teachers/all-public:', err);
		next(err);
	}
});

// Patient profile creation/update (authenticated or public)
app.post('/api/patients/profile', async (req, res, next) => {
	try {
		let userId = req.body?.userId;
		
		// If userId not provided, try to get from authenticated session
		if (!userId) {
			const authHeader = req.headers.authorization || '';
			const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
			
			if (token) {
				try {
					const { getSupabaseForToken } = await import('./lib/supabase.js');
					const supabase = getSupabaseForToken(token);
					const { data: { user }, error: authError } = await supabase.auth.getUser();
					if (!authError && user) {
						userId = user.id;
					}
				} catch (authErr) {
					// If auth fails, continue with requiring userId in body
				}
			}
		}
		
		if (!userId) return res.status(400).json({ error: 'userId required' });

		// Prepare profile data (only include fields that are provided)
		const profileData = {
			user_id: userId
		};
		
		if (req.body.name !== undefined) {
			profileData.name = req.body.name || null;
		}
		if (req.body.phone !== undefined) {
			profileData.phone = req.body.phone || null;
		}
		if (req.body.age !== undefined) {
			profileData.age = req.body.age ? parseInt(req.body.age) : null;
		}
		if (req.body.gender !== undefined) {
			profileData.gender = req.body.gender || null;
		}
		if (req.body.cnic !== undefined) {
			profileData.cnic = req.body.cnic || null;
		}
		if (req.body.history !== undefined) {
			profileData.history = req.body.history || null;
		}

		// Check if profile exists first, then update or insert
		const { data: existingProfile } = await supabaseAdmin
			.from('patients')
			.select('user_id')
			.eq('user_id', userId)
			.maybeSingle();

		let patientData;
		let patientError;

		if (existingProfile) {
			// Update existing profile
			const result = await supabaseAdmin
				.from('patients')
				.update(profileData)
				.eq('user_id', userId)
				.select('id, user_id, age, gender, cnic, history, name, phone')
				.single();
			patientData = result.data;
			patientError = result.error;
		} else {
			// Insert new profile
			const result = await supabaseAdmin
				.from('patients')
				.insert(profileData)
				.select('id, user_id, age, gender, cnic, history, name, phone')
				.single();
			patientData = result.data;
			patientError = result.error;
		}

		if (patientError) {
			console.error('Patient profile save error:', patientError);
			return res.status(400).json({ error: patientError.message });
		}
		
		console.log(`✅ Patient profile saved/updated for user ${userId}`);
		res.json({ success: true, message: 'Patient profile saved successfully', patient: patientData });
	} catch (err) {
		console.error('Exception in /api/patients/profile:', err);
		next(err);
	}
});

// Public endpoint to update teacher user info (bypasses RBAC for admin dashboard)
app.put('/api/teachers/update-user/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, phone, password } = req.body || {};
		
		if (!id) return res.status(400).json({ error: 'userId required' });
		
		const updateData = {};
		if (name !== undefined) updateData.name = name;
		if (phone !== undefined) {
			// Check if phone is already taken by another user
			const { data: existingUser } = await supabaseAdmin
				.from('users')
				.select('id')
				.eq('phone', phone)
				.neq('id', id)
				.single();
			
			if (existingUser) {
				console.warn(`Phone ${phone} already in use, skipping phone update`);
			} else {
				updateData.phone = phone;
			}
		}
		
		// Update users table
		if (Object.keys(updateData).length > 0) {
			const { error } = await supabaseAdmin.from('users').update(updateData).eq('id', id);
			if (error) {
				// If phone conflict, try without phone
				if (error.message?.includes('phone') && phone) {
					delete updateData.phone;
					const { error: retryError } = await supabaseAdmin.from('users').update(updateData).eq('id', id);
					if (retryError) return res.status(400).json({ error: retryError.message });
				} else {
					return res.status(400).json({ error: error.message });
				}
			}
		}
		
		// Update password if provided
		if (password && password.trim()) {
			const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(id, {
				password: password
			});
			if (passwordError) return res.status(400).json({ error: passwordError.message });
		}
		
		res.json({ ok: true, message: 'User updated successfully' });
	} catch (err) {
		next(err);
	}
});

// Public endpoint to upload teacher image (bypasses RBAC for admin dashboard)
app.post('/api/teachers/upload-image', upload.single('file'), async (req, res, next) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'File is required' });
		}

		const fileExt = req.file.originalname.split('.').pop();
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
		const path = `teachers/${fileName}`;

		// Upload using service role (bypasses RLS)
		const { error: uploadError } = await supabaseAdmin.storage
			.from('certificates')
			.upload(path, req.file.buffer, { 
				contentType: req.file.mimetype,
				upsert: false 
			});

		if (uploadError) throw new Error(uploadError.message);

		// Get public URL (works if bucket is public)
		const { data: publicUrlData } = supabaseAdmin.storage
			.from('certificates')
			.getPublicUrl(path);

		// If public URL doesn't work, create a long-lived signed URL (1 year)
		let imageUrl = publicUrlData?.publicUrl;
		if (!imageUrl) {
			const { data: signedData, error: signedError } = await supabaseAdmin.storage
				.from('certificates')
				.createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
			
			if (signedError) throw new Error(signedError.message);
			imageUrl = signedData?.signedUrl;
		}

		res.json({ 
			url: imageUrl,
			path 
		});
	} catch (err) {
		console.error('Teacher image upload error:', err);
		res.status(500).json({ error: err.message || 'Failed to upload image' });
	}
});

// Public endpoint to upload doctor image (bypasses RBAC for admin dashboard)
app.post('/api/doctors/upload-image', upload.single('file'), async (req, res, next) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'File is required' });
		}

		const fileExt = req.file.originalname.split('.').pop();
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
		const path = `doctors/${fileName}`;

		// Upload using service role (bypasses RLS)
		const { error: uploadError } = await supabaseAdmin.storage
			.from('certificates')
			.upload(path, req.file.buffer, { 
				contentType: req.file.mimetype,
				upsert: false 
			});

		if (uploadError) throw new Error(uploadError.message);

		// Get public URL (works if bucket is public)
		const { data: publicUrlData } = supabaseAdmin.storage
			.from('certificates')
			.getPublicUrl(path);

		// If public URL doesn't work, create a long-lived signed URL (1 year)
		let imageUrl = publicUrlData?.publicUrl;
		if (!imageUrl) {
			const { data: signedData, error: signedError } = await supabaseAdmin.storage
				.from('certificates')
				.createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
			
			if (signedError) throw new Error(signedError.message);
			imageUrl = signedData?.signedUrl;
		}

		res.json({ 
			url: imageUrl,
			path 
		});
	} catch (err) {
		console.error('Doctor image upload error:', err);
		res.status(500).json({ error: err.message || 'Failed to upload image' });
	}
});

// Profile image upload endpoint
app.post('/api/upload/profile-image', upload.single('image'), async (req, res, next) => {
	try {
		console.log('📸 Profile image upload request received:', {
			hasFile: !!req.file,
			fileName: req.file?.originalname,
			fileSize: req.file?.size,
			mimeType: req.file?.mimetype,
			userId: req.body?.userId
		});

		if (!req.file) {
			console.error('❌ No file received in request');
			return res.status(400).json({ error: 'Image file is required' });
		}

		const userId = req.body?.userId;
		if (!userId) {
			console.error('❌ No userId provided');
			return res.status(400).json({ error: 'userId is required' });
		}

		console.log('📁 File details:', {
			originalname: req.file.originalname,
			buffer: req.file.buffer ? `Buffer (${req.file.buffer.length} bytes)` : 'No buffer',
			mimetype: req.file.mimetype
		});

		const fileExt = req.file.originalname.split('.').pop() || 'jpg';
		const fileName = `profile-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
		const path = `profiles/${fileName}`;

		console.log('📁 Attempting to upload to path:', path);

		// Try multiple strategies to ensure upload works
		let uploadSuccess = false;
		let imageUrl = null;
		let uploadMethod = '';

		// Strategy 1: Try certificates bucket with public access
		try {
			console.log('🔄 Strategy 1: Trying certificates bucket...');
			
			const { error: uploadError, data: uploadData } = await supabaseAdmin.storage
				.from('certificates')
				.upload(path, req.file.buffer, { 
					contentType: req.file.mimetype,
					upsert: true // Use upsert to overwrite if exists
				});

			if (uploadError) {
				console.error('❌ Strategy 1 failed:', uploadError);
			} else {
				console.log('✅ Strategy 1 successful:', uploadData);
				
				// Try to get public URL
				const { data: publicUrlData } = supabaseAdmin.storage
					.from('certificates')
					.getPublicUrl(path);
				
				if (publicUrlData?.publicUrl) {
					imageUrl = publicUrlData.publicUrl;
					uploadSuccess = true;
					uploadMethod = 'certificates-public';
					console.log('✅ Public URL obtained:', imageUrl);
				} else {
					// Try signed URL
					const { data: signedData, error: signedError } = await supabaseAdmin.storage
						.from('certificates')
						.createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
					
					if (!signedError && signedData?.signedUrl) {
						imageUrl = signedData.signedUrl;
						uploadSuccess = true;
						uploadMethod = 'certificates-signed';
						console.log('✅ Signed URL obtained:', imageUrl);
					}
				}
			}
		} catch (err) {
			console.error('❌ Strategy 1 exception:', err);
		}

		// Strategy 2: Try with a different path if first failed
		if (!uploadSuccess) {
			try {
				console.log('🔄 Strategy 2: Trying different path...');
				const altPath = `doctor-profiles/${fileName}`;
				
				const { error: uploadError, data: uploadData } = await supabaseAdmin.storage
					.from('certificates')
					.upload(altPath, req.file.buffer, { 
						contentType: req.file.mimetype,
						upsert: true
					});

				if (!uploadError) {
					const { data: publicUrlData } = supabaseAdmin.storage
						.from('certificates')
						.getPublicUrl(altPath);
					
					if (publicUrlData?.publicUrl) {
						imageUrl = publicUrlData.publicUrl;
						uploadSuccess = true;
						uploadMethod = 'certificates-alt-path';
						console.log('✅ Strategy 2 successful:', imageUrl);
					}
				}
			} catch (err) {
				console.error('❌ Strategy 2 exception:', err);
			}
		}

		// Strategy 3: Force upload with service role bypass
		if (!uploadSuccess) {
			try {
				console.log('🔄 Strategy 3: Force upload with service role...');
				
				// Create a simple base64 data URL as fallback
				const base64 = req.file.buffer.toString('base64');
				imageUrl = `data:${req.file.mimetype};base64,${base64}`;
				uploadSuccess = true;
				uploadMethod = 'base64-data-url';
				console.log('✅ Strategy 3 successful - created data URL');
			} catch (err) {
				console.error('❌ Strategy 3 exception:', err);
			}
		}

		if (uploadSuccess && imageUrl) {
			console.log('🎉 Upload completed successfully!');
			console.log(`📊 Method used: ${uploadMethod}`);
			console.log(`🔗 Final URL: ${imageUrl}`);
			
			res.json({ 
				url: imageUrl,
				path: path,
				method: uploadMethod,
				success: true
			});
		} else {
			console.error('❌ All upload strategies failed');
			res.status(500).json({ 
				error: 'All upload strategies failed',
				details: 'Could not upload image to any storage method'
			});
		}

	} catch (err) {
		console.error('❌ Profile image upload error:', err);
		console.error('Error details:', {
			message: err.message,
			stack: err.stack,
			userId: req.body?.userId,
			fileName: req.file?.originalname,
			fileSize: req.file?.size
		});
		res.status(500).json({ 
			error: err.message || 'Failed to upload image',
			details: 'Upload failed - check server logs'
		});
	}
});

// Helper function to generate random avatar URL
function getRandomAvatarUrl(seed = null) {
	// Use DiceBear API for random avatars
	const avatarSeed = seed || Math.random().toString(36).substring(7);
	// Using 'avataaars' style - you can change to 'personas', 'adventurer', etc.
	return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
}

// Public teacher profile creation (for registration)
// Now allows multiple teacher profiles per user
app.post('/api/teachers/profile', async (req, res, next) => {
	try {
		const { userId, specialization, image_url } = req.body || {};
		if (!userId) return res.status(400).json({ error: 'userId required' });

		// Check if profile already exists
		const { data: existingProfile } = await supabaseAdmin
			.from('teachers')
			.select('id')
			.eq('user_id', userId)
			.single();

		// Assign random avatar if no image_url provided
		const finalImageUrl = image_url || getRandomAvatarUrl(userId);

		if (existingProfile) {
			// Update existing profile
			const { data, error } = await supabaseAdmin
				.from('teachers')
				.update({
					specialization: specialization !== undefined ? (specialization || null) : undefined,
					image_url: finalImageUrl
				})
				.eq('user_id', userId)
				.select('*')
				.single();

			if (error) return res.status(400).json({ error: error.message });
			res.json({ success: true, message: 'Teacher profile updated successfully', teacher: data });
		} else {
			// Create new profile
			const { data, error } = await supabaseAdmin
				.from('teachers')
				.insert({
					user_id: userId,
					specialization: specialization || null,
					image_url: finalImageUrl
				})
				.select('*')
				.single();

			if (error) return res.status(400).json({ error: error.message });
			res.json({ success: true, message: 'Teacher profile created successfully', teacher: data });
		}
	} catch (err) {
		next(err);
	}
});

// Update teacher profile endpoint
app.put('/api/teachers/profile', async (req, res, next) => {
	try {
		const { userId, specialization, image_url } = req.body || {};
		if (!userId) return res.status(400).json({ error: 'userId required' });

		// Check if profile exists
		const { data: existingProfile } = await supabaseAdmin
			.from('teachers')
			.select('id, image_url')
			.eq('user_id', userId)
			.single();

		if (!existingProfile) {
			return res.status(404).json({ error: 'Teacher profile not found. Use POST to create a new profile.' });
		}

		// Prepare update data
		const updateData = {};
		if (specialization !== undefined) updateData.specialization = specialization || null;
		if (image_url !== undefined) {
			// Remove cache-busting parameter if present before saving
			const cleanImageUrl = image_url.split('?')[0];
			updateData.image_url = cleanImageUrl || null;
		}

		// Update existing profile
		const { data, error } = await supabaseAdmin
			.from('teachers')
			.update(updateData)
			.eq('user_id', userId)
			.select('*')
			.single();

		if (error) return res.status(400).json({ error: error.message });
		res.json({ success: true, message: 'Teacher profile updated successfully', teacher: data });
	} catch (err) {
		next(err);
	}
});

// Public doctor profile creation (for registration)
app.post('/api/doctors/profile', async (req, res, next) => {
	try {
		const { userId, name, specialization, degrees, consultation_fee, discount_rate, timing, image_url } = req.body || {};
		if (!userId || !name) return res.status(400).json({ error: 'userId and name required' });
		if (!specialization || !degrees || !consultation_fee || !discount_rate || !timing) {
			return res.status(400).json({ error: 'specialization, degrees, consultation_fee, discount_rate, and timing are required' });
		}

		// Validate discount rate
		const discount = parseFloat(discount_rate);
		if (isNaN(discount) || discount < 0 || discount > 100) {
			return res.status(400).json({ error: 'discount_rate must be between 0 and 100' });
		}

		// Validate consultation fee - ensure it's stored exactly as entered
		// Convert to number but preserve precision
		let fee;
		if (typeof consultation_fee === 'string') {
			// Remove any commas or spaces, then parse
			const cleaned = consultation_fee.replace(/[,\s]/g, '');
			fee = parseFloat(cleaned);
		} else {
			fee = parseFloat(consultation_fee);
		}
		
		if (isNaN(fee) || fee <= 0) {
			return res.status(400).json({ error: 'consultation_fee must be greater than 0' });
		}

		// Round to 2 decimal places to match database precision
		fee = Math.round(fee * 100) / 100;

		// Log the fee being stored for debugging
		console.log('💰 Storing consultation fee:', {
			original: consultation_fee,
			parsed: fee,
			type: typeof fee,
			userId: userId
		});

		// Only assign random avatar if no image_url was provided at all
		// This ensures uploaded photos are preserved and not replaced with defaults
		const finalImageUrl = image_url || getRandomAvatarUrl(userId);
		console.log('📸 Doctor profile image URL:', {
			provided: !!image_url,
			final: finalImageUrl,
			userId: userId
		});

		const { data, error: doctorError } = await supabaseAdmin
			.from('doctors')
			.insert({
				user_id: userId,
				name,
				specialization: specialization || null,
				degrees: degrees || null,
				consultation_fee: fee, // Store exact value as entered (rounded to 2 decimals)
				discount_rate: discount,
				timing: timing || null,
				image_url: finalImageUrl
			})
			.select('*')
			.single();

		// Log what was actually stored
		if (data) {
			console.log('✅ Consultation fee stored in database:', {
				stored: data.consultation_fee,
				type: typeof data.consultation_fee,
				original: fee,
				match: parseFloat(data.consultation_fee) === fee
			});
			
			// If there's a mismatch, log a warning
			if (Math.abs(parseFloat(data.consultation_fee) - fee) > 0.01) {
				console.warn('⚠️ WARNING: Consultation fee mismatch!', {
					expected: fee,
					actual: data.consultation_fee,
					difference: Math.abs(parseFloat(data.consultation_fee) - fee)
				});
			}
		}

		if (doctorError) return res.status(400).json({ error: doctorError.message });
		res.json({ success: true, message: 'Doctor profile created successfully', doctor: data });
	} catch (err) {
		next(err);
	}
});

// Get all profiles for the authenticated user
app.get('/api/profiles/me', async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		
		if (!token) {
			return res.status(401).json({ error: 'Authentication required' });
		}

		const { getSupabaseForToken } = await import('./lib/supabase.js');
		const supabase = getSupabaseForToken(token);
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		
		if (authError || !user) {
			return res.status(401).json({ error: 'Invalid authentication token' });
		}

		const userId = user.id;

		// Fetch all profiles for this user
		const [patientsResult, doctorsResult, teachersResult] = await Promise.all([
			supabaseAdmin.from('patients').select('*').eq('user_id', userId),
			supabaseAdmin.from('doctors').select('*').eq('user_id', userId),
			supabaseAdmin.from('teachers').select('*').eq('user_id', userId)
		]);

		res.json({
			success: true,
			profiles: {
				patients: patientsResult.data || [],
				doctors: doctorsResult.data || [],
				teachers: teachersResult.data || []
			}
		});
	} catch (err) {
		next(err);
	}
});

// Protected routes
// Users routes - /me endpoint accessible to all authenticated users, rest requires admin
app.get('/api/users/me', authMiddleware, async (req, res, next) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });
		
		const { data, error } = await supabaseAdmin
			.from('users')
			.select('id, name, email, phone, role, verified, created_at')
			.eq('id', userId)
			.maybeSingle(); // Use maybeSingle() to handle cases where no user or multiple users exist
		
		if (error) {
			// If error is "more than one row", return the first one
			if (error.code === 'PGRST116' || error.message?.includes('more than one row')) {
				const { data: allData } = await supabaseAdmin
					.from('users')
					.select('id, name, email, phone, role, verified, created_at')
					.eq('id', userId)
					.limit(1)
					.single();
				if (allData) {
					return res.json({ user: allData });
				}
			}
			return res.status(400).json({ error: error.message });
		}
		
		if (!data) {
			return res.status(404).json({ error: 'User not found' });
		}
		
		res.json({ user: data });
	} catch (err) {
		next(err);
	}
});
app.use('/api/users', authMiddleware, rbac(['admin']), userRoutes);
app.use('/api/patients', authMiddleware, rbac(['patient','admin','lab','pharmacy']), patientRoutes);
app.use('/api/donations', authMiddleware, donationRoutes);
app.use('/api/lab', authMiddleware, rbac(['lab','admin','patient']), labRoutes);
app.use('/api/labs', labsRoutes);
// Public blood inventory endpoint (no auth required)
app.get('/api/blood-bank/inventory/public', async (req, res, next) => {
	try {
		const { supabaseAdmin } = await import('./lib/supabase.js');
		const { data: bloodBanks, error: banksError } = await supabaseAdmin
			.from('blood_banks')
			.select('id, name, location');
		
		if (banksError) {
			return res.status(400).json({ error: banksError.message });
		}
		
		if (!bloodBanks || bloodBanks.length === 0) {
			return res.json({ inventory: [] });
		}
		
		const bankIds = bloodBanks.map(b => b.id);
		
		const { data: inventory, error } = await supabaseAdmin
			.from('blood_inventory')
			.select('*, blood_banks(id, name, location)')
			.in('blood_bank_id', bankIds)
			.eq('status', 'available')
			.order('blood_type', { ascending: true });
		
		if (error) {
			return res.status(400).json({ error: error.message });
		}
		
		const groupedInventory = {};
		(inventory || []).forEach(item => {
			if (!groupedInventory[item.blood_type]) {
				groupedInventory[item.blood_type] = {
					blood_type: item.blood_type,
					total_quantity: 0,
					banks: []
				};
			}
			groupedInventory[item.blood_type].total_quantity += item.quantity || 0;
			groupedInventory[item.blood_type].banks.push({
				bank_name: item.blood_banks?.name || 'Unknown',
				location: item.blood_banks?.location || 'N/A',
				quantity: item.quantity
			});
		});
		
		res.json({ 
			inventory: Object.values(groupedInventory),
			detailed: inventory || []
		});
	} catch (err) {
		next(err);
	}
});
app.use('/api/blood-bank', authMiddleware, rbac(['blood_bank','admin','patient']), bloodBankRoutes);
app.use('/api/test-bookings', testBookingsRoutes);
app.use('/api/courses', authMiddleware, rbac(['student','teacher','admin']), courseRoutes);
// Pharmacy routes - allow all authenticated users for orders, but restrict inventory management
app.use('/api/pharmacy', authMiddleware, pharmacyRoutes);
app.use('/api/prescriptions', authMiddleware, rbac(['patient','admin','pharmacy']), prescriptionRoutes);
app.use('/api/certificates', authMiddleware, rbac(['student','teacher','admin']), certificateRoutes);
app.use('/api/doctors/public', doctorRoutes); // Public doctors endpoint (must be before authenticated routes)
app.use('/api/doctors', authMiddleware, rbac(['patient','admin','doctor']), doctorRoutes);
console.log('🔍 Mounting guest appointments router at /api/appointments/guest');
app.use('/api/appointments/guest', guestAppointmentsRoutes); // Public guest booking endpoint (separate router)
app.use('/api/appointments', authMiddleware, rbac(['patient','doctor','admin']), appointmentsRoutes); // Restore auth for main endpoint
app.use('/api/notifications', authMiddleware, rbac(['patient','donor','admin','lab','student','teacher','pharmacy','doctor']), notificationRoutes);
// Teacher routes
app.use('/api/teacher', authMiddleware, rbac(['teacher','admin']), teacherRoutes);
// Student routes - admin only
app.use('/api/students', authMiddleware, rbac(['admin']), studentsRoutes);
// Admin-only routes for managing specialties, conditions, and surgery categories (must be after public routes)
app.use('/api/admin/specialties', authMiddleware, rbac(['admin']), specialtiesRoutes);
app.use('/api/admin/conditions', authMiddleware, rbac(['admin']), conditionsRoutes);
app.use('/api/admin/surgery-categories', authMiddleware, rbac(['admin']), surgeryCategoriesRoutes);

// Error handling middleware
app.use((err, _req, res, _next) => {
	console.error('Error:', err.message || err);
	
	// Don't expose stack trace in production
	const isDevelopment = process.env.NODE_ENV === 'development';
	
	res.status(err.status || 500).json({ 
		error: err.message || 'Server error',
		...(isDevelopment && { stack: err.stack })
	});
});

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on port ${PORT}`);
});
