-- Migration: Update images table for Supabase Storage
-- Description: Adds columns to support storing images in Supabase Storage instead of base64

-- Add new columns for storage support
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS cdn_url TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS dimensions JSONB;

-- Create index for faster lookups by storage path
CREATE INDEX IF NOT EXISTS idx_images_storage_path ON images(storage_path) WHERE storage_path IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN images.storage_path IS 'Path to the image file in Supabase Storage bucket';
COMMENT ON COLUMN images.cdn_url IS 'Public CDN URL for accessing the image';
COMMENT ON COLUMN images.file_size IS 'File size in bytes';
COMMENT ON COLUMN images.dimensions IS 'Image dimensions as {width, height}';

-- Create a function to get image by storage path
CREATE OR REPLACE FUNCTION get_image_by_path(p_storage_path TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  storage_path TEXT,
  cdn_url TEXT,
  file_size BIGINT,
  dimensions JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    i.content,
    i.storage_path,
    i.cdn_url,
    i.file_size,
    i.dimensions,
    i.created_at
  FROM images i
  WHERE i.storage_path = p_storage_path
  AND i.user_id = auth.uid();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_image_by_path TO authenticated;

-- Create a function to save image metadata
CREATE OR REPLACE FUNCTION save_image_metadata(
  p_storage_path TEXT,
  p_cdn_url TEXT,
  p_file_size BIGINT,
  p_dimensions JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_image_id UUID;
BEGIN
  -- Insert new image record
  INSERT INTO images (
    id,
    user_id,
    storage_path,
    cdn_url,
    file_size,
    dimensions,
    created_at
  ) VALUES (
    gen_random_uuid(),
    auth.uid(),
    p_storage_path,
    p_cdn_url,
    p_file_size,
    p_dimensions,
    NOW()
  )
  RETURNING id INTO v_image_id;
  
  RETURN v_image_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION save_image_metadata TO authenticated;