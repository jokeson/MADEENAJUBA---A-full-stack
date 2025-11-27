"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS, EventModel, InvoiceModel, TransactionModel } from "@/lib/db/models";
import { getWalletByUserId, getUserById, getUserByEmail } from "@/lib/db/utils";

// Helper function to get MongoDB user ID from localStorage user ID or email
const getMongoUserId = async (localStorageUserId: string, email?: string): Promise<ObjectId | null> => {
  try {
    // If userId is already a valid ObjectId, try to use it directly
    if (ObjectId.isValid(localStorageUserId)) {
      const existingUser = await getUserById(localStorageUserId);
      if (existingUser && existingUser._id) {
        return existingUser._id;
      }
    }

    // If userId is not a valid ObjectId, try to find user by email
    if (email) {
      const userByEmail = await getUserByEmail(email);
      if (userByEmail && userByEmail._id) {
        return userByEmail._id;
      }
    }

    // User doesn't exist in MongoDB
    return null;
  } catch (error) {
    console.error("Error getting MongoDB user ID:", error);
    return null;
  }
};

export interface DashboardStats {
  events: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    live: number;
  };
  invoices: {
    totalIssued: number;
    totalReceived: number;
    paidIssued: number;
    unpaidIssued: number;
    paidReceived: number;
    unpaidReceived: number;
  };
  wallet: {
    balance: number;
    walletId: string | null;
    status: string | null;
    transactionCount: number;
  };
  posts: {
    total: number;
  };
}

export async function getDashboardStats(userId: string, email?: string): Promise<{
  success: boolean;
  stats?: DashboardStats;
  error?: string;
}> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format" };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found" };
    }

    // Get Events Statistics
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const userEvents = await eventsCollection
      .find({ creatorUserId: mongoUserId })
      .toArray();

    const eventsStats = {
      total: userEvents.length,
      approved: userEvents.filter(e => e.status === "APPROVED").length,
      pending: userEvents.filter(e => e.status === "PENDING").length,
      rejected: userEvents.filter(e => e.status === "REJECTED").length,
      live: userEvents.filter(e => e.status === "LIVE").length,
    };

    // Get Invoices Statistics
    const invoicesCollection = await getCollection<InvoiceModel>(COLLECTIONS.INVOICES);
    const userWallet = await getWalletByUserId(mongoUserId);
    
    let invoicesStats = {
      totalIssued: 0,
      totalReceived: 0,
      paidIssued: 0,
      unpaidIssued: 0,
      paidReceived: 0,
      unpaidReceived: 0,
    };

    if (userWallet) {
      // Get issued invoices (created by user)
      const issuedInvoices = await invoicesCollection
        .find({ issuerUserId: mongoUserId })
        .toArray();

      // Get received invoices (sent to user's wallet)
      const receivedInvoices = await invoicesCollection
        .find({ recipientWalletId: userWallet.walletId })
        .toArray();

      invoicesStats = {
        totalIssued: issuedInvoices.length,
        totalReceived: receivedInvoices.length,
        paidIssued: issuedInvoices.filter(i => i.status === "paid").length,
        unpaidIssued: issuedInvoices.filter(i => i.status === "unpaid").length,
        paidReceived: receivedInvoices.filter(i => i.status === "paid").length,
        unpaidReceived: receivedInvoices.filter(i => i.status === "unpaid").length,
      };
    }

    // Get Wallet Statistics
    let walletStats = {
      balance: 0,
      walletId: null as string | null,
      status: null as string | null,
      transactionCount: 0,
    };

    if (userWallet) {
      const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
      const userTransactions = await transactionsCollection
        .find({ userId: mongoUserId })
        .toArray();

      walletStats = {
        balance: userWallet.balance / 100, // Convert cents to dollars
        walletId: userWallet.walletId,
        status: userWallet.status,
        transactionCount: userTransactions.length,
      };
    }

    // Get Posts/News Statistics (placeholder - adjust based on your news model)
    // For now, we'll set it to 0 if there's no news model
    const postsStats = {
      total: 0,
    };

    // Get Posts/News Statistics
    // Try to get news/posts if collection exists
    try {
      const newsCollection = await getCollection("news");
      const userPosts = await newsCollection
        .find({ authorId: mongoUserId })
        .toArray();
      postsStats.total = userPosts.length;
    } catch {
      // News collection might not exist, that's okay
      postsStats.total = 0;
    }

    return {
      success: true,
      stats: {
        events: eventsStats,
        invoices: invoicesStats,
        wallet: walletStats,
        posts: postsStats,
      },
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get dashboard statistics",
    };
  }
}

