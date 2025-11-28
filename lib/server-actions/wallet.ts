"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import {
  getWalletByUserId,
  getWalletByWalletId,
  createWallet,
  updateWalletBalance,
  getUserById,
  getUserByEmail,
} from "@/lib/db/utils";
import { COLLECTIONS } from "@/lib/db/models";
import type { TransactionModel, RedeemCodeModel, PendingWithdrawalModel, WalletModel, FeeModel, KycModel } from "@/lib/db/models";

// Helper function to generate wallet ID (3 letters + 3 digits format, e.g., VXE445)
const generateWalletId = (): string => {
  // Generate 3 random uppercase letters
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetters = Array.from({ length: 3 }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join("");
  
  // Generate 3 random digits
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  
  return `${randomLetters}${randomDigits}`;
};

// Helper function to generate reference number (6 digits)
const generateReferenceNumber = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to get MongoDB user ID from localStorage user ID or email
// This bridges the gap between localStorage auth and MongoDB
export const getMongoUserId = async (localStorageUserId: string, email?: string): Promise<ObjectId | null> => {
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

// Server actions for wallet operations
// Note: userId parameter is required since auth is currently client-side
// TODO: Refactor to use server-side session management when auth is migrated

export async function sendMoney(
  userId: string,
  recipientWalletId: string,
  amount: number,
  note?: string,
  email?: string
) {
  try {
    // ===== STEP 1: Basic Input Validation =====
    if (!userId || !recipientWalletId) {
      return { success: false, error: "User ID and recipient Wallet ID are required" };
    }

    // Validate recipient wallet ID format (3 letters + 3 digits)
    const walletIdPattern = /^[A-Z]{3}\d{3}$/i;
    const normalizedWalletId = recipientWalletId.trim().toUpperCase();
    if (!walletIdPattern.test(normalizedWalletId)) {
      return { success: false, error: "Invalid Wallet ID format. Please enter a valid Wallet ID (e.g., VXE445)" };
    }

    // ===== STEP 2: Validate Amount =====
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    // Convert amount from dollars to cents
    const amountCents = Math.round(amount * 100);
    if (amountCents <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    // ===== STEP 3: Get and Validate Sender =====
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found in database. Please sign up or contact support." };
    }

    // Get sender wallet
    const senderWallet = await getWalletByUserId(mongoUserId);
    if (!senderWallet) {
      return { success: false, error: "Sender wallet not found. Please complete KYC approval first." };
    }

    // Check sender wallet status
    if (senderWallet.status !== "active") {
      return { success: false, error: `Your wallet is ${senderWallet.status}. Transactions are not allowed.` };
    }

    // ===== STEP 4: Double-Check Recipient Wallet Exists =====
    // First check using utility function
    let recipientWallet = await getWalletByWalletId(normalizedWalletId);
    
    // Second check - direct database query for verification
    if (!recipientWallet) {
      const walletsCollection = await getCollection<WalletModel>(COLLECTIONS.WALLETS);
      recipientWallet = await walletsCollection.findOne({ 
        walletId: normalizedWalletId 
      });
    }

    // Final validation - recipient wallet must exist
    if (!recipientWallet) {
      return { 
        success: false, 
        error: `Recipient Wallet ID "${normalizedWalletId}" does not exist. Please verify the Wallet ID and try again.` 
      };
    }

    // ===== STEP 5: Validate Recipient Wallet Status =====
    if (recipientWallet.status !== "active") {
      return { 
        success: false, 
        error: `Recipient wallet is ${recipientWallet.status}. Cannot send money to this wallet.` 
      };
    }

    // ===== STEP 6: Prevent Self-Transactions =====
    if (senderWallet.walletId === normalizedWalletId) {
      return { success: false, error: "Cannot send money to yourself" };
    }

    // ===== STEP 7: Final Recipient Wallet Verification Before Transaction =====
    // Re-verify recipient wallet one more time before processing transaction
    const finalRecipientCheck = await getWalletByWalletId(normalizedWalletId);
    if (!finalRecipientCheck || finalRecipientCheck.status !== "active") {
      return { 
        success: false, 
        error: `Recipient Wallet ID "${normalizedWalletId}" is not available for transactions. Please verify and try again.` 
      };
    }

    // Ensure we're using the most up-to-date recipient wallet data
    recipientWallet = finalRecipientCheck;

    // ===== STEP 8: Check if sender is admin and Calculate Fees =====
    // Get sender user to check if admin (admin accounts are exempt from fees)
    const { getUserById } = await import("@/lib/db/utils");
    const senderUser = await getUserById(mongoUserId);
    const isAdmin = senderUser?.role === "admin";
    
    // Get P2P fee percentage from system settings
    const { getSystemSettings } = await import("./system-settings");
    const settingsResult = await getSystemSettings();
    const p2pFeePercentage = settingsResult.success && settingsResult.settings
      ? settingsResult.settings.p2pFeePercentage
      : 5; // Default to 5% if settings not available
    
    // Calculate system fee (in cents) using dynamic percentage
    // Admin accounts are exempt from fees
    const feeCents = isAdmin ? 0 : Math.round(amountCents * (p2pFeePercentage / 100));
    const totalDeduction = amountCents + feeCents;

    // Check sufficient balance (amount + fee) - both in cents
    if (senderWallet.balance < totalDeduction) {
      return { success: false, error: `Insufficient balance (including ${p2pFeePercentage}% system fee)` };
    }

    // ===== STEP 9: Process Transaction =====
    // Generate reference number
    const ref = generateReferenceNumber();

    // Update balances (all amounts in cents)
    await updateWalletBalance(mongoUserId, totalDeduction, "subtract");
    await updateWalletBalance(recipientWallet.userId, amountCents, "add");

    // Create transactions
    const transactionsCollection = await getCollection<TransactionModel>(
      COLLECTIONS.TRANSACTIONS
    );

    const senderTransaction: TransactionModel = {
      userId: mongoUserId,
      type: "send",
      amount: amountCents, // Store in cents
      feeCents: feeCents,
      fromWalletId: senderWallet.walletId,
      toWalletId: normalizedWalletId,
      note: note,
      ref: ref,
      status: "success",
      createdAt: new Date(),
    };

    const recipientTransaction: TransactionModel = {
      userId: recipientWallet.userId,
      type: "receive",
      amount: amountCents, // Store in cents
      fromWalletId: senderWallet.walletId,
      toWalletId: normalizedWalletId,
      note: note,
      ref: ref,
      status: "success",
      createdAt: new Date(),
    };

    await transactionsCollection.insertOne(senderTransaction);
    await transactionsCollection.insertOne(recipientTransaction);

    // Only record fee transaction and fee ledger if fee is greater than 0 (admin accounts are exempt)
    if (feeCents > 0) {
    // Fee transaction for Admin ledger
    const feeTransaction: TransactionModel = {
      type: "fee",
      amount: feeCents,
      feeCents: feeCents,
      fromWalletId: senderWallet.walletId,
      toWalletId: normalizedWalletId,
      ref: ref,
      status: "success",
      createdAt: new Date(),
    };
    await transactionsCollection.insertOne(feeTransaction);

    // Record fee in fee ledger
    const feesCollection = await getCollection<FeeModel>(COLLECTIONS.FEES);
    const feeRecord: FeeModel = {
      type: "transaction",
      amount: feeCents,
      percentage: p2pFeePercentage,
      transactionId: senderTransaction._id,
      createdAt: new Date(),
    };
    await feesCollection.insertOne(feeRecord);
    }

    return { success: true, message: "Money sent successfully", ref: ref };
  } catch (error) {
    console.error("Error sending money:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send money",
    };
  }
}

export async function redeemCode(userId: string, code: string, pin: string, email?: string) {
  try {
    // Validate inputs
    if (!userId || !code || !pin) {
      return { success: false, error: "User ID, code, and PIN are required" };
    }

    // Get MongoDB user ID (handles both ObjectId and email lookup)
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found in database. Please sign up or contact support." };
    }

    // Get wallet
    const wallet = await getWalletByUserId(mongoUserId);
    if (!wallet) {
      return { success: false, error: "Wallet not found. Please complete KYC approval first." };
    }

    // Check wallet status
    if (wallet.status !== "active") {
      return { success: false, error: `Wallet is ${wallet.status}. Deposits are not allowed.` };
    }

    // Find redeem code
    const redeemCodesCollection = await getCollection<RedeemCodeModel>(
      COLLECTIONS.REDEEM_CODES
    );

    const redeemCode = await redeemCodesCollection.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!redeemCode) {
      return { success: false, error: "Invalid redeem code" };
    }

    // Validate PIN
    if (redeemCode.pin !== pin) {
      return { success: false, error: "Invalid PIN" };
    }

    if (redeemCode.used) {
      return { success: false, error: "Redeem code has already been used" };
    }

    // Check expiration
    if (redeemCode.expiresAt && redeemCode.expiresAt < new Date()) {
      return { success: false, error: "Redeem code has expired" };
    }

    // Update redeem code as used
    await redeemCodesCollection.updateOne(
      { _id: redeemCode._id },
      {
        $set: {
          used: true,
          usedBy: mongoUserId,
          usedByWalletId: wallet.walletId,
          usedAt: new Date(),
        },
      }
    );

    // Add amount to wallet
    await updateWalletBalance(mongoUserId, redeemCode.amount, "add");

    // Create transaction
    const transactionsCollection = await getCollection<TransactionModel>(
      COLLECTIONS.TRANSACTIONS
    );

    const transaction: TransactionModel = {
      userId: mongoUserId,
      type: "deposit",
      amount: redeemCode.amount,
      status: "success",
      meta: {
        redeemId: redeemCode._id,
      },
      createdAt: new Date(),
    };

    await transactionsCollection.insertOne(transaction);

    return {
      success: true,
      message: `Successfully redeemed ${(redeemCode.amount / 100).toFixed(2)}`,
      amount: redeemCode.amount,
    };
  } catch (error) {
    console.error("Error redeeming code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to redeem code",
    };
  }
}

