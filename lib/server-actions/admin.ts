"use server";

import { getCollection } from "@/lib/db";
import { COLLECTIONS } from "@/lib/db/models";
import type { UserModel, RedeemCodeModel, FeeModel, TransactionModel, KycModel, PendingWithdrawalModel } from "@/lib/db/models";
import { updateUser } from "@/lib/db/utils";
import { ObjectId } from "mongodb";

/**
 * Server actions for admin operations
 * 
 * Admin Role Capabilities:
 * - User Management: View all users, update user roles
 * - Wallet Management: View all wallets, transaction logs
 * - Fee Ledger: Track all system fees (P2P, tickets, invoices, withdrawals)
 * - Redeem Code Generator: Create deposit codes for wallet top-ups
 * - KYC Review: Approve/reject wallet applications
 * - Content Moderation: Approve events, jobs, ads
 * 
 * **Admin Fee Exemption:**
 * Admin accounts are completely exempt from all system fees:
 * - No fees on P2P transfers (sending money)
 * - No fees on invoice payments
 * - No fees on cash withdrawals (receive 100% of withdrawal amount)
 * - No fees on deposits (deposits already have no fees for all users)
 * 
 * All admin actions require server-side validation and role checks.
 * See MADEENAJUBA.md and README.md for complete admin documentation.
 */

/**
 * Update a user's role (Admin only)
 * 
 * Valid roles: "user", "admin", "journalist", "employer", "finance"
 * 
 * IMPORTANT: 
 * - Users must have a wallet to be assigned finance, journalist, employee, or admin roles
 * - Role changes do NOT affect wallet data. When a user's role is changed:
 *   - Wallet balance remains unchanged
 *   - Wallet ID remains the same
 *   - All transaction history is preserved
 *   - Wallet status (active/suspended/terminated) remains unchanged
 *   - The user retains full access to their wallet with all previous transactions
 * 
 * This ensures that role changes are purely permission-based and do not impact
 * financial data or transaction history.
 * 
 * @param userId - MongoDB ObjectId of the user to update
 * @param role - New role to assign
 * @returns Success status and error message if failed
 */
export async function updateUserRole(userId: string, role: string) {
  try {
    if (!ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID format" };
    }

    const validRoles = ["user", "admin", "journalist", "employer", "finance", "employee"];
    if (!validRoles.includes(role)) {
      return { success: false, error: "Invalid role" };
    }

    // Roles that require a wallet
    const rolesRequiringWallet = ["admin", "journalist", "finance", "employee"];

    // Check if the role requires a wallet
    if (rolesRequiringWallet.includes(role)) {
      // Check if user has a wallet
      const { getWalletByUserId } = await import("@/lib/db/utils");
      const userObjectId = new ObjectId(userId);
      const wallet = await getWalletByUserId(userObjectId);

      if (!wallet) {
        return {
          success: false,
          error: `Cannot assign ${role} role: User must have a wallet. Please approve their KYC application first to create a wallet.`,
        };
      }
    }

    // Only update the user's role field - wallet data is NOT affected
    const result = await updateUser(userId, { role: role as any });
    
    if (result) {
      return { success: true };
    } else {
      return { success: false, error: "User not found or update failed" };
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role",
    };
  }
}

/**
 * Approve KYC application and create wallet (Admin only)
 * 
 * When a KYC application is approved, a wallet is automatically created for the user.
 * 
 * @param kycApplicationId - ID of the KYC application to approve
 * @param adminUserId - ID of the admin approving the application
 * @returns Success status
 */
export async function approveKyc(kycApplicationId: string, adminUserId: string) {
  try {
    if (!ObjectId.isValid(kycApplicationId)) {
      return { success: false, error: "Invalid KYC application ID" };
    }

    if (!ObjectId.isValid(adminUserId)) {
      return { success: false, error: "Invalid admin user ID" };
    }

    const kycCollection = await getCollection(COLLECTIONS.KYC);
    const kycApplication = await kycCollection.findOne({ 
      _id: new ObjectId(kycApplicationId) 
    });

    if (!kycApplication) {
      return { success: false, error: "KYC application not found" };
    }

    if (kycApplication.status === "approved") {
      return { success: false, error: "KYC application already approved" };
    }

    if (kycApplication.status === "rejected") {
      return { success: false, error: "Cannot approve a rejected KYC application" };
    }

    const userId = kycApplication.userId;

    // Check if wallet already exists
    const { getWalletByUserId, createWallet } = await import("@/lib/db/utils");
    const existingWallet = await getWalletByUserId(userId);

    if (existingWallet) {
      // Wallet already exists, just update KYC status
      await kycCollection.updateOne(
        { _id: new ObjectId(kycApplicationId) },
        {
          $set: {
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: new ObjectId(adminUserId),
          },
        }
      );
      return { success: true, message: "KYC application approved (wallet already exists)" };
    }

    // Create wallet for the user
    await createWallet(userId, 0);

    // Update KYC application status
    await kycCollection.updateOne(
      { _id: new ObjectId(kycApplicationId) },
      {
        $set: {
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: new ObjectId(adminUserId),
        },
      }
    );

    return { success: true, message: "KYC application approved and wallet created" };
  } catch (error) {
    console.error("Error approving KYC:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve KYC",
    };
  }
}

