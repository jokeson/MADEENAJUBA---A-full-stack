"use client";

/**
 * Permission Management Component
 * 
 * This component provides functionality for managing event approvals and rejections.
 * Admins can view pending events with price and ticket information, and approve or reject them.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPendingEvents, approveEvent, rejectEvent } from "@/lib/server-actions/events";
import { formatCurrency, formatDateTime } from "@/lib/format";
import Image from "next/image";

interface PendingEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  eventDate: string;
  eventImage?: string;
  isFree: boolean;
  ticketPriceCents?: number;
  ticketQuantity?: number;
  status: string;
  createdAt: string;
  creatorUserId: string;
}

interface PermissionProps {
  onNotificationRefresh?: () => void; // Optional callback to refresh notification badge
}

const Permission = ({ onNotificationRefresh }: PermissionProps) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getPendingEvents();
        if (result.success) {
          setEvents(result.events);
        } else {
          setError(result.error || "Failed to load pending events");
        }
      } catch (err) {
        console.error("Error loading pending events:", err);
        setError("Failed to load pending events");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleApprove = async (eventId: string) => {
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    setProcessing(eventId);
    setError("");
    setSuccess("");

    try {
      const result = await approveEvent(eventId, user.id);
      if (result.success) {
        setSuccess(result.message || "Event approved successfully");
        // Reload events
        const updatedResult = await getPendingEvents();
        if (updatedResult.success) {
          setEvents(updatedResult.events);
        }
        // Refresh notification badge
        if (onNotificationRefresh) {
          onNotificationRefresh();
        }
      } else {
        setError(result.error || "Failed to approve event");
      }
    } catch (err) {
      console.error("Error approving event:", err);
      setError("Failed to approve event");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectClick = (event: PendingEvent) => {
    setSelectedEvent(event);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedEvent || !user?.id) {
      setError("Missing required information");
      return;
    }

    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setProcessing(selectedEvent.id);
    setError("");
    setSuccess("");

    try {
      const result = await rejectEvent(selectedEvent.id, user.id, rejectReason);
      if (result.success) {
        setSuccess(result.message || "Event rejected successfully");
        setIsRejectModalOpen(false);
        setSelectedEvent(null);
        setRejectReason("");
        // Reload events
        const updatedResult = await getPendingEvents();
        if (updatedResult.success) {
          setEvents(updatedResult.events);
        }
        // Refresh notification badge
        if (onNotificationRefresh) {
          onNotificationRefresh();
        }
      } else {
        setError(result.error || "Failed to reject event");
      }
    } catch (err) {
      console.error("Error rejecting event:", err);
      setError("Failed to reject event");
    } finally {
      setProcessing(null);
    }
  };

  const handleCloseRejectModal = () => {
    if (!processing) {
      setIsRejectModalOpen(false);
      setSelectedEvent(null);
      setRejectReason("");
      setError("");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-[#800000] mb-2">
          Event Approval Management
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Review and approve or reject pending events. Events with tickets require admin approval before they can be published.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm sm:text-base">
            No pending events to review.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {events.map((event) => {
            const isProcessing = processing === event.id;
            const eventDate = new Date(event.eventDate);
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);

            return (
              <div
                key={event.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Event Image */}
                  {event.eventImage && (
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-300">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src={event.eventImage}
                          alt={event.title}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 192px"
                          onError={(e) => {
                            // Hide image on error and show placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-[#800000] mb-2">
                          {event.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        {/* Event Information */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-700">
                            <svg
                              className="w-4 h-4 mr-2 text-[#800000] flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{formatDateTime(eventDate)}</span>
                          </div>

                          <div className="flex items-center text-sm text-gray-700">
                            <svg
                              className="w-4 h-4 mr-2 text-[#800000] flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {formatDateTime(startTime)} - {formatDateTime(endTime)}
                            </span>
                          </div>

                          {/* Price and Tickets */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            {event.isFree ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-md bg-green-100 text-green-800 font-medium">
                                Free Event
                              </span>
                            ) : (
                              <>
                                {event.ticketPriceCents && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#800000]/10 text-[#800000] font-medium">
                                    Price: {formatCurrency(event.ticketPriceCents / 100)}
                                  </span>
                                )}
                                {event.ticketQuantity && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">
                                    Tickets: {event.ticketQuantity}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={() => handleApprove(event.id)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
                          tabIndex={0}
                          aria-label={`Approve event: ${event.title}`}
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Approve
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleRejectClick(event)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
                          tabIndex={0}
                          aria-label={`Reject event: ${event.title}`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCloseRejectModal}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="rounded-lg shadow-xl max-w-md w-full bg-[#d6d6c2]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-300">
                <h3 className="text-xl font-semibold text-[#800000]">
                  Reject Event
                </h3>
                {!processing && (
                  <button
                    onClick={handleCloseRejectModal}
                    className="text-[#800000]/50 hover:text-[#800000] transition-colors"
                    tabIndex={0}
                    aria-label="Close modal"
                    type="button"
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
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-base text-[#800000] mb-4">
                  Please provide a reason for rejecting &quot;{selectedEvent.title}&quot;:
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                  rows={4}
                  disabled={!!processing}
                  tabIndex={0}
                  aria-label="Rejection reason"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-300 p-6 flex gap-3 justify-end">
                <button
                  onClick={handleCloseRejectModal}
                  disabled={!!processing}
                  className="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] bg-[#ebebeb] text-[#800000] hover:bg-[#d4d4d4]"
                  tabIndex={0}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={!!processing || !rejectReason.trim()}
                  className="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] text-white bg-[#800000] hover:bg-[#6b0000] flex items-center justify-center gap-2"
                  tabIndex={0}
                  type="button"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    "Reject"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permission;