export async function requestCash(userId: string, amount: number, email?: string) {
  try {
    // Validate inputs
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Get MongoDB user ID (handles both ObjectId and email lookup)
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found in database. Please sign up or contact support." };
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    // Get wallet
    const wallet = await getWalletByUserId(mongoUserId);
    if (!wallet) {
      return { success: false, error: "Wallet not found. Please complete KYC approval first." };
    }

    // Check wallet status
    if (wallet.status !== "active") {
      return { success: false, error: `Wallet is ${wallet.status}. Cash requests are not allowed.` };
    }

    // Convert amount to cents
    const amountCents = Math.round(amount * 100);

    // Check sufficient balance
    if (wallet.balance < amountCents) {
      return { success: false, error: "Insufficient funds" };
    }

    // Generate reference number
    const ref = generateReferenceNumber();

    // Create pending withdrawal (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const pendingWithdrawalsCollection = await getCollection<PendingWithdrawalModel>(
      COLLECTIONS.PENDING_WITHDRAWALS
    );

    const pendingWithdrawal: PendingWithdrawalModel = {
      userId: mongoUserId,
      walletId: wallet.walletId,
      amount: amountCents,
      ref: ref,
      status: "pending",
      expiresAt: expiresAt,
      createdAt: new Date(),
    };

    const result = await pendingWithdrawalsCollection.insertOne(pendingWithdrawal);

    // Deduct amount from wallet (moves to pending pool)
    await updateWalletBalance(mongoUserId, amountCents, "subtract");

    // Create transaction record
    const transactionsCollection = await getCollection<TransactionModel>(
      COLLECTIONS.TRANSACTIONS
    );

    const transaction: TransactionModel = {
      userId: mongoUserId,
      type: "cash_payout",
      amount: amountCents,
      fromWalletId: wallet.walletId,
      ref: ref,
      status: "pending",
      createdAt: new Date(),
    };

    await transactionsCollection.insertOne(transaction);

    return {
      success: true,
      message: "Cash request submitted successfully",
      ref: ref,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error("Error requesting cash:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to request cash",
    };
  }
}