/**
 * Manually create a wallet for a user (Admin only)
 * 
 * This function allows admins to create a wallet for a user without requiring KYC approval.
 * Useful for:
 * - Creating wallets for existing users who need immediate access
 * - Creating admin wallets
 * - Testing and development purposes
 * 
 * IMPORTANT: This bypasses the normal KYC approval flow. Use with caution.
 * 
 * @param userId - MongoDB ObjectId of the user to create a wallet for
 * @param initialBalance - Initial balance in dollars (default: 0)
 * @returns Success status and wallet details
 */
export async function createWalletForUser(userId: string, initialBalance: number = 0) {
  try {
    if (!ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID format" };
    }

    const userObjectId = new ObjectId(userId);
    
    // Check if user exists
    const { getUserById } = await import("@/lib/db/utils");
    const user = await getUserById(userObjectId);
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if wallet already exists
    const { getWalletByUserId, createWallet } = await import("@/lib/db/utils");
    const existingWallet = await getWalletByUserId(userObjectId);

    if (existingWallet) {
      return { 
        success: false, 
        error: "Wallet already exists for this user",
        wallet: {
          walletId: existingWallet.walletId,
          balance: existingWallet.balance / 100,
        }
      };
    }

    // Create wallet
    const wallet = await createWallet(userObjectId, Math.round(initialBalance * 100)); // Convert to cents

    return {
      success: true,
      message: "Wallet created successfully",
      wallet: {
        walletId: wallet.walletId,
        balance: wallet.balance / 100,
        status: wallet.status,
      }
    };
  } catch (error) {
    console.error("Error creating wallet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create wallet",
    };
  }
}

/**
 * Reject KYC application (Admin only)
 * 
 * When a KYC application is rejected, the user is notified and no wallet is created.
 * 
 * @param kycApplicationId - ID of the KYC application to reject
 * @param reason - Reason for rejection
 * @param adminUserId - ID of the admin rejecting the application
 * @returns Success status
 */
export async function rejectKyc(kycApplicationId: string, reason: string, adminUserId: string) {
  try {
    if (!ObjectId.isValid(kycApplicationId)) {
      return { success: false, error: "Invalid KYC application ID" };
    }

    if (!ObjectId.isValid(adminUserId)) {
      return { success: false, error: "Invalid admin user ID" };
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Rejection reason is required" };
    }

    const kycCollection = await getCollection(COLLECTIONS.KYC);
    const kycApplication = await kycCollection.findOne({ 
      _id: new ObjectId(kycApplicationId) 
    });

    if (!kycApplication) {
      return { success: false, error: "KYC application not found" };
    }

    if (kycApplication.status === "rejected") {
      return { success: false, error: "KYC application already rejected" };
    }

    if (kycApplication.status === "approved") {
      return { success: false, error: "Cannot reject an approved KYC application" };
    }

    // Update KYC application status
    await kycCollection.updateOne(
      { _id: new ObjectId(kycApplicationId) },
      {
        $set: {
          status: "rejected",
          reviewedAt: new Date(),
          reviewedBy: new ObjectId(adminUserId),
          rejectionReason: reason.trim(),
        },
      }
    );

    return { success: true, message: "KYC application rejected" };
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject KYC",
    };
  }
}

/**
 * Generate a redeem code (Admin only)
 * 
 * Creates a unique redeem code with PIN that can be used for wallet deposits.
 * 
 * @param amount - Amount in dollars (will be converted to cents)
 * @param expiryDate - Optional expiration date for the code
 * @param adminUserId - ID of the admin creating the code
 * @returns Success status with generated code, PIN, and amount
 */
