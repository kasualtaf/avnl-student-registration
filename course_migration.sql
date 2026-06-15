-- SQL Migration to update course columns

-- 1. Add new columns
ALTER TABLE public.students ADD COLUMN course_code TEXT;
ALTER TABLE public.students ADD COLUMN course_name TEXT;

-- 2. Migrate existing data (Optional: maps old course_interested to course_name)
UPDATE public.students 
SET 
  course_code = 'UNKNOWN',
  course_name = course_interested 
WHERE course_code IS NULL;

-- 3. Enforce NOT NULL constraints
ALTER TABLE public.students ALTER COLUMN course_code SET NOT NULL;
ALTER TABLE public.students ALTER COLUMN course_name SET NOT NULL;

-- 4. Drop old column
ALTER TABLE public.students DROP COLUMN course_interested;