export async function getBalance(userId: string, email?: string) {
  try {
    // Validate inputs
    if (!userId) {
      return { success: false, balance: 0, error: "User ID is required" };
    }

    // Get MongoDB user ID (handles both ObjectId and email lookup)
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return {
        success: false,
        balance: 0,
        error: "Invalid user ID format. Please provide email or sign in again.",
      };
    }

    if (!mongoUserId) {
      return {
        success: false,
        balance: 0,
        error: "User not found in database. Please sign up or contact support.",
      };
    }

    // Get wallet
    const wallet = await getWalletByUserId(mongoUserId);

    // Wallet should only exist after KYC approval
    if (!wallet) {
      return {
        success: false,
        balance: 0,
        error: "Wallet not found. Please complete KYC application and wait for admin approval.",
      };
    }

    // Check if wallet is suspended
    if (wallet.status === "suspended") {
      return {
        success: false,
        balance: wallet.balance / 100, // Still return balance for display
        balanceCents: wallet.balance,
        walletId: wallet.walletId,
        status: wallet.status,
        error: "suspended", // Special error code for suspended wallets
      };
    }

    // Check if wallet is terminated
    if (wallet.status === "terminated") {
      return {
        success: false,
        balance: 0,
        balanceCents: 0,
        walletId: wallet.walletId,
        status: wallet.status,
        error: "terminated", // Special error code for terminated wallets
      };
    }

    return {
      success: true,
      balance: wallet.balance / 100, // Convert cents to dollars for display
      balanceCents: wallet.balance, // Also return raw cents for reference
      walletId: wallet.walletId,
      status: wallet.status,
    };
  } catch (error) {
    console.error("Error getting balance:", error);
    return {
      success: false,
      balance: 0,
      error: error instanceof Error ? error.message : "Failed to get balance",
    };
  }
}

