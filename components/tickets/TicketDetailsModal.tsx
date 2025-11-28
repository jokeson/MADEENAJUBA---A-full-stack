"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/format";
import QRCode from "qrcode";

interface TicketDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    ticketNumber: number;
    eventTitle: string;
    eventImage?: string;
    quantity: number;
    totalPaidCents: number;
    createdAt: string;
    eventDate?: string;
    eventTime?: string;
    eventLocation?: string;
    referenceNumber?: string;
    serialNumber?: string;
  };
  onDelete: () => void;
}

const TicketDetailsModal = ({
  isOpen,
  onClose,
  ticket,
  onDelete,
}: TicketDetailsModalProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Generate QR code
      const generateQR = async () => {
        try {
          const qrData = JSON.stringify({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            serialNumber: ticket.serialNumber || "",
            eventTitle: ticket.eventTitle,
            purchaseDate: ticket.createdAt,
            referenceNumber: ticket.referenceNumber || "",
          });
          const url = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeDataUrl(url);
        } catch (err) {
          console.error("Error generating QR code:", err);
        }
      };
      generateQR();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, ticket]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    if (!ticketRef.current) return;

    // Wait for QR code to be ready
    if (!qrCodeDataUrl) {
      alert("Please wait for the QR code to load before downloading.");
      return;
    }

    // Import html2pdf dynamically
    import("html2pdf.js").then((html2pdf) => {
      const element = ticketRef.current;
      if (!element) return;

      const opt = {
        margin: 0.5,
        filename: `ticket-${ticket.ticketNumber}-${ticket.eventTitle.replace(/[^a-z0-9]/gi, "_")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
      };

      html2pdf.default().set(opt).from(element).save();
    });
  };

  const handlePrint = () => {
    if (!ticketRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get the ticket content HTML
    const ticketContent = ticketRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket #${ticket.ticketNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
              background: #f3f4f6;
            }
            .max-w-lg {
              max-width: 32rem;
            }
            .mx-auto {
              margin-left: auto;
              margin-right: auto;
            }
            .bg-white {
              background-color: #ffffff;
            }
            .border-2 {
              border-width: 2px;
            }
            .border-\\[\\#800000\\] {
              border-color: #800000;
            }
            .rounded-lg {
              border-radius: 0.5rem;
            }
            .overflow-hidden {
              overflow: hidden;
            }
            .shadow-lg {
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .bg-gray-500 {
              background-color: #6b7280;
            }
            .text-white {
              color: #ffffff;
            }
            .p-6 {
              padding: 1.5rem;
            }
            .text-center {
              text-align: center;
            }
            .text-3xl {
              font-size: 1.875rem;
              line-height: 2.25rem;
            }
            .text-lg {
              font-size: 1.125rem;
              line-height: 1.75rem;
            }
            .font-bold {
              font-weight: 700;
            }
            .mb-2 {
              margin-bottom: 0.5rem;
            }
            .mb-4 {
              margin-bottom: 1rem;
            }
            .mb-6 {
              margin-bottom: 1.5rem;
            }
            .opacity-90 {
              opacity: 0.9;
            }
            .flex {
              display: flex;
            }
            .justify-center {
              justify-content: center;
            }
            .items-center {
              align-items: center;
            }
            .bg-gray-50 {
              background-color: #f9fafb;
            }
            .bg-gray-100 {
              background-color: #f3f4f6;
            }
            .bg-gray-200 {
              background-color: #e5e7eb;
            }
            .p-3 {
              padding: 0.75rem;
            }
            .p-4 {
              padding: 1rem;
            }
            .border-2 {
              border-width: 2px;
            }
            .border-t-2 {
              border-top-width: 2px;
            }
            .rounded-lg {
              border-radius: 0.5rem;
            }
            .w-48 {
              width: 12rem;
            }
            .h-48 {
              height: 12rem;
            }
            .text-sm {
              font-size: 0.875rem;
              line-height: 1.25rem;
            }
            .text-xs {
              font-size: 0.75rem;
              line-height: 1rem;
            }
            .text-2xl {
              font-size: 1.5rem;
              line-height: 2rem;
            }
            .text-gray-500 {
              color: #6b7280;
            }
            .text-gray-600 {
              color: #4b5563;
            }
            .text-gray-800 {
              color: #000000;
            }
            .text-black {
              color: #000000;
            }
            .font-semibold {
              font-weight: 600;
            }
            .space-y-4 > * + * {
              margin-top: 1rem;
            }
            .grid {
              display: grid;
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .gap-4 {
              gap: 1rem;
            }
            .mb-1 {
              margin-bottom: 0.25rem;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 10px; 
                background: white;
              }
              @page { 
                margin: 0.5in; 
                size: letter;
              }
              .bg-gray-50 {
                background: #f9fafb !important;
              }
              .bg-gray-100 {
                background: #f3f4f6 !important;
              }
              .bg-gray-500 {
                background: #6b7280 !important;
              }
            }
          </style>
        </head>
        <body>
          ${ticketContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "#800000" }}>
            Ticket Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            tabIndex={0}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Ticket Content (for PDF/Print) */}
        <div ref={ticketRef} style={{ padding: "24px", backgroundColor: "#f3f4f6" }}>
          <div style={{ maxWidth: "512px", margin: "0 auto", backgroundColor: "#ffffff" }}>
            {/* Header */}
            <div style={{ backgroundColor: "#ffffff", color: "#000000", padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "30px", fontWeight: "700", marginBottom: "8px" }}>E-TICKET</div>
              <div style={{ fontSize: "18px", opacity: "0.9" }}>{ticket.eventTitle}</div>
            </div>

            {/* Ticket Body */}
            <div style={{ padding: "24px" }}>
              {/* QR Code Section - Center */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                {qrCodeDataUrl ? (
                  <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "8px" }}>
                    <img
                      src={qrCodeDataUrl}
                      alt="Ticket QR Code"
                      style={{ width: "192px", height: "192px", display: "block" }}
                    />
                  </div>
                ) : (
                  <div style={{ width: "192px", height: "192px", backgroundColor: "#f3f4f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "#9ca3af" }}>Loading QR Code...</div>
                  </div>
                )}
              </div>

              {/* Ticket Details */}
              <div>
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Ticket Number</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#000000" }}>
                    #{ticket.ticketNumber}
                  </div>
                </div>

                {ticket.referenceNumber && (
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Reference Number</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#000000" }}>
                      {ticket.referenceNumber}
                    </div>
                  </div>
                )}
                {ticket.serialNumber && (
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Serial Number</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#000000", fontFamily: "monospace" }}>
                      {ticket.serialNumber}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  {ticket.eventDate && (
                    <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Date</div>
                      <div style={{ fontWeight: "600", color: "#000000" }}>{formatDate(ticket.eventDate)}</div>
                    </div>
                  )}
                  {ticket.eventTime && (
                    <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Time</div>
                      <div style={{ fontWeight: "600", color: "#000000" }}>{ticket.eventTime}</div>
                    </div>
                  )}
                </div>

                {ticket.eventLocation && (
                  <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Location</div>
                    <div style={{ fontWeight: "600", color: "#000000" }}>{ticket.eventLocation}</div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Price</div>
                    <div style={{ fontWeight: "700", fontSize: "18px", color: "#000000" }}>
                      {formatCurrency(ticket.totalPaidCents / 100 / ticket.quantity)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Quantity</div>
                    <div style={{ fontWeight: "600", color: "#000000" }}>{ticket.quantity}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Purchase Date</div>
                  <div style={{ fontWeight: "600", color: "#000000" }}>{formatDateTime(ticket.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: "#f3f4f6", borderTop: "2px solid #6b7280", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#4b5563", marginBottom: "4px" }}>Powered by</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#6b7280" }}>
                Madeenajuba
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex flex-wrap gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 min-w-[120px] px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            tabIndex={0}
          >
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[120px] px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            tabIndex={0}
          >
            Print
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            tabIndex={0}
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            tabIndex={0}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsModal;

