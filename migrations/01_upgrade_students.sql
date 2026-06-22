-- migrations/01_upgrade_students.sql

-- Add new columns for tracking status and sources
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Website',
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add UNIQUE constraint to prevent duplicate registrations for the same email AND mobile
ALTER TABLE public.students
ADD CONSTRAINT unique_email_mobile UNIQUE (email, mobile_number);

-- Optional: Create a trigger to automatically update the updated_at column
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
