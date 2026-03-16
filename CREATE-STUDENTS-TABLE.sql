-- Create students table if it doesn't exist
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    roll_number VARCHAR(50),
    admission_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Enable RLS (Row Level Security)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policy for admins (full access)
DROP POLICY IF EXISTS "Admins can manage all students" ON students;
CREATE POLICY "Admins can manage all students" ON students
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Create policy for students (read own data)
DROP POLICY IF EXISTS "Students can read own data" ON students;
CREATE POLICY "Students can read own data" ON students
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'student' AND user_id = auth.uid()
    );

-- Create policy for teachers (read students in their courses)
DROP POLICY IF EXISTS "Teachers can read students in their courses" ON students;
CREATE POLICY "Teachers can read students in their courses" ON students
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'teacher' 
        AND course_id IN (
            SELECT id FROM courses WHERE trainer_id = auth.uid()
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
