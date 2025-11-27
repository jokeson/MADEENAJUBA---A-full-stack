"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS, SystemSettingsModel } from "@/lib/db/models";
import { UserModel } from "@/lib/db/models";

/**
 * Get system settings
 * Returns the current system settings or creates default settings if none exist
 */
export async function getSystemSettings() {
  try {
    const settingsCollection = await getCollection<SystemSettingsModel>(
      COLLECTIONS.SYSTEM_SETTINGS
    );

    // Try to get existing settings
    let settings = await settingsCollection.findOne({});

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings: SystemSettingsModel = {
        p2pFeePercentage: 5,
        ticketFeePercentage: 10,
        invoiceFeePercentage: 5,
        withdrawalFeePercentage: 5,
        maintenanceMode: false,
        maintenanceMessage: "The website is currently under maintenance. Please check back later.",
        maxBalanceForDeletion: 0, // Default: 0 cents (balance must be 0 or less)
        currency: "SSP", // Default: South Sudanese Pound
        heroHeadline: "Time is money.\nSave both.",
        heroSubheadline: "Easy-to-use corporate cards, bill payments, accounting, and a whole lot more. All in one place.",
        heroBackgroundImageUrl: "",
        updatedAt: new Date(),
      };

      const result = await settingsCollection.insertOne(defaultSettings);
      settings = { ...defaultSettings, _id: result.insertedId };
    }

    return {
      success: true,
      settings: {
        p2pFeePercentage: settings.p2pFeePercentage,
        ticketFeePercentage: settings.ticketFeePercentage,
        invoiceFeePercentage: settings.invoiceFeePercentage,
        withdrawalFeePercentage: settings.withdrawalFeePercentage,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage || "The website is currently under maintenance. Please check back later.",
        maxBalanceForDeletion: settings.maxBalanceForDeletion ?? 0,
        currency: settings.currency || "SSP",
        heroHeadline: settings.heroHeadline || "Time is money.\nSave both.",
        heroSubheadline: settings.heroSubheadline || "Easy-to-use corporate cards, bill payments, accounting, and a whole lot more. All in one place.",
        heroBackgroundImageUrl: settings.heroBackgroundImageUrl || "",
      },
    };
  } catch (error) {
    console.error("Error getting system settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get system settings",
    };
  }
}

/**
 * Update system settings (Admin only)
 */
