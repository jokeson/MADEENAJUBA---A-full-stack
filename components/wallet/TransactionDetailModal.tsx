"use client";

import { useState, useEffect } from "react";
import { deleteTransaction } from "@/lib/server-actions/wallet";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import QRCode from "qrcode";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  userId: string;
  userEmail?: string;
  onDelete: () => void;
}

const TransactionDetailModal = ({
  isOpen,
  onClose,
  transaction,
  userId,
  userEmail,
  onDelete,
}: TransactionDetailModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Generate QR code for reference number when transaction has a ref
  useEffect(() => {
    const generateQRCode = async () => {
      if (transaction?.ref) {
        try {
          const qrDataUrl = await QRCode.toDataURL(transaction.ref, {
            width: 150,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeDataUrl(qrDataUrl);
        } catch (err) {
          console.error("Error generating QR code:", err);
        }
      }
    };
    generateQRCode();
  }, [transaction?.ref]);

  if (!isOpen || !transaction) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setError("");
    setShowDeleteConfirm(false);
    
    try {
      const result = await deleteTransaction(transaction._id, userId, userEmail);
      if (result.success) {
        onDelete();
        onClose();
      } else {
        setError(result.error || "Failed to delete transaction");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Failed to delete transaction");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setError("");
    try {
      // Generate QR code if reference number exists
      let qrCodeForPDF = "";
      if (transaction?.ref) {
        try {
          qrCodeForPDF = await QRCode.toDataURL(transaction.ref, {
            width: 150,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (qrErr) {
          console.error("Error generating QR code for PDF:", qrErr);
        }
      }
      
      // Create HTML content for PDF
      const htmlContent = generateTransactionPDFHTML(transaction, qrCodeForPDF);
      
      // Create a new window and print it as PDF
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setError("Please allow pop-ups to download PDF");
        setDownloading(false);
        return;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        setDownloading(false);
      }, 250);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF");
      setDownloading(false);
    }
  };

  const generateTransactionPDFHTML = (tx: any, qrCodeDataUrl?: string): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Transaction Receipt - ${tx._id}</title>
  <style>
    @media print {
      @page {
        margin: 15mm;
        size: A4;
      }
      body {
        margin: 0;
        padding: 10px;
        font-family: Arial, sans-serif;
      }
    }
    body {
      font-family: Arial, sans-serif;
      padding: 15px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
      font-size: 24px;
    }
    .section {
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 3px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .detail-label {
      font-weight: 600;
      color: #6b7280;
      width: 40%;
    }
    .detail-value {
      color: #111827;
      width: 60%;
      text-align: right;
    }
    .amount-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      margin: 15px 0;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
    }
    .amount-value {
      font-size: 32px;
      font-weight: bold;
    }
    .footer {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-success {
      background-color: #d1fae5;
      color: #065f46;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-failed {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .qrcode-container {
      text-align: center;
      margin: 15px 0;
      padding: 10px;
    }
    .qrcode-image {
      display: inline-block;
      padding: 0;
    }
    .qrcode-label {
      margin-top: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }
    .qrcode-ref {
      margin-top: 5px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      color: #1f2937;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Transaction Receipt</h1>
    <p style="color: #6b7280; margin: 5px 0;">Kilimanjaro E-Wallet</p>
  </div>

  <div class="amount-box">
    <div class="amount-label">${tx.type === "cash_payout" && tx.note === "paid cash" ? "Payout Amount (Paid to User)" : "Transaction Amount"}</div>
    <div class="amount-value">
      ${tx.type === "send" || tx.type === "request" ? "-" : "+"}
      $${tx.amount.toFixed(2)}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Transaction Information</div>
    <div class="detail-row">
      <span class="detail-label">Transaction ID:</span>
      <span class="detail-value" style="font-family: monospace; font-size: 12px;">${tx._id}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Type:</span>
      <span class="detail-value" style="text-transform: capitalize;">${tx.type === "cash_payout" && tx.note === "paid cash" ? "cash payout" : tx.type === "cash_payout" ? "withdraw" : tx.type}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Status:</span>
      <span class="detail-value">
        <span class="status-badge status-${tx.type === "cash_payout" && tx.note === "paid cash" ? "success" : tx.status}">${tx.type === "cash_payout" && tx.note === "paid cash" ? "Paid" : tx.status}</span>
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Date & Time:</span>
      <span class="detail-value">${new Date(tx.createdAt).toLocaleString()}</span>
    </div>
    ${tx.ref ? `
    <div class="detail-row">
      <span class="detail-label">Reference Number:</span>
      <span class="detail-value" style="font-family: monospace;">${tx.ref}</span>
    </div>
    ` : ""}
  </div>

  ${tx.ref && qrCodeDataUrl ? `
  <div class="qrcode-container">
    <div class="qrcode-label">Reference Number QR Code</div>
    <div class="qrcode-image">
      <img src="${qrCodeDataUrl}" alt="QR Code - Reference Number: ${tx.ref}" style="width: 150px; height: 150px;" />
    </div>
    <div class="qrcode-ref">${tx.ref}</div>
  </div>
  ` : ""}

  ${tx.fromWalletId || tx.toWalletId ? `
  <div class="section">
    <div class="section-title">Wallet Information</div>
    ${tx.fromWalletId ? `
    <div class="detail-row">
      <span class="detail-label">From Wallet:</span>
      <span class="detail-value" style="font-family: monospace;">${tx.fromWalletId}</span>
    </div>
    ` : ""}
    ${tx.toWalletId ? `
    <div class="detail-row">
      <span class="detail-label">To Wallet:</span>
      <span class="detail-value" style="font-family: monospace;">${tx.toWalletId}</span>
    </div>
    ` : ""}
  </div>
  ` : ""}

  ${tx.feeCents && tx.type !== "cash_payout" ? `
  <div class="section">
    <div class="section-title">Fee Information</div>
    <div class="detail-row">
      <span class="detail-label">System Fee:</span>
      <span class="detail-value">$${tx.feeCents.toFixed(2)}</span>
    </div>
  </div>
  ` : ""}

  <div class="footer">
    <p>This is an official transaction receipt from Kilimanjaro E-Wallet</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p style="margin-top: 10px; font-size: 10px; color: #9ca3af;">
      Transaction ID: ${tx._id}
    </p>
  </div>
</body>
</html>
    `;
  };

  const getTransactionTypeColor = () => {
    return { color: '#800000' };
  };

  const getTransactionTypeBg = (type: string) => {
    switch (type) {
      case "send":
      case "request":
        return "bg-red-100";
      case "receive":
      case "deposit":
      case "redeem":
        return "bg-green-100";
      default:
        return "bg-blue-100";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-3 sm:m-0" style={{ backgroundColor: '#d6d6c2' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold" style={{ color: '#800000' }}>
              Transaction Details
            </h3>
            <button
              onClick={onClose}
              className="text-[#800000]/50 hover:text-[#800000]"
              tabIndex={0}
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Transaction Type Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getTransactionTypeBg(
                  transaction.type
                )}`}
                style={getTransactionTypeColor()}
              >
                {transaction.type === "cash_payout" && transaction.note === "paid cash"
                  ? "paid cash"
                  : transaction.type === "cash_payout"
                  ? "withdraw"
                  : transaction.type.replace("_", " ")}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  transaction.type === "cash_payout" && transaction.note === "paid cash"
                    ? "bg-green-100 text-green-800"
                    : transaction.status === "success"
                    ? "bg-green-100 text-green-800"
                    : transaction.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {transaction.type === "cash_payout" && transaction.note === "paid cash"
                  ? "Paid"
                  : transaction.status}
              </span>
            </div>

            {/* Amount */}
            <div className="text-center py-4 border-b">
              <p className="text-sm mb-2" style={{ color: '#800000' }}>Amount</p>
              <p
                className="text-4xl font-bold"
                style={{ color: '#800000' }}
              >
                {transaction.type === "send" || transaction.type === "request"
                  ? "-"
                  : "+"}
                ${transaction.amount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: '#800000' }}>Transaction ID</p>
                  <p className="text-sm font-mono break-all" style={{ color: '#800000' }}>
                    {transaction._id}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#800000' }}>Date & Time</p>
                  <p className="text-sm" style={{ color: '#800000' }}>
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {transaction.ref && (
                <div>
                  <p className="text-sm mb-1" style={{ color: '#800000' }}>Reference Number</p>
                  <p className="text-sm font-mono" style={{ color: '#800000' }}>
                    {transaction.ref}
                  </p>
                </div>
              )}

              {transaction.fromWalletId && (
                <div>
                  <p className="text-sm mb-1" style={{ color: '#800000' }}>From Wallet</p>
                  <p className="text-sm font-mono" style={{ color: '#800000' }}>
                    {transaction.fromWalletId}
                  </p>
                </div>
              )}

              {transaction.toWalletId && (
                <div>
                  <p className="text-sm mb-1" style={{ color: '#800000' }}>To Wallet</p>
                  <p className="text-sm font-mono" style={{ color: '#800000' }}>
                    {transaction.toWalletId}
                  </p>
                </div>
              )}

              {/* Show 5% fee for paid cash transactions */}
              {transaction.type === "cash_payout" && transaction.note === "paid cash" && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm mb-1" style={{ color: '#800000' }}>Payout Amount (Paid to User)</p>
                    <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                      ${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm mb-1" style={{ color: '#800000' }}>5% System Fee</p>
                    <p className="text-sm font-semibold text-red-600">
                      ${(transaction.amount / 19).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm mb-1" style={{ color: '#800000' }}>Original Withdrawal Amount</p>
                    <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                      ${(transaction.amount / 0.95).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {transaction.feeCents && transaction.type !== "cash_payout" && (
                <div>
                  <p className="text-sm mb-1" style={{ color: '#800000' }}>System Fee</p>
                  <p className="text-sm" style={{ color: '#800000' }}>
                    ${transaction.feeCents.toFixed(2)}
                  </p>
                </div>
              )}

              {transaction.note && (
                <div>
                  <p className="text-sm mb-1" style={{ color: '#800000' }}>Note</p>
                  <p className="text-sm" style={{ color: '#800000' }}>{transaction.note}</p>
                </div>
              )}

              {/* QR Code Display for Reference Number */}
              {transaction.ref && qrCodeDataUrl && (
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <div className="text-center">
                    <p className="text-sm font-semibold mb-3" style={{ color: '#800000' }}>
                      Reference Number QR Code
                    </p>
                    <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-300 shadow-md">
                      <img 
                        src={qrCodeDataUrl} 
                        alt={`QR Code - Reference: ${transaction.ref}`}
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <p className="text-xs mt-3 text-[#800000]">
                      Scan this QR code to retrieve the reference number for cash withdrawal
                    </p>
                    <p className="text-sm font-mono font-bold mt-2" style={{ color: '#800000' }}>
                      {transaction.ref}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t p-6 flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex-1 px-4 py-2 text-white rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: '#800000' }}
              onMouseEnter={(e) => !downloading && (e.currentTarget.style.backgroundColor = '#6b0000')}
              onMouseLeave={(e) => !downloading && (e.currentTarget.style.backgroundColor = '#800000')}
              tabIndex={0}
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="flex-1 px-4 py-2 text-white rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: '#800000' }}
              onMouseEnter={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#6b0000')}
              onMouseLeave={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#800000')}
              tabIndex={0}
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Transaction
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        isLoading={deleting}
      />
    </div>
  );
};

export default TransactionDetailModal;