export async function generateRedeemCode(
  amount: number,
  adminUserId: string,
  expiryDate?: Date
) {
  try {
    // Validate inputs
    if (!amount || amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    if (!ObjectId.isValid(adminUserId)) {
      return { success: false, error: "Invalid admin user ID" };
    }

    // Convert amount to cents
    const amountCents = Math.round(amount * 100);

    // Generate unique code: ####-####-####-####
    const generateCode = (): string => {
      const code1 = Math.floor(1000 + Math.random() * 9000);
      const code2 = Math.floor(1000 + Math.random() * 9000);
      const code3 = Math.floor(1000 + Math.random() * 9000);
      const code4 = Math.floor(1000 + Math.random() * 9000);
      return `${code1}-${code2}-${code3}-${code4}`;
    };

    // Generate 4-digit PIN
    const generatePIN = (): string => {
      return Math.floor(1000 + Math.random() * 9000).toString();
    };

    // Ensure code uniqueness
    const redeemCodesCollection = await getCollection<RedeemCodeModel>(
      COLLECTIONS.REDEEM_CODES
    );

    let code = generateCode();
    let existingCode = await redeemCodesCollection.findOne({ code });

    // Regenerate if code already exists
    let attempts = 0;
    while (existingCode && attempts < 10) {
      code = generateCode();
      existingCode = await redeemCodesCollection.findOne({ code });
      attempts++;
    }

    if (existingCode) {
      return { success: false, error: "Failed to generate unique code. Please try again." };
    }

    const pin = generatePIN();
    const now = new Date();

    // Create redeem code
    const redeemCode: RedeemCodeModel = {
      code,
      pin,
      amount: amountCents,
      used: false,
      createdAt: now,
      createdBy: new ObjectId(adminUserId),
      expiresAt: expiryDate || undefined,
    };

    const result = await redeemCodesCollection.insertOne(redeemCode);

    if (!result.insertedId) {
      return { success: false, error: "Failed to create redeem code" };
    }

    return {
      success: true,
      code,
      pin,
      amount: amountCents,
      amountDollars: amount,
      expiresAt: expiryDate?.toISOString(),
      createdAt: now.toISOString(),
    };
  } catch (error) {
    console.error("Error generating redeem code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate redeem code",
    };
  }
}

/**
 * Get all redeem codes (Admin only)
 * 
 * Returns all redeem codes sorted by creation date (newest first).
 * 
 * @returns Array of redeem codes with serialized data
 */
export async function getAllRedeemCodes() {
  try {
    const collection = await getCollection<RedeemCodeModel>(COLLECTIONS.REDEEM_CODES);
    const codes = await collection.find({}).sort({ createdAt: -1 }).toArray();

    // Convert MongoDB objects to plain objects for Client Components
    return codes.map((code) => ({
      _id: code._id?.toString() || "",
      code: code.code,
      pin: code.pin,
      amount: code.amount,
      used: code.used,
      usedBy: code.usedBy?.toString(),
      usedByWalletId: code.usedByWalletId,
      usedAt: code.usedAt instanceof Date ? code.usedAt.toISOString() : code.usedAt,
      expiresAt: code.expiresAt instanceof Date ? code.expiresAt.toISOString() : code.expiresAt,
      createdAt: code.createdAt instanceof Date ? code.createdAt.toISOString() : code.createdAt,
      createdBy: code.createdBy?.toString(),
    }));
  } catch (error) {
    console.error("Error getting redeem codes:", error);
    return [];
  }
}

/**
 * Delete redeem codes (Admin only)
 * 
 * Permanently deletes one or more redeem codes from the database.
 * Can delete active, expired, or used codes.
 * 
 * @param codeIds - Array of redeem code IDs to delete
 * @param adminUserId - ID of the admin performing the deletion
 * @returns Success status with deletion count
 */
export async function deleteRedeemCodes(codeIds: string[], adminUserId: string) {
  try {
    if (!Array.isArray(codeIds) || codeIds.length === 0) {
      return { success: false, error: "No redeem codes selected for deletion" };
    }

    if (!ObjectId.isValid(adminUserId)) {
      return { success: false, error: "Invalid admin user ID" };
    }

    // Verify admin role
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const admin = await usersCollection.findOne({ _id: new ObjectId(adminUserId) });

    if (!admin || admin.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate all code IDs
    const validIds = codeIds.filter((id) => ObjectId.isValid(id));
    if (validIds.length === 0) {
      return { success: false, error: "No valid redeem code IDs provided" };
    }

    // Convert to ObjectIds
    const objectIds = validIds.map((id) => new ObjectId(id));

    // Delete redeem codes
    const redeemCodesCollection = await getCollection<RedeemCodeModel>(
      COLLECTIONS.REDEEM_CODES
    );

    const result = await redeemCodesCollection.deleteMany({
      _id: { $in: objectIds },
    });

    return {
      success: true,
      message: `Successfully deleted ${result.deletedCount} redeem code${result.deletedCount !== 1 ? "s" : ""}`,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error("Error deleting redeem codes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete redeem codes",
    };
  }
}


/**
 * Get all users in the system (Admin only)
 * 
 * Returns all users sorted by creation date (newest first).
 * Data is serialized for Client Components (ObjectIds and Dates converted to strings).
 * Includes wallet information to determine if user has a wallet.
 * 
 * Used by Admin Dashboard > Users Management tab
 * 
 * @returns Object with success status and array of user objects with serialized data including hasWallet flag
 */
export async function getUsers() {
  try {
    const collection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const walletsCollection = await getCollection(COLLECTIONS.WALLETS);
    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Get all wallets to check which users have wallets
    const wallets = await walletsCollection.find({}).toArray();
    const userIdsWithWallets = new Set(wallets.map((w) => w.userId.toString()));
    
    // Convert MongoDB objects to plain objects for Client Components
    const formattedUsers = users.map((user) => ({
      _id: user._id?.toString() || "",
      email: user.email,
      role: user.role,
      hasWallet: userIdsWithWallets.has(user._id?.toString() || ""),
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    }));

    return {
      success: true,
      users: formattedUsers,
    };
  } catch (error) {
    console.error("Error getting users:", error);
    return {
      success: false,
      users: [],
      error: error instanceof Error ? error.message : "Failed to get users",
    };
  }
}


/**
 * Get all KYC applications (Admin only)
 * 
 * Returns all KYC applications with user information, sorted by submission date (newest first).
 * 
 * @returns Array of KYC application objects with serialized data
 */
export async function getAllKycApplications() {
  try {
    const kycCollection = await getCollection(COLLECTIONS.KYC);
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    
    const kycApplications = await kycCollection.find({}).sort({ submittedAt: -1 }).toArray();
    
    // Get all unique user IDs
    const userIds = kycApplications.map((kyc) => kyc.userId);
    
    // Fetch all users in one query
    const users = userIds.length > 0
      ? await usersCollection.find({ _id: { $in: userIds } }).toArray()
      : [];
    
    // Create a map for quick lookup
    const userMap = new Map(
      users.map((user) => [user._id?.toString(), user])
    );
    
    // Map KYC applications with user information
    const applicationsWithUserInfo = kycApplications.map((kyc) => {
      const user = userMap.get(kyc.userId.toString());
      
      return {
        _id: kyc._id?.toString() || "",
        userId: kyc.userId.toString(),
        email: user?.email || "Unknown",
        firstName: kyc.firstName,
        lastName: kyc.lastName,
        phone: kyc.phone,
        address: kyc.address,
        status: kyc.status,
        submittedAt: kyc.submittedAt instanceof Date ? kyc.submittedAt.toISOString() : kyc.submittedAt,
        reviewedAt: kyc.reviewedAt instanceof Date ? kyc.reviewedAt.toISOString() : kyc.reviewedAt,
        rejectionReason: kyc.rejectionReason,
        documents: kyc.documents.map((doc: any) => ({
          type: doc.type,
          url: doc.url,
          uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : doc.uploadedAt,
        })),
      };
    });
    
    return applicationsWithUserInfo;
  } catch (error) {
    console.error("Error getting KYC applications:", error);
    return [];
  }
}

/**
 * Get all system fees (Admin only)
 * 
 * Returns all fees collected from P2P transfers, withdrawals, and other transactions.
 * Fees are sorted by creation date (newest first).
 * 
 * @returns Array of fee objects with serialized data
 */
/**
 * Get all deposited fees with wallet ID information
 * Returns ALL fees that have been deposited to admin wallet from the "All Fees" tab
 * Shows the wallet ID that the fee came from, amount, date, and time
 * Includes all fee types: P2P, ticket, invoice, and withdrawal (cash out) fees
 */
export async function getDepositedTicketFees() {
  try {
    const feesCollection = await getCollection<FeeModel>(COLLECTIONS.FEES);
    const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
    
    // Get ALL deposited fees (regardless of type)
    const depositedFees = await feesCollection.find({ 
      deposited: true
    }).sort({ depositedAt: -1 }).toArray();
    
    // Get transaction IDs to fetch related transactions
    const transactionIds = depositedFees
      .map((fee) => fee.transactionId)
      .filter((id): id is ObjectId => id !== undefined);
    
    // Fetch all related transactions
    const transactions = transactionIds.length > 0
      ? await transactionsCollection
          .find({ _id: { $in: transactionIds } })
          .toArray()
      : [];
    
    // Create a map for quick lookup
    const transactionMap = new Map(
      transactions.map((tx) => [tx._id?.toString(), tx])
    );
    
    // Map fees with transaction details
    const feesWithDetails = depositedFees
      .map((fee) => {
        const transaction = fee.transactionId 
          ? transactionMap.get(fee.transactionId.toString())
          : null;
        
        // Determine fee type based on fee.type and transaction type
        let feeType: "p2p" | "ticket" | "invoice" | "withdrawal" = "p2p";
        let fromWalletId = "Unknown";
        let ref = "";
        
        if (fee.type === "withdrawal") {
          // Cash out fee
          feeType = "withdrawal";
          if (transaction) {
            fromWalletId = transaction.fromWalletId || "Unknown";
            ref = transaction.ref || "";
          }
        } else if (fee.type === "transaction" && transaction) {
          // Determine based on transaction type
          if (transaction.type === "send") {
            feeType = "p2p";
            fromWalletId = transaction.fromWalletId || "Unknown";
            ref = transaction.ref || "";
          } else if (transaction.type === "ticket_payout") {
            feeType = "ticket";
            fromWalletId = transaction.fromWalletId || "Unknown";
            ref = transaction.ref || "";
          } else if (transaction.type === "invoice_payment") {
            feeType = "invoice";
            fromWalletId = transaction.fromWalletId || "Unknown";
            ref = transaction.ref || "";
          }
        } else if (fee.type === "deposit") {
          // Handle deposit fees if any
          feeType = "p2p"; // Default, can be adjusted if needed
        }
        
        return {
          _id: fee._id?.toString() || "",
          feeType: feeType,
          fromWalletId: fromWalletId,
          depositAmount: fee.amount / 100, // Convert cents to dollars
          depositAmountCents: fee.amount,
          date: fee.depositedAt 
            ? fee.depositedAt instanceof Date 
              ? fee.depositedAt.toISOString().split('T')[0]
              : new Date(fee.depositedAt).toISOString().split('T')[0]
            : "",
          time: fee.depositedAt
            ? fee.depositedAt instanceof Date
              ? fee.depositedAt.toTimeString().split(' ')[0]
              : new Date(fee.depositedAt).toTimeString().split(' ')[0]
            : "",
          createdAt: fee.createdAt instanceof Date ? fee.createdAt.toISOString() : fee.createdAt,
          depositedAt: fee.depositedAt instanceof Date ? fee.depositedAt.toISOString() : fee.depositedAt,
          ref: ref,
        };
      });
    
    return feesWithDetails;
  } catch (error) {
    console.error("Error getting deposited fees:", error);
    return [];
  }
}

export async function getAllFees() {
  try {
    const feesCollection = await getCollection<FeeModel>(COLLECTIONS.FEES);
    const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
    
    // Get all fees (including withdrawal fees which are auto-deposited)
    // Withdrawal fees are automatically deposited to admin wallet when Finance/Admin processes cash payout
    // but should still appear in the Fee Ledger -> All Fees tab for accounting purposes
    const fees = await feesCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Get all transaction IDs to fetch in one query
    const transactionIds = fees
      .map((fee) => fee.transactionId)
      .filter((id): id is ObjectId => id !== undefined);
    
    // Also get fee-type transactions (they might not be linked via transactionId)
    const feeTransactions = await transactionsCollection
      .find({ type: "fee" })
      .toArray();
    
    // Fetch all related transactions in one query
    const transactions = transactionIds.length > 0
      ? await transactionsCollection
          .find({ _id: { $in: transactionIds } })
          .toArray()
      : [];
    
    // Create a map for quick lookup
    const transactionMap = new Map(
      transactions.map((tx) => [tx._id?.toString(), tx])
    );
    
    // Create a map of fee transactions by ref for lookup
    const feeTransactionMap = new Map(
      feeTransactions.map((tx) => [tx.ref || "", tx])
    );
    
    // Map fees with transaction details
    const feesWithDetails = fees.map((fee) => {
      let ref = "";
      let fromWalletId = "";
      let toWalletId = "";
      let transactionAmount = 0;
      let transactionType = "";
      
      // Get transaction details if transactionId exists
      if (fee.transactionId) {
        const transaction = transactionMap.get(fee.transactionId.toString());
        if (transaction) {
          ref = transaction.ref || "";
          fromWalletId = transaction.fromWalletId || "";
          toWalletId = transaction.toWalletId || "";
          transactionAmount = transaction.amount || 0;
          transactionType = transaction.type || "";
          
          // If this is a send transaction, get the original amount (before fee)
          if (transaction.type === "send" && transaction.amount) {
            transactionAmount = transaction.amount; // This is the sent amount
          }
        }
      }
      
      // If no transaction found but we have fee transactions, try to match by amount
      if (!ref && fee.amount) {
        // Try to find matching fee transaction
        const matchingFeeTx = Array.from(feeTransactionMap.values()).find(
          (tx) => tx.amount === fee.amount
        );
        if (matchingFeeTx) {
          ref = matchingFeeTx.ref || "";
          fromWalletId = matchingFeeTx.fromWalletId || "";
          // Calculate original amount from fee (if 5%, original = fee / 0.05)
          if (fee.percentage) {
            transactionAmount = fee.amount / (fee.percentage / 100);
          }
        }
      }
      
      // Determine fee type for display
      let displayType: "p2p" | "withdrawal" | "ticket" | "invoice" = "p2p";
      if (fee.type === "withdrawal") {
        displayType = "withdrawal";
      } else if (fee.type === "transaction") {
        // Check transaction type to determine fee category
        if (transactionType === "ticket_payout") {
          displayType = "ticket";
        } else if (transactionType === "invoice_payment") {
          displayType = "invoice";
        } else {
          displayType = "p2p";
        }
      }
      
      return {
        _id: fee._id?.toString() || "",
        type: displayType,
        amount: transactionAmount / 100, // Original transaction amount in dollars
        fee: fee.amount / 100, // Fee amount in dollars
        percentage: fee.percentage || 0,
        ref: ref,
        fromWalletId: fromWalletId,
        toWalletId: toWalletId,
        createdAt: fee.createdAt instanceof Date ? fee.createdAt.toISOString() : fee.createdAt,
        transactionId: fee.transactionId?.toString(),
        deposited: fee.deposited || false, // Include deposited status
        depositedAt: fee.depositedAt instanceof Date ? fee.depositedAt.toISOString() : fee.depositedAt,
      };
    });
    
    return feesWithDetails;
  } catch (error) {
    console.error("Error getting fees:", error);
    return [];
  }
}

/**
 * Suspend a wallet (Admin only)
 * 
 * Suspends a wallet temporarily. Suspended wallets cannot:
 * - Send or receive money
 * - Make deposits
 * - Request cash withdrawals
 * 
 * The wallet can be reactivated later by changing status back to "active".
 * 
 * @param walletId - Wallet ID (e.g., "STR456")
 * @param adminUserId - ID of the admin performing the action
 * @returns Success status
 */
export async function suspendWallet(walletId: string, adminUserId: string) {
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

    const walletsCollection = await getCollection(COLLECTIONS.WALLETS);
    const wallet = await walletsCollection.findOne({ walletId: walletId.toUpperCase() });

    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    if (wallet.status === "suspended") {
      return { success: false, error: "Wallet is already suspended" };
    }

    if (wallet.status === "terminated") {
      return { success: false, error: "Cannot suspend a terminated wallet" };
    }

    // Update wallet status to suspended
    await walletsCollection.updateOne(
      { walletId: walletId.toUpperCase() },
      {
        $set: {
          status: "suspended",
          updatedAt: new Date(),
        },
      }
    );

    return { success: true, message: "Wallet suspended successfully" };
  } catch (error) {
    console.error("Error suspending wallet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to suspend wallet",
    };
  }
}

/**
 * Reactivate a suspended wallet (Admin only)
 * 
 * Changes wallet status from "suspended" back to "active".
 * 
 * @param walletId - Wallet ID (e.g., "STR456")
 * @param adminUserId - ID of the admin performing the action
 * @returns Success status
 */
export async function reactivateWallet(walletId: string, adminUserId: string) {
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

    const walletsCollection = await getCollection(COLLECTIONS.WALLETS);
    const wallet = await walletsCollection.findOne({ walletId: walletId.toUpperCase() });

    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    if (wallet.status !== "suspended") {
      return { success: false, error: "Wallet is not suspended" };
    }

    // Update wallet status to active
    await walletsCollection.updateOne(
      { walletId: walletId.toUpperCase() },
      {
        $set: {
          status: "active",
          updatedAt: new Date(),
        },
      }
    );

    return { success: true, message: "Wallet reactivated successfully" };
  } catch (error) {
    console.error("Error reactivating wallet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reactivate wallet",
    };
  }
}

/**
 * Terminate a wallet (Admin only)
 * 
 * Terminates a wallet by setting its status to "terminated".
 * Terminated wallets:
 * - Cannot send, receive, deposit, or withdraw funds
 * - Show a termination message on the user's wallet page
 * - Wallet record is preserved for audit purposes
 * - Transaction history is preserved
 * 
 * This is different from deletion - the wallet record remains in the database
 * but is marked as terminated so users can see the termination message.
 * 
 * @param walletId - Wallet ID (e.g., "STR456")
 * @param adminUserId - ID of the admin performing the action
 * @returns Success status
 */
export async function deleteWallet(walletId: string, adminUserId: string) {
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

    const walletsCollection = await getCollection(COLLECTIONS.WALLETS);
    const wallet = await walletsCollection.findOne({ walletId: walletId.toUpperCase() });

    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    if (wallet.status === "terminated") {
      return { success: false, error: "Wallet is already terminated" };
    }

    // Set wallet status to terminated instead of deleting
    // This preserves the wallet record so users can see the termination message
    await walletsCollection.updateOne(
      { walletId: walletId.toUpperCase() },
      {
        $set: {
          status: "terminated",
          updatedAt: new Date(),
        },
      }
    );

    return { success: true, message: "Wallet terminated successfully" };
  } catch (error) {
    console.error("Error terminating wallet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to terminate wallet",
    };
  }
}