export async function updateSystemSettings(
  adminUserId: string,
  updates: {
    p2pFeePercentage?: number;
    ticketFeePercentage?: number;
    invoiceFeePercentage?: number;
    withdrawalFeePercentage?: number;
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    maxBalanceForDeletion?: number;
    currency?: string;
    heroHeadline?: string;
    heroSubheadline?: string;
    heroBackgroundImageUrl?: string;
  }
) {
  try {
    if (!ObjectId.isValid(adminUserId)) {
      return { success: false, error: "Invalid admin user ID" };
    }

    // Verify admin role
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const admin = await usersCollection.findOne({ _id: new ObjectId(adminUserId) });

    if (!admin || admin.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate fee percentages (must be between 0 and 100)
    if (updates.p2pFeePercentage !== undefined) {
      if (updates.p2pFeePercentage < 0 || updates.p2pFeePercentage > 100) {
        return { success: false, error: "P2P fee percentage must be between 0 and 100" };
      }
    }

    if (updates.ticketFeePercentage !== undefined) {
      if (updates.ticketFeePercentage < 0 || updates.ticketFeePercentage > 100) {
        return { success: false, error: "Ticket fee percentage must be between 0 and 100" };
      }
    }

    if (updates.invoiceFeePercentage !== undefined) {
      if (updates.invoiceFeePercentage < 0 || updates.invoiceFeePercentage > 100) {
        return { success: false, error: "Invoice fee percentage must be between 0 and 100" };
      }
    }

    if (updates.withdrawalFeePercentage !== undefined) {
      if (updates.withdrawalFeePercentage < 0 || updates.withdrawalFeePercentage > 100) {
        return { success: false, error: "Withdrawal fee percentage must be between 0 and 100" };
      }
    }

    if (updates.maxBalanceForDeletion !== undefined) {
      if (updates.maxBalanceForDeletion < 0) {
        return { success: false, error: "Maximum balance for deletion cannot be negative" };
      }
    }

    if (updates.currency !== undefined) {
      if (!updates.currency || updates.currency.trim().length === 0) {
        return { success: false, error: "Currency code cannot be empty" };
      }
      if (updates.currency.length > 10) {
        return { success: false, error: "Currency code must be 10 characters or less" };
      }
    }

    if (updates.heroHeadline !== undefined && updates.heroHeadline.length > 500) {
      return { success: false, error: "Hero headline must be 500 characters or less" };
    }

    if (updates.heroSubheadline !== undefined && updates.heroSubheadline.length > 1000) {
      return { success: false, error: "Hero subheadline must be 1000 characters or less" };
    }

    if (updates.heroBackgroundImageUrl !== undefined && updates.heroBackgroundImageUrl.length > 500) {
      return { success: false, error: "Hero background image URL must be 500 characters or less" };
    }

    const settingsCollection = await getCollection<SystemSettingsModel>(
      COLLECTIONS.SYSTEM_SETTINGS
    );

    // Get existing settings or create default
    let existingSettings = await settingsCollection.findOne({});

    const updateData: Partial<SystemSettingsModel> = {
      updatedAt: new Date(),
      updatedBy: new ObjectId(adminUserId),
    };

    // Only update fields that are provided
    if (updates.p2pFeePercentage !== undefined) {
      updateData.p2pFeePercentage = updates.p2pFeePercentage;
    }
    if (updates.ticketFeePercentage !== undefined) {
      updateData.ticketFeePercentage = updates.ticketFeePercentage;
    }
    if (updates.invoiceFeePercentage !== undefined) {
      updateData.invoiceFeePercentage = updates.invoiceFeePercentage;
    }
    if (updates.withdrawalFeePercentage !== undefined) {
      updateData.withdrawalFeePercentage = updates.withdrawalFeePercentage;
    }
    if (updates.maintenanceMode !== undefined) {
      updateData.maintenanceMode = updates.maintenanceMode;
    }
    if (updates.maintenanceMessage !== undefined) {
      updateData.maintenanceMessage = updates.maintenanceMessage;
    }
    if (updates.maxBalanceForDeletion !== undefined) {
      updateData.maxBalanceForDeletion = updates.maxBalanceForDeletion;
    }
    if (updates.currency !== undefined) {
      updateData.currency = updates.currency.trim().toUpperCase();
    }
    if (updates.heroHeadline !== undefined) {
      updateData.heroHeadline = updates.heroHeadline.trim();
    }
    if (updates.heroSubheadline !== undefined) {
      updateData.heroSubheadline = updates.heroSubheadline.trim();
    }
    if (updates.heroBackgroundImageUrl !== undefined) {
      updateData.heroBackgroundImageUrl = updates.heroBackgroundImageUrl.trim();
    }

    if (existingSettings) {
      // Update existing settings
      await settingsCollection.updateOne(
        { _id: existingSettings._id },
        { $set: updateData }
      );
    } else {
      // Create new settings with defaults
      const defaultSettings: SystemSettingsModel = {
        p2pFeePercentage: updates.p2pFeePercentage ?? 5,
        ticketFeePercentage: updates.ticketFeePercentage ?? 10,
        invoiceFeePercentage: updates.invoiceFeePercentage ?? 5,
        withdrawalFeePercentage: updates.withdrawalFeePercentage ?? 5,
        maintenanceMode: updates.maintenanceMode ?? false,
        maintenanceMessage: updates.maintenanceMessage || "The website is currently under maintenance. Please check back later.",
        maxBalanceForDeletion: updates.maxBalanceForDeletion ?? 0,
        currency: updates.currency ? updates.currency.trim().toUpperCase() : "SSP",
        heroHeadline: updates.heroHeadline || "Time is money.\nSave both.",
        heroSubheadline: updates.heroSubheadline || "Easy-to-use corporate cards, bill payments, accounting, and a whole lot more. All in one place.",
        heroBackgroundImageUrl: updates.heroBackgroundImageUrl || "",
        updatedAt: new Date(),
        updatedBy: new ObjectId(adminUserId),
      };
      await settingsCollection.insertOne(defaultSettings);
    }

    return {
      success: true,
      message: "System settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating system settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update system settings",
    };
  }
}

