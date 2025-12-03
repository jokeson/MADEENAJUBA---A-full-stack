"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS, NotificationModel } from "@/lib/db/models";
import { getUserById } from "@/lib/db/utils";

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string) {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, notifications: [], error: "Invalid user ID" };
    }

    const notificationsCollection = await getCollection<NotificationModel>(
      COLLECTIONS.NOTIFICATIONS
    );

    const notifications = await notificationsCollection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 notifications
      .toArray();

    const formattedNotifications = notifications.map((notification) => ({
      id: notification._id?.toString() || "",
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read || false,
      link: notification.link,
      createdAt: notification.createdAt instanceof Date
        ? notification.createdAt.toISOString()
        : notification.createdAt,
      meta: notification.meta
        ? {
            transactionId: notification.meta.transactionId?.toString(),
            postId: notification.meta.postId?.toString(),
            eventId: notification.meta.eventId?.toString(),
            messageId: notification.meta.messageId?.toString(),
          }
        : undefined,
    }));

    return { success: true, notifications: formattedNotifications };
  } catch (error) {
    console.error("Error getting user notifications:", error);
    return {
      success: false,
      notifications: [],
      error: error instanceof Error ? error.message : "Failed to get notifications",
    };
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, count: 0, error: "Invalid user ID" };
    }

    const notificationsCollection = await getCollection<NotificationModel>(
      COLLECTIONS.NOTIFICATIONS
    );

    const count = await notificationsCollection.countDocuments({
      userId: new ObjectId(userId),
      read: false,
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Failed to get notification count",
    };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    if (!notificationId || !ObjectId.isValid(notificationId)) {
      return { success: false, error: "Invalid notification ID" };
    }

    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    const notificationsCollection = await getCollection<NotificationModel>(
      COLLECTIONS.NOTIFICATIONS
    );

    const result = await notificationsCollection.updateOne(
      {
        _id: new ObjectId(notificationId),
        userId: new ObjectId(userId), // Ensure user owns the notification
      },
      {
        $set: { read: true },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Notification not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark notification as read",
    };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    const notificationsCollection = await getCollection<NotificationModel>(
      COLLECTIONS.NOTIFICATIONS
    );

    await notificationsCollection.updateMany(
      {
        userId: new ObjectId(userId),
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark all notifications as read",
    };
  }
}

/**
 * Create a notification (internal function)
 */
export async function createNotification(data: {
  userId: string;
  type: "transaction" | "post" | "event_approval" | "message";
  title: string;
  message: string;
  link?: string;
  meta?: {
    transactionId?: string;
    postId?: string;
    eventId?: string;
    messageId?: string;
  };
}) {
  try {
    if (!data.userId || !ObjectId.isValid(data.userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    const notificationsCollection = await getCollection<NotificationModel>(
      COLLECTIONS.NOTIFICATIONS
    );

    const notification: NotificationModel = {
      userId: new ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      link: data.link,
      meta: data.meta
        ? {
            transactionId: data.meta.transactionId
              ? new ObjectId(data.meta.transactionId)
              : undefined,
            postId: data.meta.postId ? new ObjectId(data.meta.postId) : undefined,
            eventId: data.meta.eventId ? new ObjectId(data.meta.eventId) : undefined,
            messageId: data.meta.messageId ? new ObjectId(data.meta.messageId) : undefined,
          }
        : undefined,
      createdAt: new Date(),
    };

    await notificationsCollection.insertOne(notification);

    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    };
  }
}