export async function getTransactions(userId: string, email?: string) {
  try {
    // Validate inputs
    if (!userId) {
      return { success: false, transactions: [], error: "User ID is required" };
    }

    // Get MongoDB user ID (handles both ObjectId and email lookup)
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return {
        success: false,
        transactions: [],
        error: "Invalid user ID format. Please provide email or sign in again.",
      };
    }

    if (!mongoUserId) {
      return {
        success: false,
        transactions: [],
        error: "User not found in database. Please sign up or contact support.",
      };
    }

    // Get transactions
    const transactionsCollection = await getCollection<TransactionModel>(
      COLLECTIONS.TRANSACTIONS
    );

    const transactions = await transactionsCollection
      .find({ userId: mongoUserId })
      .sort({ createdAt: -1 })
      .toArray();

    // Get user's wallet to filter transactions by wallet ID
    const wallet = mongoUserId ? await getWalletByUserId(mongoUserId) : null;
    const userWalletId = wallet?.walletId;

    // Convert ObjectId to string for client-side use and convert amounts from cents to dollars
    const formattedTransactions = transactions.map((transaction) => ({
      ...transaction,
      _id: transaction._id?.toString(),
      userId: transaction.userId?.toString(),
      recipientId: transaction.recipientId?.toString(),
      senderId: transaction.senderId?.toString(),
      fromWalletId: transaction.fromWalletId,
      toWalletId: transaction.toWalletId,
      amount: transaction.amount / 100, // Convert cents to dollars for display
      feeCents: transaction.feeCents ? transaction.feeCents / 100 : undefined, // Convert fee to dollars
      createdAt: transaction.createdAt.toISOString(),
      // Convert meta ObjectIds to strings
      meta: transaction.meta ? {
        eventId: transaction.meta.eventId?.toString(),
        invoiceId: transaction.meta.invoiceId?.toString(),
        redeemId: transaction.meta.redeemId?.toString(),
      } : undefined,
      // Add helper field to identify if this is a sent or received transaction
      isSent: userWalletId ? transaction.fromWalletId === userWalletId : false,
      isReceived: userWalletId ? transaction.toWalletId === userWalletId : false,
    }));

    return {
      success: true,
      transactions: formattedTransactions,
    };
  } catch (error) {
    console.error("Error getting transactions:", error);
    return {
      success: false,
      transactions: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to get transactions",
    };
  }
}