/**
 * Deposit total fees into admin wallet (Admin only)
 * 
 * Calculates the sum of all fees in the fee ledger and deposits them into the admin wallet.
 * This allows admins to collect all accumulated system fees into their wallet balance.
 * 
 * @param adminUserId - ID of the admin performing the deposit
 * @returns Success status with deposit amount
 */
export async function depositTotalFees(adminUserId: string) {
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

    // Get all undeposited fees and calculate total (fees are stored in cents)
    const feesCollection = await getCollection<FeeModel>(COLLECTIONS.FEES);
    const allFees = await feesCollection.find({ 
      $or: [{ deposited: { $ne: true } }, { deposited: { $exists: false } }]
    }).toArray();
    
    const totalFeesCents = allFees.reduce((sum, fee) => sum + fee.amount, 0);

    if (totalFeesCents === 0) {
      return { success: false, error: "No fees available to deposit" };
    }

    // Find or create admin wallet
    const { getWalletByUserId, createWallet, updateWalletBalance } = await import("@/lib/db/utils");
    let adminWallet = await getWalletByUserId(admin._id!);
    
    if (!adminWallet) {
      adminWallet = await createWallet(admin._id!, 0);
    }

    // Deposit total fees into admin wallet
    await updateWalletBalance(admin._id!, totalFeesCents, "add");

    // Mark all fees as deposited
    const depositTimestamp = new Date();
    const feeIds = allFees.map(fee => fee._id).filter((id): id is ObjectId => id !== undefined);
    if (feeIds.length > 0) {
      await feesCollection.updateMany(
        { _id: { $in: feeIds } },
        {
          $set: {
            deposited: true,
            depositedAt: depositTimestamp,
          }
        }
      );
    }

    // Create a deposit transaction record
    const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
    const depositTransaction: TransactionModel = {
      userId: admin._id!,
      type: "deposit",
      amount: totalFeesCents,
      fromWalletId: undefined,
      toWalletId: adminWallet.walletId,
      ref: `FEE-${Date.now()}`,
      status: "success",
      note: "Total fees deposit from fee ledger",
      createdAt: new Date(),
    };
    await transactionsCollection.insertOne(depositTransaction);

    return {
      success: true,
      message: "Total fees deposited successfully",
      amount: totalFeesCents / 100, // Return in dollars
      amountCents: totalFeesCents,
      walletId: adminWallet.walletId,
    };
  } catch (error) {
    console.error("Error depositing total fees:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deposit total fees",
    };
  }
}

