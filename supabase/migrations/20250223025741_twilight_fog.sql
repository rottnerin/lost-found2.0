/*
  # Update items table schema and add storage

  1. Changes
    - Change `tag` column to `tags` array
    - Migrate existing data
    - Create storage bucket for images

  2. Security
    - Enable RLS on storage bucket
    - Add storage policies for authenticated users
*/

-- First create a temporary column to hold the array
ALTER TABLE items 
ADD COLUMN tags_array text[] DEFAULT '{}';

-- Update the temporary column with the existing tag value
DO $$
BEGIN
  UPDATE items 
  SET tags_array = ARRAY[tag]
  WHERE tag IS NOT NULL;
END $$;

-- Drop the old tag column
ALTER TABLE items 
DROP COLUMN tag;

-- Rename the new column
ALTER TABLE items 
RENAME COLUMN tags_array TO tags;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true);

-- Storage policies
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item-images');

CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images');

CREATE POLICY "Allow authenticated users to update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'item-images')
WITH CHECK (bucket_id = 'item-images');

CREATE POLICY "Allow authenticated users to delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'item-images');