export async function findUserByEmail(email: string) {
  try {
    if (!email) {
      return { success: false, user: null, error: "Email is required" };
    }

    const user = await getUserByEmail(email.toLowerCase());
    
    if (!user) {
      return { success: false, user: null, error: "User not found" };
    }

    // Get wallet to retrieve walletId
    const wallet = await getWalletByUserId(user._id!.toString());

    return {
      success: true,
      user: {
        _id: user._id?.toString(),
        email: user.email,
        walletId: wallet?.walletId || null,
      },
    };
  } catch (error) {
    console.error("Error finding user:", error);
    return {
      success: false,
      user: null,
      error: error instanceof Error ? error.message : "Failed to find user",
    };
  }
}

// Get pending withdrawal details by reference number (for Finance review)
export async function getPendingWithdrawalByRef(referenceNumber: string) {
  try {
    if (!referenceNumber) {
      return { success: false, error: "Reference number is required" };
    }

    const pendingWithdrawalsCollection = await getCollection<PendingWithdrawalModel>(
      COLLECTIONS.PENDING_WITHDRAWALS
    );

    const pendingWithdrawal = await pendingWithdrawalsCollection.findOne({
      ref: referenceNumber,
    });

    if (!pendingWithdrawal) {
      return { success: false, error: "Withdrawal request not found" };
    }

    // Get user data
    const user = await getUserById(pendingWithdrawal.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get KYC data for ID images
    const kycCollection = await getCollection(COLLECTIONS.KYC);
    const kycData = await kycCollection.findOne({ userId: pendingWithdrawal.userId });

    // Get transaction
    const transactionsCollection = await getCollection<TransactionModel>(
      COLLECTIONS.TRANSACTIONS
    );
    const transaction = await transactionsCollection.findOne({
      ref: referenceNumber,
    });

    return {
      success: true,
      withdrawal: {
        ref: pendingWithdrawal.ref,
        amount: pendingWithdrawal.amount / 100, // Convert cents to dollars
        amountCents: pendingWithdrawal.amount,
        walletId: pendingWithdrawal.walletId,
        status: pendingWithdrawal.status,
        createdAt: pendingWithdrawal.createdAt.toISOString(),
        expiresAt: pendingWithdrawal.expiresAt.toISOString(),
        isExpired: pendingWithdrawal.expiresAt < new Date(),
      },
      user: {
        _id: user._id?.toString(),
        email: user.email,
        firstName: (user as any).firstName || "",
        lastName: (user as any).lastName || "",
      },
      kyc: kycData ? {
        firstName: kycData.firstName || "",
        lastName: kycData.lastName || "",
        documents: kycData.documents || [],
        idFrontUrl: kycData.documents?.find((d: any) => d.type === "idFront")?.url,
        idBackUrl: kycData.documents?.find((d: any) => d.type === "idBack")?.url,
      } : null,
      transaction: transaction ? {
        status: transaction.status,
        createdAt: transaction.createdAt.toISOString(),
      } : null,
    };
  } catch (error) {
    console.error("Error getting pending withdrawal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get withdrawal details",
    };
  }
}

// Finance payout function - only accessible by Finance role
export async function processCashPayout(
  financeUserId: string,
  referenceNumber: string
) {
  try {
    // Validate inputs
    if (!financeUserId || !referenceNumber) {
      return { success: false, error: "Finance user ID and reference number are required" };
    }

    // Find pending withdrawal by reference number
    const pendingWithdrawalsCollection = await getCollection<PendingWithdrawalModel>(
      COLLECTIONS.PENDING_WITHDRAWALS
    );

    const pendingWithdrawal = await pendingWithdrawalsCollection.findOne({
      ref: referenceNumber,
      status: "pending",
    });

    if (!pendingWithdrawal) {
      return { success: false, error: "Pending withdrawal not found or already processed" };
    }

    // Prevent self-payout: Check if finance/admin user is trying to pay cash to themselves
    const financeMongoUserId = ObjectId.isValid(financeUserId) 
      ? new ObjectId(financeUserId)
      : null;
    
    if (financeMongoUserId) {
      const financeWallet = await getWalletByUserId(financeMongoUserId);
      if (financeWallet && financeWallet.walletId === pendingWithdrawal.walletId) {
        return { 
          success: false, 
          error: "You cannot pay cash to yourself. Finance/Admin users cannot process cash payouts for their own withdrawal requests." 
        };
      }
    }

    // Check if expired
    if (pendingWithdrawal.expiresAt < new Date()) {
      // Return full amount to wallet (no fee deducted)
      await updateWalletBalance(pendingWithdrawal.userId, pendingWithdrawal.amount, "add");
      
      // Delete expired withdrawal from pool (clear data)
      await pendingWithdrawalsCollection.deleteOne({ _id: pendingWithdrawal._id });

      // Update transaction status to reflect expiration
      const transactionsCollection = await getCollection<TransactionModel>(
        COLLECTIONS.TRANSACTIONS
      );
      await transactionsCollection.updateOne(
        { ref: referenceNumber },
        {
          $set: {
            status: "failed",
          },
        }
      );

      return { success: false, error: "Withdrawal request has expired. Full amount has been returned to wallet without any fee deduction." };
    }

    // Check if user withdrawing is admin (admin accounts are exempt from fees)
    const userWithdrawing = await getUserById(pendingWithdrawal.userId);
    const isAdmin = userWithdrawing?.role === "admin";

    // Get withdrawal fee percentage from system settings
    const { getSystemSettings } = await import("./system-settings");
    const settingsResult = await getSystemSettings();
    const withdrawalFeePercentage = settingsResult.success && settingsResult.settings
      ? settingsResult.settings.withdrawalFeePercentage
      : 5; // Default to 5% if settings not available

    // Calculate system fee from the total amount in pending pool using dynamic percentage
    // The pending withdrawal amount represents the full amount that was moved to the pending pool
    // When finance/admin processes the payout, we deduct the fee percentage from this pool amount
    // Admin accounts are exempt from fees
    const feeCents = isAdmin ? 0 : Math.round(pendingWithdrawal.amount * (withdrawalFeePercentage / 100));
    // Calculate the payout amount that will be paid to the user as cash
    // This is the amount remaining after deducting the fee percentage from the pool
    const payoutAmountCents = pendingWithdrawal.amount - feeCents;

    // Get transactions collection (needed for multiple operations below)
    const transactionsCollection = await getCollection<TransactionModel>(
      COLLECTIONS.TRANSACTIONS
    );

    // Record fee in fee ledger (will appear in Fee Ledger -> All Fees tab as "cash out fee")
    // Fee is NOT automatically deposited - admin must manually deposit it
    // Only record fee if fee is greater than 0 (admin accounts are exempt)
    if (feeCents > 0) {
      const feesCollection = await getCollection<FeeModel>(COLLECTIONS.FEES);
      
      // Get the transaction to link the fee (for reference number display)
      const transaction = await transactionsCollection.findOne({ ref: referenceNumber });
      
      const feeRecord: FeeModel = {
        type: "withdrawal", // Will be displayed as "cash out fee" in fee ledger
        amount: feeCents,
        percentage: withdrawalFeePercentage,
        userId: pendingWithdrawal.userId,
        transactionId: transaction?._id,
        deposited: false, // NOT automatically deposited - admin must manually deposit
        createdAt: new Date(),
      };
      await feesCollection.insertOne(feeRecord);
    }

    // Create transaction record for Finance/Admin user showing "paid cash"
    // This will appear in their wallet transactions in the "Paid" tab
    // Reuse financeMongoUserId that was already defined earlier for self-payout check
    if (financeMongoUserId) {
      const financeWallet = await getWalletByUserId(financeMongoUserId);
      if (financeWallet) {
        const paidCashTransaction: TransactionModel = {
          userId: financeMongoUserId,
          type: "cash_payout",
          amount: payoutAmountCents, // Amount paid out to user (after 5% deduction)
          fromWalletId: financeWallet.walletId,
          ref: referenceNumber,
          status: "success",
          note: "paid cash", // Title shown in transactions list
          createdAt: new Date(),
        };
        await transactionsCollection.insertOne(paidCashTransaction);
      }
    }

    // Delete processed withdrawal from pool (clear data after processing)
    // Store the fee and payout amounts in transaction record for tracking
    await pendingWithdrawalsCollection.deleteOne({ _id: pendingWithdrawal._id });

    // Update transaction status with fee information
    // This records that 5% was deducted from the pool amount
    // The original transaction amount is preserved for audit purposes
    // (transactionsCollection was already defined above for fee linking)
    await transactionsCollection.updateOne(
      { ref: referenceNumber },
      {
        $set: {
          status: "success",
          feeCents: feeCents, // 5% fee deducted from pool amount
        },
      }
    );

    return {
      success: true,
      message: "Cash payout processed successfully",
      ref: referenceNumber,
      payoutAmount: payoutAmountCents / 100, // Convert to dollars for response
      payoutAmountCents: payoutAmountCents,
      feeCents: feeCents,
      originalAmount: pendingWithdrawal.amount / 100, // Original amount in pool
    };
  } catch (error) {
    console.error("Error processing cash payout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process cash payout",
    };
  }
}


// Get recipient user information by wallet ID (for confirmation before sending)
export async function getRecipientInfoByWalletId(walletId: string) {
  try {
    if (!walletId) {
      return { success: false, error: "Wallet ID is required" };
    }

    // Normalize wallet ID
    const normalizedWalletId = walletId.trim().toUpperCase();
    const walletIdPattern = /^[A-Z]{3}\d{3}$/;
    if (!walletIdPattern.test(normalizedWalletId)) {
      return { success: false, error: "Invalid Wallet ID format" };
    }

    // Get wallet by wallet ID
    const recipientWallet = await getWalletByWalletId(normalizedWalletId);
    if (!recipientWallet) {
      return { success: false, error: "Recipient wallet not found" };
    }

    // Check wallet status
    if (recipientWallet.status !== "active") {
      return { success: false, error: `Recipient wallet is ${recipientWallet.status}` };
    }

    // Get user information
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ _id: recipientWallet.userId });
    
    if (!user) {
      return { success: false, error: "Recipient user not found" };
    }

    // Get KYC information for first and last name
    const kycCollection = await getCollection<KycModel>(COLLECTIONS.KYC);
    const kycData = await kycCollection.findOne({ 
      userId: recipientWallet.userId,
      status: "approved"
    });

    return {
      success: true,
      recipient: {
        walletId: normalizedWalletId,
        firstName: kycData?.firstName || "",
        lastName: kycData?.lastName || "",
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Error getting recipient info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get recipient information",
    };
  }
}

