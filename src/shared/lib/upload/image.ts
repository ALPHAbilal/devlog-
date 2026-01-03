import { supabase } from '@/shared/api';

/**
 * Uploads an image to Supabase Storage and returns the public URL
 * @param {File|Blob} imageFile - The image file to upload
 * @param {string} userId - The user ID for organizing uploads
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadImageToSupabase(imageFile, userId) {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const fileExt = imageFile.type.split('/')[1] || 'png';
    const fileName = `${userId}/${timestamp}-${randomId}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      path: fileName
    };
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
}

/**
 * Converts a base64 data URL to a Blob
 * @param {string} dataUrl - The base64 data URL
 * @returns {Blob}
 */
export function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Compresses an image before upload
 * @param {File|Blob} imageFile - The image to compress
 * @param {number} maxWidth - Maximum width (default: 1920)
 * @param {number} quality - JPEG quality (0-1, default: 0.85)
 * @returns {Promise<Blob>}
 */
export async function compressImage(imageFile, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Deletes an image from Supabase Storage
 * @param {string} imagePath - The storage path of the image
 */
export async function deleteImageFromSupabase(imagePath) {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([imagePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    throw error;
  }
}

/**
 * Creates a storage bucket if it doesn't exist (run once during setup)
 */
export async function createImagesBucketIfNotExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets.find(b => b.name === 'images')) {
      const { error } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (error) {
        console.error('Failed to create bucket:', error);
      }
    }
  } catch (error) {
    console.error('Bucket creation check failed:', error);
  }
}