import { v2 as cloudinary } from 'cloudinary';

// Lazy initialization function to get Cloudinary config
const getCloudinaryConfig = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Check if all required environment variables are set
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('⚠️ Cloudinary configuration error: Missing environment variables');
    console.error('Required variables:');
    console.error('- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:', cloudName ? '✓ Set' : '✗ Missing');
    console.error('- CLOUDINARY_API_KEY:', apiKey ? '✓ Set' : '✗ Missing');
    console.error('- CLOUDINARY_API_SECRET:', apiSecret ? '✓ Set' : '✗ Missing');
    return null;
  }

  return { cloudName, apiKey, apiSecret };
};

// Lazy initialization function to configure Cloudinary
const configureCloudinary = () => {
  const config = getCloudinaryConfig();
  if (!config) {
    return false;
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return true;
};

// Export configured cloudinary instance
export { cloudinary };

/**
 * Upload an image to Cloudinary from a base64 data URL
 */
export async function uploadImageFromBase64(
  base64Data: string,
  folder: string = 'madeenajuba_Kilimanjaro',
  publicId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Configure Cloudinary before attempting upload (lazy initialization)
    const config = getCloudinaryConfig();
    if (!config) {
      return {
        success: false,
        error: 'Cloudinary configuration is incomplete. Please check your environment variables (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) in your Vercel project settings.',
      };
    }

    // Ensure Cloudinary is configured
    configureCloudinary();

    // Remove data URL prefix if present
    const base64String = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;

    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64String}`,
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      }
    );

    return {
      success: true,
      url: uploadResult.secure_url,
    };
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to upload image to Cloudinary';
    
    if (error?.http_code === 401) {
      errorMessage = 'Cloudinary authentication failed. Please check your API credentials (CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET) in your Vercel project settings → Environment Variables.';
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Upload an image to Cloudinary from a file buffer
 */
export async function uploadImageFromBuffer(
  buffer: Buffer,
  folder: string = 'madeenajuba_Kilimanjaro',
  publicId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Error uploading image to Cloudinary:', error);
            resolve({
              success: false,
              error: error.message || 'Failed to upload image',
            });
          } else if (result) {
            resolve({
              success: true,
              url: result.secure_url,
            });
          } else {
            resolve({
              success: false,
              error: 'No result from Cloudinary',
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.result || 'Failed to delete image',
      };
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    };
  }
}