// Get all wallets for admin dashboard
export async function getAllWallets() {
  try {
    const walletsCollection = await getCollection<WalletModel>(COLLECTIONS.WALLETS);
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    const wallets = await walletsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Fetch user info for each wallet
    const walletsWithUsers = await Promise.all(
      wallets.map(async (wallet) => {
        const user = await usersCollection.findOne({ _id: wallet.userId });
        return {
          _id: wallet._id?.toString(),
          walletId: wallet.walletId,
          userId: wallet.userId.toString(),
          userEmail: user?.email || "Unknown",
          userName: user ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || user.email : "Unknown",
          balance: wallet.balance / 100, // Convert cents to dollars
          status: wallet.status,
          createdAt: wallet.createdAt.toISOString(),
        };
      })
    );

    return {
      success: true,
      wallets: walletsWithUsers,
    };
  } catch (error) {
    console.error("Error getting all wallets:", error);
    return {
      success: false,
      wallets: [],
      error: error instanceof Error ? error.message : "Failed to get wallets",
    };
  }
}

// Get all pending withdrawals for Finance/Admin dashboard
export async function getAllPendingWithdrawals() {
  try {
    const pendingWithdrawalsCollection = await getCollection<PendingWithdrawalModel>(
      COLLECTIONS.PENDING_WITHDRAWALS
    );
    const usersCollection = await getCollection(COLLECTIONS.USERS);

    const withdrawals = await pendingWithdrawalsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch user info for each withdrawal
    const withdrawalsWithUsers = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        const user = await usersCollection.findOne({ _id: withdrawal.userId });
        return {
          _id: withdrawal._id?.toString(),
          ref: withdrawal.ref,
          walletId: withdrawal.walletId,
          userId: withdrawal.userId.toString(),
          userEmail: user?.email || "Unknown",
          userName: user
            ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() ||
              user.email
            : "Unknown",
          amount: withdrawal.amount / 100, // Convert cents to dollars
          amountCents: withdrawal.amount,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt.toISOString(),
          expiresAt: withdrawal.expiresAt.toISOString(),
          isExpired: withdrawal.expiresAt < new Date(),
          processedAt: withdrawal.processedAt?.toISOString(),
        };
      })
    );

    return {
      success: true,
      withdrawals: withdrawalsWithUsers,
    };
  } catch (error) {
    console.error("Error getting pending withdrawals:", error);
    return {
      success: false,
      withdrawals: [],
      error: error instanceof Error ? error.message : "Failed to get pending withdrawals",
    };
  }
}

