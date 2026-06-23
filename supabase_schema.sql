-- supabase_schema.sql

-- Create the students table
CREATE TABLE public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registration_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    city TEXT,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    whatsapp_number TEXT,
    status TEXT DEFAULT 'Pending',
    source TEXT DEFAULT 'Website',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_email_mobile UNIQUE (email, mobile_number)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert new student registrations
CREATE POLICY "Allow public inserts" ON public.students
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated admins to view, update, and delete registrations
CREATE POLICY "Allow authenticated read/update/delete" ON public.students
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Auto-bump updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