/**
 * Get platform statistics (Admin only)
 * 
 * Returns comprehensive statistics about the platform including:
 * - Total wallets count
 * - Active wallets count
 * - Suspended (inactive) wallets count
 * - Terminated wallets count
 * - Total users count
 * - Total wallet balance across all wallets
 * - Total cash payout amount
 * - Total amount in pending withdrawal pool
 * 
 * @returns Statistics object with all platform metrics
 */
export async function getPlatformStatistics() {
  try {
    const walletsCollection = await getCollection(COLLECTIONS.WALLETS);
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);

    // Get all wallets
    const wallets = await walletsCollection.find({}).toArray();
    
    // Calculate wallet statistics
    const totalWallets = wallets.length;
    const activeWallets = wallets.filter(w => w.status === "active").length;
    const suspendedWallets = wallets.filter(w => w.status === "suspended").length;
    const terminatedWallets = wallets.filter(w => w.status === "terminated").length;
    
    // Calculate total balance (sum of all wallet balances in cents, then convert to dollars)
    const totalBalanceCents = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
    const totalBalance = totalBalanceCents / 100;
    
    // Get total users count
    const totalUsers = await usersCollection.countDocuments({});

    // Calculate total cash payout amount (from successful cash_payout transactions)
    const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
    const cashPayoutTransactions = await transactionsCollection.find({
      type: "cash_payout",
      status: "success",
    }).toArray();
    
    const totalCashPayoutCents = cashPayoutTransactions.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0
    );
    const totalCashPayout = totalCashPayoutCents / 100;

    // Calculate total amount in pending withdrawal pool
    // Sum of all pending withdrawals that haven't been processed or expired
    const pendingWithdrawalsCollection = await getCollection(COLLECTIONS.PENDING_WITHDRAWALS);
    const pendingWithdrawals = await pendingWithdrawalsCollection.find({
      status: "pending",
      expiresAt: { $gt: new Date() }, // Only include non-expired withdrawals
    }).toArray();
    
    const totalAmountInPoolCents = pendingWithdrawals.reduce(
      (sum, withdrawal) => sum + (withdrawal.amount || 0),
      0
    );
    const totalAmountInPool = totalAmountInPoolCents / 100;

    return {
      success: true,
      statistics: {
        totalWallets,
        activeWallets,
        suspendedWallets,
        terminatedWallets,
        totalUsers,
        totalBalance,
        totalBalanceCents,
        totalCashPayout,
        totalCashPayoutCents,
        totalAmountInPool,
        totalAmountInPoolCents,
      },
    };
  } catch (error) {
    console.error("Error getting platform statistics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get platform statistics",
      statistics: {
        totalWallets: 0,
        activeWallets: 0,
        suspendedWallets: 0,
        terminatedWallets: 0,
        totalUsers: 0,
        totalBalance: 0,
        totalBalanceCents: 0,
        totalCashPayout: 0,
        totalCashPayoutCents: 0,
        totalAmountInPool: 0,
        totalAmountInPoolCents: 0,
      },
    };
  }
}

