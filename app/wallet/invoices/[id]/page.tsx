"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { getInvoiceByRef, deleteInvoice } from "@/lib/server-actions/invoices";
import QRCode from "qrcode";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface InvoiceDetail {
  _id?: string;
  ref?: string;
  issuerUserId: string;
  issuerEmail: string;
  recipientWalletId: string;
  amountCents: number;
  amount: number;
  purpose?: string;
  note?: string;
  status: "unpaid" | "paid";
  createdAt: string;
  paidAt?: string;
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [canDelete, setCanDelete] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/sign-in");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || typeof id !== "string") {
        setError("Invalid invoice ID");
        setLoadingInvoice(false);
        return;
      }

      try {
        setLoadingInvoice(true);
        setError("");
        const result = await getInvoiceByRef(id);
        if (result.success && result.invoice) {
          setInvoice(result.invoice);
          
          // Generate QR code for the invoice reference
          if (result.invoice.ref) {
            try {
              const qrDataUrl = await QRCode.toDataURL(result.invoice.ref, {
                width: 200,
                margin: 1,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              });
              setQrCodeDataUrl(qrDataUrl);
            } catch (qrErr) {
              console.error("Error generating QR code:", qrErr);
            }
          }

          // Check if user can delete this invoice
          // Only paid invoices can be deleted
          // Show delete button if invoice is paid - server will verify permissions
          if (result.invoice.status === "paid" && user) {
            // Check if user is the issuer (sender)
            const isIssuer = result.invoice.issuerUserId === user.id;
            
            // For recipient check, we'll show the button and let server verify
            // Server action will check if user's wallet matches recipientWalletId
            setCanDelete(true); // Show button for paid invoices, server verifies permissions
          } else {
            setCanDelete(false);
          }
        } else {
          setError(result.error || "Failed to load invoice");
        }
      } catch (err) {
        setError("An error occurred while loading invoice");
        console.error("Error fetching invoice:", err);
      } finally {
        setLoadingInvoice(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: "unpaid" | "paid") => {
    if (status === "paid") {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
          Paid
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Unpaid
      </span>
    );
  };

  const generateInvoicePDFHTML = (inv: InvoiceDetail, qrCodeDataUrl?: string): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${inv.ref || inv._id}</title>
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
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #800000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #800000;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      color: #666;
      margin: 5px 0;
      font-size: 14px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .info-box {
      flex: 1;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
      margin: 0 10px;
    }
    .info-box:first-child {
      margin-left: 0;
    }
    .info-box:last-child {
      margin-right: 0;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .info-value {
      font-size: 16px;
      color: #000;
      font-weight: bold;
    }
    .amount-section {
      background: linear-gradient(135deg, #e6e6e6 0%, #e6e6e6 100%);
      color: black;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      margin: 25px 0;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
    }
    .amount-value {
      font-size: 36px;
      font-weight: bold;
    }
    .details-section {
      margin: 20px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #800000;
      margin-bottom: 15px;
      border-bottom: 2px solid #800000;
      padding-bottom: 5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #666;
      width: 40%;
    }
    .detail-value {
      color: #000;
      width: 60%;
      text-align: right;
      font-weight: 500;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-paid {
      background-color: #e6e6e6;
      color: black;
    }
    .status-unpaid {
      background-color: #fef3c7;
      color: #92400e;
    }
    .qrcode-container {
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
    .qrcode-image {
      display: inline-block;
      padding: 10px;
      background-color: white;
      border-radius: 8px;
    }
    .qrcode-label {
      margin-top: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }
    .qrcode-ref {
      margin-top: 5px;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      color: #000;
      letter-spacing: 1px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 11px;
    }
    .note-section {
      margin-top: 20px;
      padding: 15px;
      background-color: #fff9e6;
      border-left: 4px solid #800000;
      border-radius: 4px;
    }
    .note-label {
      font-weight: bold;
      color: #800000;
      margin-bottom: 5px;
    }
    .note-text {
      color: #333;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE / RECEIPT</h1>
    <p>Kilimanjaro E-Wallet - MADEENAJUBA</p>
  </div>

  <div class="invoice-info">
    <div class="info-box">
      <div class="info-label">Invoice Number</div>
      <div class="info-value" style="font-family: monospace;">${inv.ref || inv._id || "N/A"}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Date</div>
      <div class="info-value">${formatDate(inv.createdAt)}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Status</div>
      <div class="info-value">
        <span class="status-badge status-${inv.status}">${inv.status.toUpperCase()}</span>
      </div>
    </div>
  </div>

  <div class="amount-section">
    <div class="amount-label">Total Amount</div>
    <div class="amount-value">$${inv.amount.toFixed(2)}</div>
  </div>

  <div class="details-section">
    <div class="section-title">Invoice Details</div>
    <div class="detail-row">
      <span class="detail-label">Item Description:</span>
      <span class="detail-value">${inv.purpose || "N/A"}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">From (Issuer):</span>
      <span class="detail-value">${inv.issuerEmail}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">To (Recipient Wallet):</span>
      <span class="detail-value" style="font-family: monospace;">${inv.recipientWalletId}</span>
    </div>
    ${inv.paidAt ? `
    <div class="detail-row">
      <span class="detail-label">Paid On:</span>
      <span class="detail-value">${formatDate(inv.paidAt)}</span>
    </div>
    ` : ""}
  </div>

  ${inv.note ? `
  <div class="note-section">
    <div class="note-label">Additional Notes:</div>
    <div class="note-text">${inv.note}</div>
  </div>
  ` : ""}

  ${inv.ref && qrCodeDataUrl ? `
  <div class="qrcode-container">
    <div class="qrcode-label">Invoice Reference QR Code</div>
    <div class="qrcode-image">
      <img src="${qrCodeDataUrl}" alt="QR Code - Invoice: ${inv.ref}" style="width: 150px; height: 150px;" />
    </div>
    <div class="qrcode-ref">${inv.ref}</div>
  </div>
  ` : ""}

  <div class="footer">
    <p><strong>This is an official invoice/receipt from Kilimanjaro E-Wallet</strong></p>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p style="margin-top: 10px; font-size: 10px; color: #999;">
      Invoice ID: ${inv._id || "N/A"}
    </p>
  </div>
</body>
</html>
    `;
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    setDownloading(true);
    setError("");

    try {
      // Generate QR code if reference number exists
      let qrCodeForPDF = "";
      if (invoice.ref) {
        try {
          qrCodeForPDF = await QRCode.toDataURL(invoice.ref, {
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
      const htmlContent = generateInvoicePDFHTML(invoice, qrCodeForPDF);

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

  const handlePrint = () => {
    window.print();
  };

  const handleShareEmail = () => {
    if (!invoice) return;

    const subject = encodeURIComponent(`Invoice ${invoice.ref || invoice._id} - ${invoice.purpose || "Invoice"}`);
    const body = encodeURIComponent(
      `Please find the attached invoice details:\n\n` +
      `Invoice Number: ${invoice.ref || invoice._id}\n` +
      `Amount: $${invoice.amount.toFixed(2)}\n` +
      `Status: ${invoice.status.toUpperCase()}\n` +
      `Date: ${formatDate(invoice.createdAt)}\n\n` +
      `View invoice: ${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareText = async () => {
    if (!invoice) return;

    setShareError("");

    try {
      const text = `Invoice ${invoice.ref || invoice._id}\n` +
        `Amount: $${invoice.amount.toFixed(2)}\n` +
        `Status: ${invoice.status.toUpperCase()}\n` +
        `View: ${window.location.href}`;

      if (navigator.share) {
        await navigator.share({
          title: `Invoice ${invoice.ref || invoice._id}`,
          text: text,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert("Invoice details copied to clipboard!");
      } else {
        setShareError("Sharing is not supported on this device");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Error sharing:", err);
        setShareError("Failed to share invoice");
      }
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoice || !user) return;

    setDeleting(true);
    setError("");

    try {
      const result = await deleteInvoice(
        invoice._id || invoice.ref || "",
        user.id,
        user.email
      );

      if (result.success) {
        // Redirect to invoices list after successful deletion
        router.push("/wallet/invoices");
      } else {
        setError(result.error || "Failed to delete invoice");
        setDeleteModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting invoice:", err);
      setError("An error occurred while deleting invoice");
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || loadingInvoice) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex">
        <Sidebar />
        <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error || "Invoice not found"}
            </div>
            <button
              onClick={() => router.push("/wallet/invoices")}
              className="mt-4 px-6 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#800000' }}
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 xs:pt-24 sm:pt-20 md:pt-12 pb-8 sm:pb-12">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 mt-2 xs:mt-4 sm:mt-2 md:mt-0 text-[#800000] hover:text-[#800000]/80 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#800000' }}>
              Invoice Details
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-6 py-3 text-[#800000] cursor-pointer font-semibold   touch-manipulation flex items-center gap-2"
             
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-3 text-black cursor-pointer font-semibold transition-colors touch-manipulation flex items-center gap-2"
              style={{ color: '#800000' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#800000' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={handleShareEmail}
              className="px-6 py-3  text-[#800000]  font-semibold  cursor-pointer transition-colors touch-manipulation flex items-center gap-2"
           
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Share via Email
            </button>
            <button
              onClick={handleShareText}
              className="px-6 py-3  text-[#800000]  font-semibold  cursor-pointer transition-colors touch-manipulation flex items-center gap-2"
             
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                className="px-6 py-3 cursor-pointer text-[#800000] font-semibold  transition-colors touch-manipulation flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? "Deleting..." : "Delete Invoice"}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {shareError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              {shareError}
            </div>
          )}

          {/* Invoice Details Card */}
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <div className="text-center mb-6 pb-6 border-b-2 border-[#800000]">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#800000' }}>
                INVOICE / RECEIPT
              </h2>
              <p className="text-sm text-gray-600">Kilimanjaro E-Wallet - MADEENAJUBA</p>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#f5f5f0] p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Invoice Number</p>
                <p className="text-lg font-bold font-mono" style={{ color: '#800000' }}>
                  {invoice.ref || invoice._id || "N/A"}
                </p>
              </div>
              <div className="bg-[#f5f5f0] p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Date</p>
                <p className="text-lg font-bold" style={{ color: '#800000' }}>
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              <div className="bg-[#f5f5f0] p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Status</p>
                <div className="mt-1">{getStatusBadge(invoice.status)}</div>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-gradient-to-r from-[#800000] to-[#6b0000] text-white p-6 rounded-lg text-center mb-6">
              <p className="text-sm opacity-90 mb-2 text-white">Total Amount</p>
              <p className="text-4xl font-bold text-white">${invoice.amount.toFixed(2)}</p>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Item Description</p>
                <p className="text-lg font-semibold" style={{ color: '#800000' }}>
                  {invoice.purpose || "N/A"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">From (Issuer)</p>
                  <p className="text-base font-semibold" style={{ color: '#800000' }}>
                    {invoice.issuerEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">To (Recipient Wallet)</p>
                  <p className="text-base font-semibold font-mono" style={{ color: '#800000' }}>
                    {invoice.recipientWalletId}
                  </p>
                </div>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Paid On</p>
                  <p className="text-base font-semibold" style={{ color: '#800000' }}>
                    {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {invoice.note && (
              <div className="bg-yellow-50 border-l-4 border-[#800000] p-4 rounded mb-6">
                <p className="text-sm font-semibold mb-2" style={{ color: '#800000' }}>
                  Additional Notes:
                </p>
                <p className="text-sm text-gray-700">{invoice.note}</p>
              </div>
            )}

            {/* QR Code */}
            {invoice.ref && qrCodeDataUrl && (
              <div className="text-center mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Invoice Reference QR Code</p>
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                  <img 
                    src={qrCodeDataUrl} 
                    alt={`QR Code - Invoice: ${invoice.ref}`}
                    className="w-48 h-48"
                  />
                </div>
                <p className="mt-3 text-sm font-mono font-semibold" style={{ color: '#800000' }}>
                  {invoice.ref}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>This is an official invoice/receipt from Kilimanjaro E-Wallet</p>
              <p className="mt-1">Generated on {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Invoice"
            message="Are you sure you want to delete this invoice? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            isLoading={deleting}
          />
        </div>
      </div>
    </div>
  );
}
