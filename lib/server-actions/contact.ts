"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS, ContactMessageModel, KycModel, UserModel } from "@/lib/db/models";
import { getUserById } from "@/lib/db/utils";
import { createNotification } from "./notifications";

/**
 * Get user contact information (email and phone) if authenticated
 */
export async function getUserContactInfo(userId: string) {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, email: null, phone: null };
    }

    // Get user email
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, email: null, phone: null };
    }

    const email = user.email || null;

    // Get user phone from KYC
    const kycCollection = await getCollection<KycModel>(COLLECTIONS.KYC);
    const kyc = await kycCollection.findOne({ userId: user._id });

    const phone = kyc?.phone || null;

    return {
      success: true,
      email,
      phone,
    };
  } catch (error) {
    console.error("Error getting user contact info:", error);
    return {
      success: false,
      email: null,
      phone: null,
      error: error instanceof Error ? error.message : "Failed to get user contact info",
    };
  }
}

/**
 * Submit a contact message
 * Works for both authenticated and non-authenticated users
 */
export async function submitContactMessage(data: {
  userId?: string; // Optional - only if user is authenticated
  email: string;
  phone?: string; // Optional
  subject: string;
  message: string;
}) {
  try {
    // Validate required fields
    if (!data.email || !data.email.trim()) {
      return { success: false, error: "Email is required" };
    }

    if (!data.subject || !data.subject.trim()) {
      return { success: false, error: "Subject is required" };
    }

    if (!data.message || !data.message.trim()) {
      return { success: false, error: "Message is required" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return { success: false, error: "Please enter a valid email address" };
    }

    // Get MongoDB user ID if authenticated
    let mongoUserId: ObjectId | undefined = undefined;
    if (data.userId && ObjectId.isValid(data.userId)) {
      const user = await getUserById(data.userId);
      if (user && user._id) {
        mongoUserId = user._id;
      }
    }

    // Create contact message
    const contactMessage: Omit<ContactMessageModel, "_id"> = {
      userId: mongoUserId,
      email: data.email.trim(),
      phone: data.phone?.trim() || undefined,
      subject: data.subject.trim(),
      message: data.message.trim(),
      status: "new",
      createdAt: new Date(),
    };

    const contactCollection = await getCollection<ContactMessageModel>(
      COLLECTIONS.CONTACT_MESSAGES
    );
    const result = await contactCollection.insertOne(contactMessage);

    if (result.insertedId) {
      // Notify all admin users about the new contact message
      try {
        const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
        const adminUsers = await usersCollection
          .find({ role: "admin" })
          .toArray();

        // Create notifications for all admins
        const notificationPromises = adminUsers.map((admin) => {
          if (admin._id) {
            return createNotification({
              userId: admin._id.toString(),
              type: "contact_message",
              title: "New Contact Message",
              message: `New message from ${data.email}: ${data.subject}`,
              link: "/admin?tab=messages",
              meta: {
                contactMessageId: result.insertedId.toString(),
              },
            });
          }
          return Promise.resolve({ success: false });
        });

        // Send notifications in parallel (don't wait for them to complete)
        Promise.all(notificationPromises).catch((err) => {
          console.error("Error creating notifications for admins:", err);
          // Don't fail the contact message submission if notifications fail
        });
      } catch (err) {
        console.error("Error notifying admins:", err);
        // Don't fail the contact message submission if notifications fail
      }

      return {
        success: true,
        messageId: result.insertedId.toString(),
        message: "Your message has been sent successfully! We'll get back to you soon.",
      };
    } else {
      return { success: false, error: "Failed to send message. Please try again." };
    }
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message. Please try again.",
    };
  }
}

/**
 * Get all contact messages (Admin only)
 */
export async function getAllContactMessages() {
  try {
    const contactCollection = await getCollection<ContactMessageModel>(
      COLLECTIONS.CONTACT_MESSAGES
    );
    const messages = await contactCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return {
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id?.toString() || "",
        userId: msg.userId?.toString(),
        email: msg.email,
        phone: msg.phone || "",
        subject: msg.subject,
        message: msg.message,
        status: msg.status,
        readAt: msg.readAt?.toISOString(),
        readBy: msg.readBy?.toString(),
        repliedAt: msg.repliedAt?.toISOString(),
        repliedBy: msg.repliedBy?.toString(),
        createdAt: msg.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting contact messages:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get contact messages",
      messages: [],
    };
  }
}

/**
 * Update contact message status (Admin only)
 */
export async function updateMessageStatus(
  messageId: string,
  status: "read" | "replied" | "archived",
  adminUserId?: string
) {
  try {
    if (!messageId || !ObjectId.isValid(messageId)) {
      return { success: false, error: "Invalid message ID" };
    }

    const contactCollection = await getCollection<ContactMessageModel>(
      COLLECTIONS.CONTACT_MESSAGES
    );

    const updateData: Partial<ContactMessageModel> = {
      status,
    };

    // Set readAt and readBy if marking as read or replied
    if (status === "read" || status === "replied") {
      updateData.readAt = new Date();
      if (adminUserId && ObjectId.isValid(adminUserId)) {
        updateData.readBy = new ObjectId(adminUserId);
      }
    }

    // Set repliedAt and repliedBy if marking as replied
    if (status === "replied") {
      updateData.repliedAt = new Date();
      if (adminUserId && ObjectId.isValid(adminUserId)) {
        updateData.repliedBy = new ObjectId(adminUserId);
      }
    }

    const result = await contactCollection.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Message not found" };
    }

    return {
      success: true,
      message: `Message marked as ${status}`,
    };
  } catch (error) {
    console.error("Error updating message status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update message status",
    };
  }
}

/**
 * Delete contact message (Admin only)
 */
export async function deleteContactMessage(messageId: string) {
  try {
    if (!messageId || !ObjectId.isValid(messageId)) {
      return { success: false, error: "Invalid message ID" };
    }

    const contactCollection = await getCollection<ContactMessageModel>(
      COLLECTIONS.CONTACT_MESSAGES
    );

    const result = await contactCollection.deleteOne({
      _id: new ObjectId(messageId),
    });

    if (result.deletedCount === 0) {
      return { success: false, error: "Message not found" };
    }

    return {
      success: true,
      message: "Message deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting contact message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete message",
    };
  }
}