/**
 * Get pending withdrawal pool details (Admin only)
 * 
 * Returns detailed information about all pending withdrawals in the pool:
 * - Wallet ID
 * - Amount
 * - Date and time when sent to pool
 * 
 * @returns Array of pending withdrawal details
 */
export async function getPendingWithdrawalPoolDetails() {
  try {
    const pendingWithdrawalsCollection = await getCollection<PendingWithdrawalModel>(
      COLLECTIONS.PENDING_WITHDRAWALS
    );

    // Get only pending withdrawals that haven't expired (the ones in the pool)
    const pendingWithdrawals = await pendingWithdrawalsCollection
      .find({
        status: "pending",
        expiresAt: { $gt: new Date() }, // Only include non-expired withdrawals
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .toArray();

    const poolDetails = pendingWithdrawals.map((withdrawal) => ({
      _id: withdrawal._id?.toString(),
      walletId: withdrawal.walletId,
      amount: withdrawal.amount / 100, // Convert cents to dollars
      amountCents: withdrawal.amount,
      ref: withdrawal.ref,
      createdAt: withdrawal.createdAt.toISOString(),
      expiresAt: withdrawal.expiresAt.toISOString(),
    }));

    return {
      success: true,
      poolDetails,
    };
  } catch (error) {
    console.error("Error getting pending withdrawal pool details:", error);
    return {
      success: false,
      poolDetails: [],
      error: error instanceof Error ? error.message : "Failed to get pool details",
    };
  }
}

/**
 * Get cash payout details (Admin only)
 * 
 * Returns detailed information about all cash payouts:
 * - Name (who received the cash)
 * - Wallet ID (withdrawal from)
 * - Time and date
 * - Account that paid cash (finance user email)
 * 
 * @returns Array of cash payout details
 */
export async function getCashPayoutDetails() {
  try {
    const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const walletsCollection = await getCollection(COLLECTIONS.WALLETS);
    const kycCollection = await getCollection<KycModel>(COLLECTIONS.KYC);

    // Get all cash_payout transactions with status "success" and note "paid cash"
    // These are the transactions created when finance/admin processed the payout
    const cashPayoutTransactions = await transactionsCollection
      .find({
        type: "cash_payout",
        status: "success",
        note: "paid cash",
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .toArray();

    // For each cash payout transaction, get the details
    const payoutDetails = await Promise.all(
      cashPayoutTransactions.map(async (payoutTx) => {
        // Get finance user who processed the payout
        const financeUser = payoutTx.userId
          ? await usersCollection.findOne({ _id: payoutTx.userId })
          : null;
        const financeEmail = financeUser?.email || "Unknown";

        // Get the original withdrawal transaction using the reference number
        // The original transaction was created by the user (not the finance user)
        // It has the same ref but doesn't have note "paid cash"
        let userWalletId: string | undefined;
        
        if (payoutTx.ref) {
          // Find the original transaction (user's withdrawal transaction)
          // It has the same ref but no note "paid cash" or different fromWalletId
          const allTransactionsWithRef = await transactionsCollection
            .find({ ref: payoutTx.ref, type: "cash_payout" })
            .toArray();
          
          // Find the transaction that's not the finance transaction
          const userTransaction = allTransactionsWithRef.find(
            (tx) => 
              tx.fromWalletId && 
              tx.fromWalletId !== payoutTx.fromWalletId &&
              (!tx.note || tx.note !== "paid cash")
          );
          
          userWalletId = userTransaction?.fromWalletId;
        }

        let walletId = "Unknown";
        let userName = "Unknown";

        if (userWalletId) {
          walletId = userWalletId;

          // Get wallet to find user
          const wallet = await walletsCollection.findOne({ walletId: userWalletId });
          if (wallet?.userId) {
            // Get user info
            const user = await usersCollection.findOne({ _id: wallet.userId });
            if (user) {
              // Try to get name from KYC first
              const kycData = await kycCollection.findOne({ userId: wallet.userId });
              if (kycData?.firstName && kycData?.lastName) {
                userName = `${kycData.firstName} ${kycData.lastName}`;
              } else {
                userName = user.email;
              }
            }
          }
        }

        return {
          _id: payoutTx._id?.toString(),
          ref: payoutTx.ref || "N/A",
          walletId,
          userName,
          amount: payoutTx.amount / 100, // Convert cents to dollars
          amountCents: payoutTx.amount,
          financeEmail,
          createdAt: payoutTx.createdAt.toISOString(),
        };
      })
    );

    return {
      success: true,
      payoutDetails,
    };
  } catch (error) {
    console.error("Error getting cash payout details:", error);
    return {
      success: false,
      payoutDetails: [],
      error: error instanceof Error ? error.message : "Failed to get cash payout details",
    };
  }
}

/**
 * Delete a user and all related data (Admin only)
 * 
 * This function permanently deletes a user and all associated data from the database.
 * 
 * IMPORTANT: User can only be deleted if their wallet balance is within the configured threshold.
 * The maximum balance allowed for deletion is configured in System Settings (Control tab).
 * 
 * Deletes:
 * - User account (email, password, role)
 * - Wallet (if exists)
 * - All transactions (sent, received, fees, deposits, withdrawals)
 * - KYC application (if exists)
 * - All fees associated with user
 * - Pending withdrawals (if any)
 * - Invoices (issued and received)
 * - Redeem codes used by user (if any)
 * 
 * @param userId - MongoDB ObjectId of the user to delete
 * @param adminUserId - ID of the admin performing the deletion
 * @returns Success status with deletion details
 */
export async function deleteUser(userId: string, adminUserId: string) {
  try {
    if (!ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID format" };
    }

    if (!ObjectId.isValid(adminUserId)) {
      return { success: false, error: "Invalid admin user ID" };
    }

    // Verify admin role
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const admin = await usersCollection.findOne({ _id: new ObjectId(adminUserId) });
    
    if (!admin || admin.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const userObjectId = new ObjectId(userId);

    // Prevent admin from deleting themselves
    if (userObjectId.toString() === adminUserId) {
      return { success: false, error: "You cannot delete your own account" };
    }

    // Check if user exists
    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check wallet balance - user can only be deleted if balance is within the configured threshold
    const { getWalletByUserId } = await import("@/lib/db/utils");
    const { getSystemSettings } = await import("./system-settings");
    
    // Get maximum balance threshold for deletion from system settings
    const settingsResult = await getSystemSettings();
    const maxBalanceForDeletion = settingsResult.success && settingsResult.settings
      ? settingsResult.settings.maxBalanceForDeletion
      : 0; // Default to 0 if settings not available
    
    const wallet = await getWalletByUserId(userObjectId);
    
    if (wallet && wallet.balance > maxBalanceForDeletion) {
      return { 
        success: false, 
        error: `Cannot delete user: Wallet balance must be $${(maxBalanceForDeletion / 100).toFixed(2)} or less. Current balance: $${(wallet.balance / 100).toFixed(2)}` 
      };
    }

    // Get wallet ID for related data deletion
    const walletId = wallet?.walletId;

    // Delete all related data
    const walletsCollection = await getCollection(COLLECTIONS.WALLETS);
    const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
    const kycCollection = await getCollection<KycModel>(COLLECTIONS.KYC);
    const feesCollection = await getCollection<FeeModel>(COLLECTIONS.FEES);
    const pendingWithdrawalsCollection = await getCollection<PendingWithdrawalModel>(COLLECTIONS.PENDING_WITHDRAWALS);
    const invoicesCollection = await getCollection(COLLECTIONS.INVOICES);
    const redeemCodesCollection = await getCollection<RedeemCodeModel>(COLLECTIONS.REDEEM_CODES);

    // Delete wallet (if exists)
    if (wallet) {
      await walletsCollection.deleteOne({ _id: wallet._id });
    }

    // Delete all transactions where user is involved (by userId or walletId)
    if (walletId) {
      await transactionsCollection.deleteMany({
        $or: [
          { userId: userObjectId },
          { fromWalletId: walletId },
          { toWalletId: walletId },
        ]
      });
    } else {
      await transactionsCollection.deleteMany({ userId: userObjectId });
    }

    // Delete KYC application
    await kycCollection.deleteMany({ userId: userObjectId });

    // Delete fees associated with user
    await feesCollection.deleteMany({ userId: userObjectId });

    // Delete pending withdrawals
    await pendingWithdrawalsCollection.deleteMany({ userId: userObjectId });

    // Delete invoices (both issued and received)
    if (walletId) {
      await invoicesCollection.deleteMany({
        $or: [
          { issuerUserId: userObjectId },
          { recipientWalletId: walletId },
        ]
      });
    } else {
      await invoicesCollection.deleteMany({ issuerUserId: userObjectId });
    }

    // Update redeem codes used by this user (set usedBy to null, but keep the code record)
    if (walletId) {
      await redeemCodesCollection.updateMany(
        { usedByWalletId: walletId },
        { $unset: { usedBy: "", usedByWalletId: "", usedAt: "" }, $set: { used: false } }
      );
    }
    await redeemCodesCollection.updateMany(
      { usedBy: userObjectId },
      { $unset: { usedBy: "", usedByWalletId: "", usedAt: "" }, $set: { used: false } }
    );

    // Finally, delete the user
    await usersCollection.deleteOne({ _id: userObjectId });

    return { 
      success: true, 
      message: `User ${user.email} and all related data deleted successfully` 
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}


