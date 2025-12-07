"use client";

import { useState, useEffect } from "react";
import { getAllContactMessages, updateMessageStatus, deleteContactMessage } from "@/lib/server-actions/contact";
import { getAllUserMessages, deleteMessageByAdmin } from "@/lib/server-actions/user-messages";
import { formatDateTime } from "@/lib/format";
import toast from "react-hot-toast";
import SendMessageModal from "./SendMessageModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface ContactMessage {
  id: string;
  userId?: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  readAt?: string;
  readBy?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
}

const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "read" | "replied" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false);
  const [selectedUserIdForMessage, setSelectedUserIdForMessage] = useState<string | undefined>(undefined);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [loadingSentMessages, setLoadingSentMessages] = useState(false);
  const [activeView, setActiveView] = useState<"received" | "sent">("received");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMessages();
    loadSentMessages();
  }, []);

  const loadSentMessages = async () => {
    try {
      setLoadingSentMessages(true);
      const result = await getAllUserMessages();
      if (result.success && result.messages) {
        setSentMessages(result.messages);
      }
    } catch (err) {
      console.error("Error loading sent messages:", err);
    } finally {
      setLoadingSentMessages(false);
    }
  };

  const handleDeleteSentMessage = async (messageId: string) => {
    try {
      const result = await deleteMessageByAdmin(messageId);
      if (result.success) {
        toast.success("Message deleted successfully");
        setSentMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } else {
        toast.error(result.error || "Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting sent message:", err);
      toast.error("An error occurred while deleting the message");
    }
  };

  const handleDeleteContactMessage = (message: ContactMessage) => {
    setMessageToDelete(message);
    setDeleteModalOpen(true);
  };

  const handleDeleteContactMessageConfirm = async () => {
    if (!messageToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteContactMessage(messageToDelete.id);
      if (result.success) {
        toast.success("Contact message deleted successfully");
        setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete.id));
        setSelectedMessage(null);
        setDeleteModalOpen(false);
        setMessageToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting contact message:", err);
      toast.error("An error occurred while deleting the message");
    } finally {
      setDeleting(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getAllContactMessages();
      if (result.success && result.messages) {
        setMessages(result.messages as ContactMessage[]);
      } else {
        setError(result.error || "Failed to load messages");
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setError("An error occurred while loading messages");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (messageId: string, newStatus: "read" | "replied" | "archived") => {
    try {
      const result = await updateMessageStatus(messageId, newStatus);
      if (result.success) {
        toast.success(`Message marked as ${newStatus}`);
        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: newStatus,
                  readAt: newStatus === "read" || newStatus === "replied" ? new Date().toISOString() : msg.readAt,
                  repliedAt: newStatus === "replied" ? new Date().toISOString() : msg.repliedAt,
                }
              : msg
          )
        );
        // Update selected message if it's the one being updated
        if (selectedMessage?.id === messageId) {
          setSelectedMessage((prev) =>
            prev
              ? {
                  ...prev,
                  status: newStatus,
                  readAt: newStatus === "read" || newStatus === "replied" ? new Date().toISOString() : prev.readAt,
                  repliedAt: newStatus === "replied" ? new Date().toISOString() : prev.repliedAt,
                }
              : null
          );
        }
      } else {
        toast.error(result.error || "Failed to update message status");
      }
    } catch (err) {
      console.error("Error updating message status:", err);
      toast.error("An error occurred while updating message status");
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case "new":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>New</span>
        );
      case "read":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Read</span>
        );
      case "replied":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>Replied</span>
        );
      case "archived":
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Archived</span>
        );
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  // Filter messages based on status and search query
  const filteredMessages = messages.filter((msg) => {
    const matchesStatus = statusFilter === "all" || msg.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const newMessagesCount = messages.filter((msg) => msg.status === "new").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#800000] mb-2">
              Contact Messages
            </h2>
            <div className="flex gap-4 mb-2">
              <button
                onClick={() => setActiveView("received")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeView === "received"
                    ? "bg-[#800000] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Received ({messages.length})
              </button>
              <button
                onClick={() => setActiveView("sent")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeView === "sent"
                    ? "bg-[#800000] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sent Messages ({sentMessages.length})
              </button>
            </div>
            {activeView === "received" && (
              <p className="text-sm text-gray-600">
                {newMessagesCount > 0 && (
                  <span className="font-semibold text-blue-600">{newMessagesCount} new message{newMessagesCount !== 1 ? "s" : ""}</span>
                )}
                {newMessagesCount === 0 && "No new messages"}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedUserIdForMessage(undefined);
                setSendMessageModalOpen(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Message
            </button>
            <button
              onClick={loadMessages}
              className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#900000] transition-colors text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by subject, email, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {activeView === "sent" ? (
          // Sent Messages View
          loadingSentMessages ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sent messages...</p>
            </div>
          ) : sentMessages.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600">No sent messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sentMessages.map((msg) => (
                <div key={msg.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-[#800000] truncate">
                          {msg.subject}
                        </h3>
                        {msg.read ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Read
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Unread
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-semibold">To:</span> User ID: {msg.userId}
                        </p>
                        <p>
                          <span className="font-semibold">Date:</span> {formatDateTime(new Date(msg.createdAt))}
                        </p>
                        {msg.readAt && (
                          <p>
                            <span className="font-semibold">Read:</span> {formatDateTime(new Date(msg.readAt))}
                          </p>
                        )}
                        <p className="text-gray-500 line-clamp-2 mt-2">{msg.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSentMessage(msg.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label="Delete message"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600">No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  message.status === "new" ? "bg-blue-50/50" : ""
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-[#800000] truncate">
                        {message.subject}
                      </h3>
                      {getStatusBadge(message.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold">From:</span> {message.email}
                        {message.phone && ` • ${message.phone}`}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span> {formatDateTime(new Date(message.createdAt))}
                      </p>
                      <p className="text-gray-500 line-clamp-2 mt-2">{message.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {message.status === "new" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(message.id, "read");
                        }}
                        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors font-semibold"
                      >
                        Mark Read
                      </button>
                    )}
                    {message.status !== "replied" && message.status !== "archived" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(message.id, "replied");
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors font-semibold"
                      >
                        Mark Replied
                      </button>
                    )}
                    {message.status !== "archived" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(message.id, "archived");
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors font-semibold"
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContactMessage(message);
                      }}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-[#800000]">{selectedMessage.subject}</h2>
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">From:</span> {selectedMessage.email}
                    </p>
                    {selectedMessage.phone && (
                      <p>
                        <span className="font-semibold">Phone:</span> {selectedMessage.phone}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Date:</span> {formatDateTime(new Date(selectedMessage.createdAt))}
                    </p>
                    {selectedMessage.readAt && (
                      <p>
                        <span className="font-semibold">Read:</span> {formatDateTime(new Date(selectedMessage.readAt))}
                      </p>
                    )}
                    {selectedMessage.repliedAt && (
                      <p>
                        <span className="font-semibold">Replied:</span> {formatDateTime(new Date(selectedMessage.repliedAt))}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message Content */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Message</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-900 whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedMessage.status === "new" && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedMessage.id, "read");
                      setSelectedMessage(null);
                    }}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors font-semibold"
                  >
                    Mark as Read
                  </button>
                )}
                {selectedMessage.status !== "replied" && selectedMessage.status !== "archived" && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedMessage.id, "replied");
                      setSelectedMessage(null);
                    }}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors font-semibold"
                  >
                    Mark as Replied
                  </button>
                )}
                {selectedMessage.status !== "archived" && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedMessage.id, "archived");
                      setSelectedMessage(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Archive
                  </button>
                )}
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#900000] transition-colors font-semibold inline-block"
                >
                  Reply via Email
                </a>
                <button
                  onClick={() => {
                    handleDeleteContactMessage(selectedMessage);
                  }}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-semibold"
                >
                  Delete Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setMessageToDelete(null);
        }}
        onConfirm={handleDeleteContactMessageConfirm}
        title="Delete Contact Message"
        message="Are you sure you want to delete this contact message? This action cannot be undone and the message will be permanently removed from the database."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
      />

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={sendMessageModalOpen}
        onClose={() => {
          setSendMessageModalOpen(false);
          setSelectedUserIdForMessage(undefined);
        }}
        onSuccess={() => {
          loadMessages();
          loadSentMessages();
        }}
        preselectedUserId={selectedUserIdForMessage}
      />
    </div>
  );
};

export default ContactMessages;
