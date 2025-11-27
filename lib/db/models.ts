import { ObjectId } from "mongodb";
import { Role } from "../rbac";

// User Model
export interface UserModel {
  _id?: ObjectId;
  email: string;
  password: string; // Should be hashed in production
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// Wallet Model
export interface WalletModel {
  _id?: ObjectId;
  userId: ObjectId;
  walletId: string; // Format: 3 letters + 3 digits (e.g., VXE445, HUY444, ASF789)
  balance: number; // Stored in cents
  status: "active" | "suspended" | "terminated";
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Model
export interface TransactionModel {
  _id?: ObjectId;
  userId?: ObjectId;
  type: "send" | "receive" | "fee" | "deposit" | "ticket_payout" | "invoice_payment" | "cash_payout" | "redeem";
  amount: number; // Amount in cents
  feeCents?: number; // Fee amount in cents
  fromWalletId?: string; // Sender's wallet ID
  toWalletId?: string; // Recipient's wallet ID
  recipientId?: ObjectId; // Legacy support
  senderId?: ObjectId; // Legacy support
  note?: string;
  ref?: string; // Reference number (e.g., 456778)
  status: "pending" | "completed" | "failed" | "success";
  meta?: {
    eventId?: ObjectId;
    invoiceId?: ObjectId;
    redeemId?: ObjectId;
  };
  createdAt: Date;
}

// Invoice Model
export interface InvoiceModel {
  _id?: ObjectId;
  issuerUserId: ObjectId; // User who created the invoice
  recipientWalletId: string; // Wallet ID of the recipient
  amountCents: number; // Amount in cents
  purpose?: string; // Purpose/description of the invoice
  note?: string; // Additional notes
  status: "unpaid" | "paid"; // Invoice status
  ref?: string; // Reference number (optional, can use _id as ref)
  createdAt: Date;
  paidAt?: Date;
}

// Redeem Code Model
export interface RedeemCodeModel {
  _id?: ObjectId;
  code: string; // Format: ####-####-####-#### (e.g., 7646-6789-7865-5000)
  pin: string; // 4-digit PIN (e.g., 8966)
  amount: number; // Amount in cents
  used: boolean;
  usedBy?: ObjectId;
  usedByWalletId?: string; // Wallet ID that used the code
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  createdBy: ObjectId; // Admin who created it (issuedByAdminId)
}

// KYC Model
export interface KycModel {
  _id?: ObjectId;
  userId: ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  status: "pending" | "approved" | "rejected";
  documents: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: ObjectId;
  rejectionReason?: string;
}

// Fee Model
export interface FeeModel {
  _id?: ObjectId;
  type: "transaction" | "withdrawal" | "deposit";
  amount: number;
  percentage?: number;
  userId?: ObjectId;
  transactionId?: ObjectId;
  deposited?: boolean; // Marks if fee has been deposited to admin wallet
  depositedAt?: Date; // Timestamp when fee was deposited
  createdAt: Date;
}

// Pending Withdrawal Model
export interface PendingWithdrawalModel {
  _id?: ObjectId;
  userId: ObjectId;
  walletId: string;
  amount: number; // Amount in cents (original withdrawal amount in pool)
  ref: string; // Reference number (e.g., 456778)
  status: "pending" | "processed" | "expired" | "cancelled";
  expiresAt: Date; // 24 hours from creation
  createdAt: Date;
  processedAt?: Date;
  processedBy?: ObjectId; // Finance user who processed it
  feeCents?: number; // 5% system fee deducted from pool amount (in cents)
  payoutAmountCents?: number; // Amount paid to user after 5% fee deduction (in cents)
}

// System Settings Model
export interface SystemSettingsModel {
  _id?: ObjectId;
  p2pFeePercentage: number; // P2P transaction fee percentage (default: 5)
  ticketFeePercentage: number; // Ticket sales fee percentage (default: 10)
  invoiceFeePercentage: number; // Invoice payment fee percentage (default: 5)
  withdrawalFeePercentage: number; // Cash withdrawal fee percentage (default: 5)
  maintenanceMode: boolean; // Maintenance mode flag (default: false)
  maintenanceMessage?: string; // Optional maintenance message
  maxBalanceForDeletion: number; // Maximum wallet balance (in cents) allowed for user deletion (default: 0)
  currency: string; // Application currency code (default: "SSP")
  heroHeadline?: string; // Hero section headline text
  heroSubheadline?: string; // Hero section subheadline text
  heroBackgroundImageUrl?: string; // Hero section background image URL (Cloudinary)
  updatedAt: Date;
  updatedBy?: ObjectId; // Admin who last updated the settings
}

// Event Model
export interface EventModel {
  _id?: ObjectId;
  creatorUserId: ObjectId; // User who created the event
  title: string; // Event title/name
  description: string; // Full event description and details
  startTime: Date; // Event start time
  endTime: Date; // Event end time
  eventDate: Date; // Date of the event
  eventImage?: string; // Event image URL (displayed on landing page)
  isFree: boolean; // Boolean indicating if the event is free or payable
  ticketPriceCents?: number; // Price per ticket in cents (required only if isFree === false)
  ticketQuantity?: number; // Number of tickets available for sale
  status: "PENDING" | "APPROVED" | "REJECTED" | "LIVE" | "ENDED"; // Event status
  rejectedReason?: string; // Reason for rejection (if status is REJECTED)
  reviewedBy?: ObjectId; // Admin who reviewed the event
  reviewedAt?: Date; // When the event was reviewed
  createdAt: Date;
  updatedAt: Date;
}

// Ticket Model
export interface TicketModel {
  _id?: ObjectId;
  eventId: ObjectId; // Event for which ticket was purchased
  buyerUserId: ObjectId; // User who purchased the ticket
  qty: number; // Number of tickets purchased (legacy, kept for backward compatibility)
  totalPaidCents: number; // Total amount paid by buyer (in cents)
  feeCents: number; // System fee deducted (10% of total, in cents)
  netCents: number; // Net amount received by seller (90% of total, in cents)
  deposited?: boolean; // Whether the seller has deposited this revenue
  depositedAt?: Date; // Timestamp when revenue was deposited
  serialNumber?: string; // Unique serial number for this individual ticket
  referenceNumber?: string; // Unique reference number for this individual ticket
  purchaseGroupId?: ObjectId; // ID of the parent purchase record (for grouping tickets from same purchase)
  createdAt: Date;
}

// Collection names constants
export const COLLECTIONS = {
  USERS: "users",
  WALLETS: "wallets",
  TRANSACTIONS: "transactions",
  INVOICES: "invoices",
  REDEEM_CODES: "redeem_codes",
  KYC: "kyc",
  FEES: "fees",
  PENDING_WITHDRAWALS: "pending_withdrawals",
  SYSTEM_SETTINGS: "system_settings",
  EVENTS: "events",
  TICKETS: "tickets",
} as const;

