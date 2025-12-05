"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS, ContactMessageModel, KycModel } from "@/lib/db/models";
import { getUserById } from "@/lib/db/utils";

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

