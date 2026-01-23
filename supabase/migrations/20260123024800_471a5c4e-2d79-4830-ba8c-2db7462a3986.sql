-- Make library bucket public for easier file access
UPDATE storage.buckets SET public = true WHERE id = 'library';

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can upload library files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own library files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read public library files" ON storage.objects;

-- Add policy for authenticated users to upload to their own folder
CREATE POLICY "Users can upload library files" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'library' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add policy for authenticated users to read their own files  
CREATE POLICY "Users can read their own library files" 
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'library' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add policy for public read access (for shared/published books)
CREATE POLICY "Public can read public library files" 
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'library');