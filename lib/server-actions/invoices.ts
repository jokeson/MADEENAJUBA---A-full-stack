"use server";

import { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/lib/db/models";
import type { InvoiceModel, TransactionModel, WalletModel } from "@/lib/db/models";

// Helper function to generate reference number (6 digits)
const generateReferenceNumber = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get invoice by reference number (invoice ID or ref field)
 * Used for the Pay modal to look up invoice details
 */
export async function getInvoiceByRef(referenceNumber: string) {
  try {
    if (!referenceNumber) {
      return { success: false, error: "Reference number is required" };
    }

    const { getCollection } = await import("@/lib/db");
    const invoicesCollection = await getCollection<InvoiceModel>(COLLECTIONS.INVOICES);

    // Try to find by _id first (if reference is a valid ObjectId)
    let invoice: InvoiceModel | null = null;
    
    if (ObjectId.isValid(referenceNumber)) {
      invoice = await invoicesCollection.findOne({
        _id: new ObjectId(referenceNumber),
      });
    }

    // If not found by _id, try to find by ref field
    if (!invoice) {
      invoice = await invoicesCollection.findOne({
        ref: referenceNumber,
      });
    }

    if (!invoice) {
      return { success: false, error: "Invoice not found with this reference number" };
    }

    // Get issuer user info
    const { getUserById } = await import("@/lib/db/utils");
    const issuer = await getUserById(invoice.issuerUserId.toString());
    
    // Get recipient wallet info
    const { getWalletByWalletId } = await import("@/lib/db/utils");
    const recipientWallet = await getWalletByWalletId(invoice.recipientWalletId);

    return {
      success: true,
      invoice: {
        _id: invoice._id?.toString(),
        issuerUserId: invoice.issuerUserId.toString(),
        issuerEmail: issuer?.email || "Unknown",
        recipientWalletId: invoice.recipientWalletId,
        amountCents: invoice.amountCents,
        amount: invoice.amountCents / 100, // Convert to dollars
        purpose: invoice.purpose,
        note: invoice.note,
        status: invoice.status,
        ref: invoice.ref || invoice._id?.toString(),
        createdAt: invoice.createdAt.toISOString(),
        paidAt: invoice.paidAt?.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error getting invoice by reference:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get invoice",
    };
  }
}

/**
 * Pay invoice by reference number
 * Deducts amount + 5% fee from payer, credits issuer, sends 5% to Admin
 */
export async function payInvoiceByRef(
  referenceNumber: string,
  payerUserId: string,
  payerEmail?: string
) {
  try {
    if (!referenceNumber || !payerUserId) {
      return { success: false, error: "Reference number and user ID are required" };
    }

    // Get MongoDB user ID for payer
    let payerMongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(payerUserId)) {
      payerMongoUserId = new ObjectId(payerUserId);
    } else if (payerEmail) {
      const { getMongoUserId } = await import("./wallet");
      payerMongoUserId = await getMongoUserId(payerUserId, payerEmail);
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!payerMongoUserId) {
      return { success: false, error: "User not found in database." };
    }

    // Get invoice
    const invoiceResult = await getInvoiceByRef(referenceNumber);
    if (!invoiceResult.success || !invoiceResult.invoice) {
      return { success: false, error: invoiceResult.error || "Invoice not found" };
    }

    const invoice = invoiceResult.invoice;

    // Check if already paid
    if (invoice.status === "paid") {
      return { success: false, error: "This invoice has already been paid" };
    }

    // Get payer wallet
    const { getWalletByUserId } = await import("@/lib/db/utils");
    const payerWallet = await getWalletByUserId(payerMongoUserId);
    if (!payerWallet) {
      return { success: false, error: "Wallet not found. Please complete KYC approval first." };
    }

    // Check wallet status
    if (payerWallet.status !== "active") {
      return { success: false, error: `Wallet is ${payerWallet.status}. Payments are not allowed.` };
    }

    // Verify payer is the recipient (invoice is sent to their wallet)
    if (payerWallet.walletId !== invoice.recipientWalletId) {
      return { success: false, error: "This invoice is not addressed to your wallet" };
    }

    // Check if payer is admin (admin accounts are exempt from fees)
    const { getUserById } = await import("@/lib/db/utils");
    const payerUser = await getUserById(payerMongoUserId);
    const isAdmin = payerUser?.role === "admin";

    // Get invoice fee percentage from system settings
    const { getSystemSettings } = await import("./system-settings");
    const settingsResult = await getSystemSettings();
    const invoiceFeePercentage = settingsResult.success && settingsResult.settings
      ? settingsResult.settings.invoiceFeePercentage
      : 5; // Default to 5% if settings not available

    // Calculate amounts
    // Admin accounts are exempt from fees
    const amountCents = invoice.amountCents;
    const feeCents = isAdmin ? 0 : Math.round(amountCents * (invoiceFeePercentage / 100)); // Dynamic fee percentage
    const totalDeductedCents = amountCents + feeCents;

    // Check sufficient balance
    if (payerWallet.balance < totalDeductedCents) {
      return { success: false, error: "Insufficient funds to pay this invoice" };
    }

    // Additional check: ensure balance won't go negative
    if (payerWallet.balance - totalDeductedCents < 0) {
      return { success: false, error: "Insufficient funds. Balance cannot go negative." };
    }

    // Get issuer wallet (reuse the import from above)
    const issuerWallet = await getWalletByUserId(new ObjectId(invoice.issuerUserId));
    if (!issuerWallet) {
      return { success: false, error: "Issuer wallet not found" };
    }

    // Get or create Admin wallet for fees
    const { getCollection } = await import("@/lib/db");
    const { COLLECTIONS } = await import("@/lib/db/models");
    const { getWalletByUserId: getWalletByUserIdUtil, createWallet } = await import("@/lib/db/utils");
    
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const adminUsers = await usersCollection.find({ role: "admin" }).toArray();
    
    if (adminUsers.length === 0) {
      return { success: false, error: "No admin user found. Cannot process fee." };
    }
    
    const adminUser = adminUsers[0];
    let adminWallet = await getWalletByUserIdUtil(adminUser._id!.toString());
    
    if (!adminWallet) {
      adminWallet = await createWallet(adminUser._id!, 0);
    }
    
    if (!adminWallet) {
      return { success: false, error: "Failed to create admin wallet for fees." };
    }

    const walletsCollection = await getCollection<WalletModel>(COLLECTIONS.WALLETS);
    const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
    const invoicesCollection = await getCollection<InvoiceModel>(COLLECTIONS.INVOICES);
    const feesCollection = await getCollection(COLLECTIONS.FEES);

    // Generate reference number for transaction
    const transactionRef = generateReferenceNumber();

    // Start transaction (using MongoDB transactions if possible, otherwise sequential updates)
    try {
      // 1. Deduct from payer wallet (with validation to prevent negative balance)
      const updatedPayerWallet = await walletsCollection.findOneAndUpdate(
        { _id: payerWallet._id, balance: { $gte: totalDeductedCents } },
        { $inc: { balance: -totalDeductedCents }, $set: { updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      
      if (!updatedPayerWallet) {
        return { success: false, error: "Insufficient balance or balance would go negative" };
      }
      
      // Verify balance is not negative after update
      if (updatedPayerWallet.balance < 0) {
        // Rollback: restore balance
        await walletsCollection.updateOne(
          { _id: payerWallet._id },
          { $inc: { balance: totalDeductedCents }, $set: { updatedAt: new Date() } }
        );
        return { success: false, error: "Balance cannot go negative. Transaction prevented." };
      }

      // 2. Credit issuer wallet
      await walletsCollection.updateOne(
        { _id: issuerWallet._id },
        { $inc: { balance: amountCents } }
      );

      // 3. Credit Admin wallet (fee) - only if fee is greater than 0
      if (feeCents > 0) {
        await walletsCollection.updateOne(
          { _id: adminWallet._id },
          { $inc: { balance: feeCents } }
        );
      }

      // 4. Create payer transaction (invoice_payment)
      const payerTransaction: TransactionModel = {
        userId: payerMongoUserId,
        type: "invoice_payment",
        amount: amountCents,
        feeCents: feeCents,
        fromWalletId: payerWallet.walletId,
        toWalletId: issuerWallet.walletId,
        ref: transactionRef,
        status: "success",
        meta: {
          invoiceId: new ObjectId(invoice._id!),
        },
        createdAt: new Date(),
      };
      await transactionsCollection.insertOne(payerTransaction);

      // 5. Create issuer transaction (receive)
      const issuerTransaction: TransactionModel = {
        userId: new ObjectId(invoice.issuerUserId),
        type: "receive",
        amount: amountCents,
        fromWalletId: payerWallet.walletId,
        toWalletId: issuerWallet.walletId,
        ref: transactionRef,
        status: "success",
        meta: {
          invoiceId: new ObjectId(invoice._id!),
        },
        createdAt: new Date(),
      };
      await transactionsCollection.insertOne(issuerTransaction);

      // 6. Record fee in fee ledger - only if fee is greater than 0 (admin accounts are exempt)
      if (feeCents > 0) {
        await feesCollection.insertOne({
          type: "transaction",
          amount: feeCents,
          percentage: invoiceFeePercentage,
          userId: payerMongoUserId,
          transactionId: payerTransaction._id,
          createdAt: new Date(),
        });
      }

      // 7. Update invoice status
      await invoicesCollection.updateOne(
        { _id: new ObjectId(invoice._id!) },
        {
          $set: {
            status: "paid",
            paidAt: new Date(),
          },
        }
      );

      // 8. Create notification for invoice issuer
      const { createNotification } = await import("./notifications");
      await createNotification({
        userId: invoice.issuerUserId.toString(),
        type: "transaction",
        title: "Invoice Paid",
        message: `Your invoice (${invoice.ref}) for ${(amountCents / 100).toFixed(2)} has been paid by ${payerWallet.walletId}`,
        link: "/wallet/invoices",
        meta: {
          transactionId: issuerTransaction._id?.toString(),
        },
      });

      return {
        success: true,
        message: "Invoice paid successfully",
        transactionRef,
        amount: invoice.amount,
        fee: feeCents / 100,
        totalDeducted: totalDeductedCents / 100,
      };
    } catch (error) {
      console.error("Error processing invoice payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process payment",
      };
    }
  } catch (error) {
    console.error("Error paying invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pay invoice",
    };
  }
}

/**
 * Create a new invoice/receipt
 * Validates recipient wallet, prevents self-invoicing, and creates invoice record
 */
export async function createInvoice(
  issuerUserId: string,
  recipientWalletId: string,
  itemDescription: string,
  amount: number,
  quantity?: number,
  note?: string,
  email?: string
) {
  try {
    // ===== STEP 1: Basic Input Validation =====
    if (!issuerUserId || !recipientWalletId || !itemDescription || !amount) {
      return { success: false, error: "All required fields must be provided" };
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    if (quantity !== undefined && quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0 if provided" };
    }

    // ===== STEP 2: Validate Recipient Wallet ID Format =====
    const walletIdPattern = /^[A-Z]{3}\d{3}$/i;
    const normalizedWalletId = recipientWalletId.trim().toUpperCase();
    if (!walletIdPattern.test(normalizedWalletId)) {
      return { success: false, error: "Invalid Wallet ID format. Please enter a valid Wallet ID (e.g., VXE445)" };
    }

    // ===== STEP 3: Get and Validate Issuer =====
    let issuerMongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(issuerUserId)) {
      issuerMongoUserId = new ObjectId(issuerUserId);
    } else if (email) {
      const { getMongoUserId } = await import("./wallet");
      issuerMongoUserId = await getMongoUserId(issuerUserId, email);
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!issuerMongoUserId) {
      return { success: false, error: "User not found in database. Please sign up or contact support." };
    }

    // Get issuer wallet
    const { getWalletByUserId } = await import("@/lib/db/utils");
    const issuerWallet = await getWalletByUserId(issuerMongoUserId);
    if (!issuerWallet) {
      return { success: false, error: "Your wallet not found. Please complete KYC approval first." };
    }

    // Check issuer wallet status
    if (issuerWallet.status !== "active") {
      return { success: false, error: `Your wallet is ${issuerWallet.status}. You cannot create invoices.` };
    }

    // ===== STEP 4: Validate Recipient Wallet =====
    const { getWalletByWalletId } = await import("@/lib/db/utils");
    const recipientWallet = await getWalletByWalletId(normalizedWalletId);
    if (!recipientWallet) {
      return { success: false, error: "Recipient wallet not found. Please check the Wallet ID." };
    }

    // Check recipient wallet status
    if (recipientWallet.status !== "active") {
      return { success: false, error: `Recipient wallet is ${recipientWallet.status}. Cannot send invoice to this wallet.` };
    }

    // ===== STEP 5: Prevent Self-Invoicing =====
    if (issuerWallet.walletId === normalizedWalletId) {
      return { success: false, error: "You cannot send an invoice to your own wallet." };
    }

    // ===== STEP 6: Calculate Total Amount =====
    // Convert amount from dollars to cents
    const amountCents = Math.round(amount * 100);
    if (amountCents <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    // Calculate total (amount × quantity if quantity is provided, otherwise just amount)
    const totalCents = quantity ? Math.round(amountCents * quantity) : amountCents;

    // ===== STEP 7: Create Invoice Record =====
    const { getCollection } = await import("@/lib/db");
    const invoicesCollection = await getCollection<InvoiceModel>(COLLECTIONS.INVOICES);
    
    // Generate reference number
    const ref = generateReferenceNumber();

    const newInvoice: InvoiceModel = {
      issuerUserId: issuerMongoUserId,
      recipientWalletId: normalizedWalletId,
      amountCents: totalCents,
      purpose: itemDescription,
      note: note,
      status: "unpaid",
      ref: ref,
      createdAt: new Date(),
    };

    const result = await invoicesCollection.insertOne(newInvoice);

    return {
      success: true,
      message: "Invoice created and sent successfully",
      invoiceId: result.insertedId.toString(),
      ref: ref,
      amount: totalCents / 100,
    };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create invoice",
    };
  }
}

/**
 * Delete an invoice (only for paid invoices)
 * 
 * Rules:
 * - Sender (issuer) can delete invoices they issued that have been paid
 * - Receiver (recipient) can delete invoices they paid
 * - Only paid invoices can be deleted
 * 
 * @param invoiceId - Invoice ID or reference number
 * @param userId - User ID requesting deletion
 * @param email - User's email (for lookup if userId is not ObjectId)
 * @returns Success status
 */
export async function deleteInvoice(
  invoiceId: string,
  userId: string,
  email?: string
) {
  try {
    if (!invoiceId || !userId) {
      return { success: false, error: "Invoice ID and User ID are required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      const { getMongoUserId } = await import("./wallet");
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found in database." };
    }

    // Get invoice
    const invoiceResult = await getInvoiceByRef(invoiceId);
    if (!invoiceResult.success || !invoiceResult.invoice) {
      return { success: false, error: invoiceResult.error || "Invoice not found" };
    }

    const invoice = invoiceResult.invoice;

    // Only paid invoices can be deleted
    if (invoice.status !== "paid") {
      return { success: false, error: "Only paid invoices can be deleted" };
    }

    // Get user's wallet to check if they are the recipient
    const { getWalletByUserId } = await import("@/lib/db/utils");
    const userWallet = await getWalletByUserId(mongoUserId);
    
    // Check permissions:
    // 1. User is the issuer (sender) - can delete invoices they issued
    // 2. User is the recipient (has the recipientWalletId) - can delete invoices they paid
    const isIssuer = invoice.issuerUserId === mongoUserId.toString();
    const isRecipient = userWallet && userWallet.walletId === invoice.recipientWalletId;

    if (!isIssuer && !isRecipient) {
      return { 
        success: false, 
        error: "You don't have permission to delete this invoice. Only the sender or receiver can delete paid invoices." 
      };
    }

    // Delete the invoice
    const { getCollection } = await import("@/lib/db");
    const invoicesCollection = await getCollection<InvoiceModel>(COLLECTIONS.INVOICES);
    
    const invoiceObjectId = new ObjectId(invoice._id!);
    const result = await invoicesCollection.deleteOne({ _id: invoiceObjectId });

    if (result.deletedCount === 0) {
      return { success: false, error: "Invoice not found or already deleted" };
    }

    return { 
      success: true, 
      message: "Invoice deleted successfully" 
    };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete invoice",
    };
  }
}

/**
 * Get all invoices for a user (both issued and received)
 */
export async function getUserInvoices(userId: string, email?: string) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      const { getMongoUserId } = await import("./wallet");
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format. Please provide email or sign in again." };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found in database." };
    }

    // Get user's wallet
    const { getWalletByUserId } = await import("@/lib/db/utils");
    const userWallet = await getWalletByUserId(mongoUserId);
    if (!userWallet) {
      return { success: false, error: "Wallet not found. Please complete KYC approval first." };
    }

    const { getCollection } = await import("@/lib/db");
    const invoicesCollection = await getCollection<InvoiceModel>(COLLECTIONS.INVOICES);

    // Get all invoices related to this user (both issued and received)
    const allInvoices = await invoicesCollection
      .find({
        $or: [
          { issuerUserId: mongoUserId },
          { recipientWalletId: userWallet.walletId }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Format invoices for display
    const formatInvoice = async (invoice: InvoiceModel) => {
      const { getUserById, getWalletByWalletId } = await import("@/lib/db/utils");
      const issuer = await getUserById(invoice.issuerUserId);
      const recipientWallet = await getWalletByWalletId(invoice.recipientWalletId);
      const recipient = recipientWallet ? await getUserById(recipientWallet.userId.toString()) : null;

      return {
        _id: invoice._id?.toString(),
        ref: invoice.ref || invoice._id?.toString(),
        issuerEmail: issuer?.email || "Unknown",
        recipientWalletId: invoice.recipientWalletId,
        recipientEmail: recipient?.email || "Unknown",
        amountCents: invoice.amountCents,
        amount: invoice.amountCents / 100,
        purpose: invoice.purpose,
        note: invoice.note,
        status: invoice.status,
        createdAt: invoice.createdAt.toISOString(),
        paidAt: invoice.paidAt?.toISOString(),
        // Store original invoice data for filtering
        _invoice: invoice,
      };
    };

    const formattedInvoices = await Promise.all(
      allInvoices.map((inv) => formatInvoice(inv))
    );

    // Categorize invoices based on payment status and user role
    // "Sent" tab: 
    //   - Invoices you issued (created) that are unpaid (you sent them)
    //   - Invoices you received and paid (paid invoices where you are the recipient - you sent payment)
    // "Received" tab:
    //   - Invoices you received (sent to your wallet) that are unpaid (you received them)
    //   - Invoices you issued that were paid (paid invoices where you are the issuer - you received payment)
    
    const sentInvoices = formattedInvoices.filter((inv) => {
      const isIssuer = inv._invoice.issuerUserId.toString() === mongoUserId.toString();
      const isRecipient = inv._invoice.recipientWalletId === userWallet.walletId;
      
      if (inv.status === "paid") {
        // Paid invoices: show in "Sent" if user is the recipient (they paid it)
        return isRecipient && !isIssuer;
      } else {
        // Unpaid invoices: show in "Sent" if user is the issuer (they sent it)
        return isIssuer && !isRecipient;
      }
    });

    const receivedInvoices = formattedInvoices.filter((inv) => {
      const isIssuer = inv._invoice.issuerUserId.toString() === mongoUserId.toString();
      const isRecipient = inv._invoice.recipientWalletId === userWallet.walletId;
      
      if (inv.status === "paid") {
        // Paid invoices: show in "Received" if user is the issuer (they received payment)
        return isIssuer && !isRecipient;
      } else {
        // Unpaid invoices: show in "Received" if user is the recipient (they received it)
        return isRecipient && !isIssuer;
      }
    });

    // Remove the temporary _invoice field before returning
    const cleanInvoice = (inv: any) => {
      const { _invoice, ...rest } = inv;
      return rest;
    };

    return {
      success: true,
      issued: sentInvoices.map(cleanInvoice),
      received: receivedInvoices.map(cleanInvoice),
    };
  } catch (error) {
    console.error("Error getting user invoices:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get invoices",
    };
  }
}

