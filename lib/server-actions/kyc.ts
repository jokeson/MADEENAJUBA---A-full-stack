"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS } from "@/lib/db/models";
import type { KycModel } from "@/lib/db/models";
import { getUserById, getUserByEmail } from "@/lib/db/utils";

/**
 * Submit KYC application
 * 
 * Users must submit their personal information and ID documents to apply for a wallet.
 * 
 * @param userId - User ID (can be localStorage ID or MongoDB ObjectId)
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param phone - User's phone number
 * @param address - User's residential address
 * @param idFrontUrl - URL to front of ID document
 * @param idBackUrl - URL to back of ID document
 * @param email - User's email (for lookup if userId is not ObjectId)
 * @returns Success status
 */
export async function submitKycApplication(
  userId: string,
  firstName: string,
  lastName: string,
  phone: string,
  address: string,
  idFrontUrl: string,
  idBackUrl: string,
  email?: string
) {
  try {
    // Validate inputs
    if (!userId || !firstName || !lastName || !phone || !address || !idFrontUrl || !idBackUrl) {
      return { success: false, error: "All fields are required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      const user = await getUserById(userId);
      if (user && user._id) {
        mongoUserId = user._id;
      }
    } else if (email) {
      const user = await getUserByEmail(email);
      if (user && user._id) {
        mongoUserId = user._id;
      }
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found in database. Please sign up or contact support." };
    }

    // Check if user already has a KYC application
    const kycCollection = await getCollection<KycModel>(COLLECTIONS.KYC);
    const existingApplication = await kycCollection.findOne({ userId: mongoUserId });

    if (existingApplication) {
      if (existingApplication.status === "pending") {
        return { success: false, error: "You already have a pending KYC application. Please wait for admin review." };
      }
      if (existingApplication.status === "approved") {
        return { success: false, error: "Your KYC application has already been approved." };
      }
      // If rejected, allow resubmission
    }

    // Create new KYC application
    const kycApplication: KycModel = {
      userId: mongoUserId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status: "pending",
      documents: [
        {
          type: "id_front",
          url: idFrontUrl,
          uploadedAt: new Date(),
        },
        {
          type: "id_back",
          url: idBackUrl,
          uploadedAt: new Date(),
        },
      ],
      submittedAt: new Date(),
    };

    await kycCollection.insertOne(kycApplication);

    return { success: true, message: "KYC application submitted successfully. Please wait for admin approval." };
  } catch (error) {
    console.error("Error submitting KYC application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit KYC application",
    };
  }
}

/**
 * Get user's KYC application status
 * 
 * @param userId - User ID (can be localStorage ID or MongoDB ObjectId)
 * @param email - User's email (for lookup if userId is not ObjectId)
 * @returns KYC application status or null if not found
 */
export async function getKycStatus(userId: string, email?: string) {
  try {
    if (!userId) {
      return { success: false, kyc: null, error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      const user = await getUserById(userId);
      if (user && user._id) {
        mongoUserId = user._id;
      }
    } else if (email) {
      const user = await getUserByEmail(email);
      if (user && user._id) {
        mongoUserId = user._id;
      }
    } else {
      return { success: false, kyc: null, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, kyc: null, error: "User not found in database." };
    }

    const kycCollection = await getCollection<KycModel>(COLLECTIONS.KYC);
    const kycApplication = await kycCollection.findOne({ userId: mongoUserId });

    if (!kycApplication) {
      return { success: true, kyc: null, message: "No KYC application found" };
    }

    return {
      success: true,
      kyc: {
        _id: kycApplication._id?.toString(),
        status: kycApplication.status,
        submittedAt: kycApplication.submittedAt.toISOString(),
        reviewedAt: kycApplication.reviewedAt?.toISOString(),
        rejectionReason: kycApplication.rejectionReason,
      },
    };
  } catch (error) {
    console.error("Error getting KYC status:", error);
    return {
      success: false,
      kyc: null,
      error: error instanceof Error ? error.message : "Failed to get KYC status",
    };
  }
}

/**
 * Get user's firstName and lastName from KYC by userId
 * 
 * @param userId - User ID (can be localStorage ID or MongoDB ObjectId)
 * @param email - User's email (for lookup if userId is not ObjectId)
 * @returns firstName and lastName or null if not found
 */
export async function getKycUserInfo(userId: string, email?: string) {
  try {
    if (!userId) {
      return { success: false, firstName: null, lastName: null, error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      const user = await getUserById(userId);
      if (user && user._id) {
        mongoUserId = user._id;
      }
    } else if (email) {
      const user = await getUserByEmail(email);
      if (user && user._id) {
        mongoUserId = user._id;
      }
    } else {
      return { success: false, firstName: null, lastName: null, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, firstName: null, lastName: null, error: "User not found in database." };
    }

    const kycCollection = await getCollection<KycModel>(COLLECTIONS.KYC);
    const kycApplication = await kycCollection.findOne({ userId: mongoUserId });

    if (!kycApplication) {
      return { success: true, firstName: null, lastName: null, message: "No KYC application found" };
    }

    return {
      success: true,
      firstName: kycApplication.firstName,
      lastName: kycApplication.lastName,
    };
  } catch (error) {
    console.error("Error getting KYC user info:", error);
    return {
      success: false,
      firstName: null,
      lastName: null,
      error: error instanceof Error ? error.message : "Failed to get KYC user info",
    };
  }
}

