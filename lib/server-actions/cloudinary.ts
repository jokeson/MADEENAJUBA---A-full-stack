"use server";

import { uploadImageFromBase64, uploadImageFromBuffer } from "@/lib/cloudinary";

/**
 * Server action to upload an image to Cloudinary from base64 data URL
 */
export async function uploadImageToCloudinary(
  base64Data: string,
  folder: string = 'madeenajuba_Kilimanjaro',
  publicId?: string
) {
  try {
    if (!base64Data) {
      return { success: false, error: "No image data provided" };
    }

    // Validate that it's a base64 image
    if (!base64Data.startsWith('data:image/') && !base64Data.includes(',')) {
      return { success: false, error: "Invalid image format" };
    }

    const result = await uploadImageFromBase64(base64Data, folder, publicId);
    return result;
  } catch (error) {
    console.error("Error in uploadImageToCloudinary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}

/**
 * Server action to upload an image to Cloudinary from a file
 * This accepts a base64 string that will be converted to buffer
 */
export async function uploadImageFileToCloudinary(
  base64Data: string,
  folder: string = 'madeenajuba_Kilimanjaro',
  publicId?: string
) {
  try {
    if (!base64Data) {
      return { success: false, error: "No image data provided" };
    }

    // Convert base64 to buffer
    const base64String = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;
    
    const buffer = Buffer.from(base64String, 'base64');
    
    const result = await uploadImageFromBuffer(buffer, folder, publicId);
    return result;
  } catch (error) {
    console.error("Error in uploadImageFileToCloudinary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}

