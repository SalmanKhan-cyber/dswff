import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// Add new student
router.post('/add', async (req, res) => {
	try {
		const { name, email, phone, course_id, roll_number, admission_date, status } = req.body;
		
		// Validate required fields
		if (!name || !email) {
			return res.status(400).json({ error: 'Name and email are required' });
		}
		
		// First create user account
		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: 'tempPassword123', // You might want to generate a random password
			email_confirm: false,
			user_metadata: { 
				role: 'student',
				name: name,
				phone: phone
			}
		});
		
		if (authError) {
			console.error('Error creating student user:', authError);
			return res.status(400).json({ error: 'Failed to create student account: ' + authError.message });
		}
		
		// Then create student record
		const { data: studentData, error: studentError } = await supabaseAdmin
			.from('students')
			.insert({
				user_id: authData.user.id,
				name: name,
				email: email,
				phone: phone,
				course_id: course_id || null,
				roll_number: roll_number || null,
				admission_date: admission_date || new Date().toISOString().split('T')[0],
				status: status || 'active'
			})
			.select()
			.single();
		
		if (studentError) {
			console.error('Error creating student record:', studentError);
			// Clean up auth user if student record fails
			await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
			return res.status(400).json({ error: 'Failed to create student record: ' + studentError.message });
		}
		
		res.json({ 
			success: true, 
			student: studentData,
			message: 'Student added successfully' 
		});
		
	} catch (err) {
		console.error('Error in add student:', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Get all students
router.get('/', async (req, res) => {
	try {
		const { data, error } = await supabaseAdmin
			.from('students')
			.select(`
				*,
				courses (title)
			`)
			.leftJoin('courses', 'students.course_id', 'courses.id');
		
		if (error) {
			console.error('Error fetching students:', error);
			return res.status(500).json({ error: 'Failed to fetch students' });
		}
		
		res.json({ students: data || [] });
		
	} catch (err) {
		console.error('Error in get students:', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Delete student
router.delete('/delete', async (req, res) => {
	try {
		const { id } = req.body;
		
		if (!id) {
			return res.status(400).json({ error: 'Student ID is required' });
		}
		
		// Get student user_id first
		const { data: student, error: fetchError } = await supabaseAdmin
			.from('students')
			.select('user_id')
			.eq('id', id)
			.single();
		
		if (fetchError || !student) {
			return res.status(404).json({ error: 'Student not found' });
		}
		
		// Delete student record
		const { error: deleteError } = await supabaseAdmin
			.from('students')
			.delete()
			.eq('id', id);
		
		if (deleteError) {
			console.error('Error deleting student:', deleteError);
			return res.status(500).json({ error: 'Failed to delete student' });
		}
		
		// Delete user account
		const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(student.user_id);
		
		if (authDeleteError) {
			console.error('Error deleting user account:', authDeleteError);
			// Don't fail the request if auth deletion fails
		}
		
		res.json({ 
			success: true, 
			message: 'Student deleted successfully' 
		});
		
	} catch (err) {
		console.error('Error in delete student:', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;
