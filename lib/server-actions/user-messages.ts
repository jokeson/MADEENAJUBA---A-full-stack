"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS, UserMessageModel } from "@/lib/db/models";
import { getUserById } from "@/lib/db/utils";
import { createNotification } from "./notifications";

/**
 * Send a message from admin to a user
 */
export async function sendMessageToUser(data: {
  userId: string;
  senderId?: string; // Admin user ID
  senderEmail?: string; // Admin email
  subject: string;
  message: string;
}) {
  try {
    // Validate inputs
    if (!data.userId || !ObjectId.isValid(data.userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    if (!data.subject || !data.subject.trim()) {
      return { success: false, error: "Subject is required" };
    }

    if (!data.message || !data.message.trim()) {
      return { success: false, error: "Message is required" };
    }

    // Verify user exists
    const user = await getUserById(data.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get sender info if provided
    let senderId: ObjectId | undefined = undefined;
    let senderEmail = data.senderEmail || "Admin";

    if (data.senderId && ObjectId.isValid(data.senderId)) {
      const sender = await getUserById(data.senderId);
      if (sender) {
        senderId = sender._id;
        senderEmail = sender.email || senderEmail;
      }
    }

    // Create message
    const userMessage: Omit<UserMessageModel, "_id"> = {
      userId: user._id!,
      senderId,
      senderEmail,
      subject: data.subject.trim(),
      message: data.message.trim(),
      read: false,
      deletedByUser: false,
      deletedByAdmin: false,
      createdAt: new Date(),
    };

    const messagesCollection = await getCollection<UserMessageModel>(
      COLLECTIONS.USER_MESSAGES
    );
    const result = await messagesCollection.insertOne(userMessage);

    if (result.insertedId) {
      // Create notification for the user
      await createNotification({
        userId: data.userId,
        type: "message",
        title: "New Message",
        message: data.subject,
        link: "/messages",
        meta: {
          messageId: result.insertedId.toString(),
        },
      });

      return {
        success: true,
        messageId: result.insertedId.toString(),
        message: "Message sent successfully",
      };
    } else {
      return { success: false, error: "Failed to send message" };
    }
  } catch (error) {
    console.error("Error sending message to user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}

/**
 * Check if user has any messages (for sidebar visibility)
 */
export async function userHasMessages(userId: string): Promise<{
  success: boolean;
  hasMessages: boolean;
  unreadCount: number;
}> {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, hasMessages: false, unreadCount: 0 };
    }

    const user = await getUserById(userId);
    if (!user || !user._id) {
      return { success: false, hasMessages: false, unreadCount: 0 };
    }

    const messagesCollection = await getCollection<UserMessageModel>(
      COLLECTIONS.USER_MESSAGES
    );

    // Count total messages (not deleted by user)
    const totalCount = await messagesCollection.countDocuments({
      userId: user._id,
      deletedByUser: false,
    });

    // Count unread messages
    const unreadCount = await messagesCollection.countDocuments({
      userId: user._id,
      deletedByUser: false,
      read: false,
    });

    return {
      success: true,
      hasMessages: totalCount > 0,
      unreadCount,
    };
  } catch (error) {
    console.error("Error checking user messages:", error);
    return {
      success: false,
      hasMessages: false,
      unreadCount: 0,
    };
  }
}

/**
 * Get all messages for a user
 */
export async function getUserMessages(userId: string) {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, messages: [], error: "Invalid user ID" };
    }

    const user = await getUserById(userId);
    if (!user || !user._id) {
      return { success: false, messages: [], error: "User not found" };
    }

    const messagesCollection = await getCollection<UserMessageModel>(
      COLLECTIONS.USER_MESSAGES
    );

    const messages = await messagesCollection
      .find({
        userId: user._id,
        deletedByUser: false, // Only get messages not deleted by user
      })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id?.toString() || "",
        userId: msg.userId.toString(),
        senderId: msg.senderId?.toString(),
        senderEmail: msg.senderEmail || "Admin",
        subject: msg.subject,
        message: msg.message,
        read: msg.read || false,
        readAt: msg.readAt?.toISOString(),
        createdAt: msg.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting user messages:", error);
    return {
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : "Failed to get messages",
    };
  }
}

/**
 * Get all messages (Admin only - for viewing all sent messages)
 */
export async function getAllUserMessages() {
  try {
    const messagesCollection = await getCollection<UserMessageModel>(
      COLLECTIONS.USER_MESSAGES
    );

    const messages = await messagesCollection
      .find({
        deletedByAdmin: false, // Only get messages not deleted by admin
      })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id?.toString() || "",
        userId: msg.userId.toString(),
        senderId: msg.senderId?.toString(),
        senderEmail: msg.senderEmail || "Admin",
        subject: msg.subject,
        message: msg.message,
        read: msg.read || false,
        readAt: msg.readAt?.toISOString(),
        deletedByUser: msg.deletedByUser || false,
        createdAt: msg.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting all user messages:", error);
    return {
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : "Failed to get messages",
    };
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string, userId: string) {
  try {
    if (!messageId || !ObjectId.isValid(messageId)) {
      return { success: false, error: "Invalid message ID" };
    }

    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    const user = await getUserById(userId);
    if (!user || !user._id) {
      return { success: false, error: "User not found" };
    }

    const messagesCollection = await getCollection<UserMessageModel>(
      COLLECTIONS.USER_MESSAGES
    );

    const result = await messagesCollection.updateOne(
      {
        _id: new ObjectId(messageId),
        userId: user._id,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Message not found" };
    }

    return { success: true, message: "Message marked as read" };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark message as read",
    };
  }
}

/**
 * Delete message (by user)
 */
export async function deleteMessageByUser(messageId: string, userId: string) {
  try {
    if (!messageId || !ObjectId.isValid(messageId)) {
      return { success: false, error: "Invalid message ID" };
    }

    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    const user = await getUserById(userId);
    if (!user || !user._id) {
      return { success: false, error: "User not found" };
    }

    const messagesCollection = await getCollection<UserMessageModel>(
      COLLECTIONS.USER_MESSAGES
    );

    const result = await messagesCollection.updateOne(
      {
        _id: new ObjectId(messageId),
        userId: user._id,
      },
      {
        $set: {
          deletedByUser: true,
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Message not found" };
    }

    return { success: true, message: "Message deleted successfully" };
  } catch (error) {
    console.error("Error deleting message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete message",
    };
  }
}

/**
 * Delete message (by admin)
 */
export async function deleteMessageByAdmin(messageId: string) {
  try {
    if (!messageId || !ObjectId.isValid(messageId)) {
      return { success: false, error: "Invalid message ID" };
    }

    const messagesCollection = await getCollection<UserMessageModel>(
      COLLECTIONS.USER_MESSAGES
    );

    const result = await messagesCollection.updateOne(
      {
        _id: new ObjectId(messageId),
      },
      {
        $set: {
          deletedByAdmin: true,
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Message not found" };
    }

    return { success: true, message: "Message deleted successfully" };
  } catch (error) {
    console.error("Error deleting message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete message",
    };
  }
}