// Get wallet transactions for a specific wallet (for admin view)
/**
 * Delete a transaction (User only - can only delete their own transactions)
 * 
 * @param transactionId - ID of the transaction to delete
 * @param userId - User ID requesting the deletion
 * @param email - User's email (for lookup if userId is not ObjectId)
 * @returns Success status
 */
export async function deleteTransaction(
  transactionId: string,
  userId: string,
  email?: string
) {
  try {
    if (!transactionId || !userId) {
      return { success: false, error: "Transaction ID and User ID are required" };
    }

    if (!ObjectId.isValid(transactionId)) {
      return { success: false, error: "Invalid transaction ID" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found in database." };
    }

    const transactionsCollection = await getCollection<TransactionModel>(
      COLLECTIONS.TRANSACTIONS
    );

    // Verify the transaction belongs to the user
    const transaction = await transactionsCollection.findOne({
      _id: new ObjectId(transactionId),
      userId: mongoUserId,
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found or you don't have permission to delete it." };
    }

    // Delete the transaction
    await transactionsCollection.deleteOne({ _id: new ObjectId(transactionId) });

    return { success: true, message: "Transaction deleted successfully" };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete transaction",
    };
  }
}

export async function getWalletTransactions(walletId: string) {
  try {
    if (!walletId) {
      return { success: false, transactions: [], error: "Wallet ID is required" };
    }

    const transactionsCollection = await getCollection<TransactionModel>(
      COLLECTIONS.TRANSACTIONS
    );

    // Find transactions where wallet is involved (as sender or receiver)
    const transactions = await transactionsCollection
      .find({
        $or: [{ fromWalletId: walletId }, { toWalletId: walletId }],
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedTransactions = transactions.map((transaction) => ({
      _id: transaction._id?.toString(),
      type: transaction.type,
      amount: transaction.amount / 100, // Convert cents to dollars
      amountCents: transaction.amount,
      feeCents: transaction.feeCents ? transaction.feeCents / 100 : 0,
      fromWalletId: transaction.fromWalletId,
      toWalletId: transaction.toWalletId,
      ref: transaction.ref,
      status: transaction.status,
      note: transaction.note,
      createdAt: transaction.createdAt.toISOString(),
      // Convert meta ObjectIds to strings
      meta: transaction.meta ? {
        eventId: transaction.meta.eventId?.toString(),
        invoiceId: transaction.meta.invoiceId?.toString(),
        redeemId: transaction.meta.redeemId?.toString(),
      } : undefined,
    }));

    return {
      success: true,
      transactions: formattedTransactions,
    };
  } catch (error) {
    console.error("Error getting wallet transactions:", error);
    return {
      success: false,
      transactions: [],
      error: error instanceof Error ? error.message : "Failed to get wallet transactions",
    };
  }
}

