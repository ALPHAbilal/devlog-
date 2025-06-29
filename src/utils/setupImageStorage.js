import { supabase } from '../lib/supabase';
import { createImagesBucketIfNotExists } from './imageUploader';

/**
 * Sets up image storage bucket and policies
 * Run this once during initial setup or when setting up a new environment
 */
export async function setupImageStorage() {
  try {
    console.log('Setting up image storage...');
    
    // Create bucket if it doesn't exist
    await createImagesBucketIfNotExists();
    
    // Set up storage policies (these need to be done in Supabase dashboard)
    console.log(`
Image storage setup complete!

⚠️  IMPORTANT: You need to add the following RLS policies in your Supabase dashboard:

1. Go to Storage > Policies in your Supabase dashboard
2. For the 'images' bucket, add these policies:

SELECT (View):
- Policy name: "Users can view all images"
- Target roles: authenticated
- WITH CHECK expression: true

INSERT (Upload):
- Policy name: "Users can upload to their folder"
- Target roles: authenticated  
- WITH CHECK expression: bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text

UPDATE:
- Policy name: "Users can update their own images"
- Target roles: authenticated
- USING expression: bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text
- WITH CHECK expression: bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text

DELETE:
- Policy name: "Users can delete their own images"
- Target roles: authenticated
- USING expression: bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text
`);
    
    return true;
  } catch (error) {
    console.error('Failed to setup image storage:', error);
    return false;
  }
}

/**
 * Migrate existing base64 images to Supabase Storage
 * This is a one-time migration function
 */
export async function migrateBase64Images() {
  try {
    console.log('Starting image migration...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }
    
    // Fetch all images from the images table
    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .is('storage_path', null); // Only migrate images without storage_path
    
    if (fetchError) throw fetchError;
    
    if (!images || images.length === 0) {
      console.log('No images to migrate');
      return { migrated: 0, failed: 0 };
    }
    
    console.log(`Found ${images.length} images to migrate`);
    
    let migrated = 0;
    let failed = 0;
    
    // Import necessary functions
    const { dataUrlToBlob, uploadImageToSupabase } = await import('./imageUploader');
    
    // Migrate each image
    for (const image of images) {
      try {
        console.log(`Migrating image ${image.id}...`);
        
        // Convert base64 to blob
        const blob = dataUrlToBlob(image.content);
        
        // Upload to Supabase Storage
        const { url, path } = await uploadImageToSupabase(blob, user.id);
        
        // Update the image record with storage info
        const { error: updateError } = await supabase
          .from('images')
          .update({
            storage_path: path,
            cdn_url: url,
            // Keep content for now as backup
          })
          .eq('id', image.id);
        
        if (updateError) throw updateError;
        
        migrated++;
        console.log(`✓ Migrated image ${image.id}`);
      } catch (error) {
        console.error(`✗ Failed to migrate image ${image.id}:`, error);
        failed++;
      }
    }
    
    console.log(`Migration complete: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Clean up base64 data after successful migration
 * Only run this after verifying all images load correctly from storage
 */
export async function cleanupBase64Data() {
  try {
    console.log('Cleaning up base64 data...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }
    
    // Only clean up images that have been successfully migrated
    const { data, error } = await supabase
      .from('images')
      .update({ content: null })
      .eq('user_id', user.id)
      .not('storage_path', 'is', null)
      .not('cdn_url', 'is', null);
    
    if (error) throw error;
    
    console.log('Base64 data cleaned up successfully');
    return true;
  } catch (error) {
    console.error('Cleanup failed:', error);
    return false;
  }
}