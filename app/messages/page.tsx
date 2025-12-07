"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserMessages,
  markMessageAsRead,
  deleteMessageByUser,
} from "@/lib/server-actions/user-messages";
import { formatDateTime } from "@/lib/format";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface UserMessage {
  id: string;
  userId: string;
  senderId?: string;
  senderEmail: string;
  subject: string;
  message: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

const MessagesPage = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedMessage, setSelectedMessage] = useState<UserMessage | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<UserMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.id) {
      loadMessages();
    }
  }, [user?.id]);

  const loadMessages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError("");
      const result = await getUserMessages(user.id);
      if (result.success && result.messages) {
        setMessages(result.messages as UserMessage[]);
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

  const handleMessageClick = async (message: UserMessage) => {
    setSelectedMessage(message);

    // Mark as read if not already read
    if (!message.read && user?.id) {
      try {
        await markMessageAsRead(message.id, user.id);
        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id
              ? { ...msg, read: true, readAt: new Date().toISOString() }
              : msg
          )
        );
        setSelectedMessage({ ...message, read: true, readAt: new Date().toISOString() });
      } catch (err) {
        console.error("Error marking message as read:", err);
      }
    }
  };

  const handleDeleteClick = (message: UserMessage) => {
    setMessageToDelete(message);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete || !user?.id) return;

    setDeleting(true);
    try {
      const result = await deleteMessageByUser(messageToDelete.id, user.id);
      if (result.success) {
        toast.success("Message deleted successfully");
        setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete.id));
        setSelectedMessage(null);
        setDeleteModalOpen(false);
        setMessageToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("An error occurred while deleting the message");
    } finally {
      setDeleting(false);
    }
  };

  const unreadCount = messages.filter((msg) => !msg.read).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10 xl:py-12">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-[#800000]">
                Messages
              </h1>
              <button
                onClick={loadMessages}
                className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#900000] transition-colors text-sm font-semibold"
              >
                Refresh
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">{unreadCount}</span> unread message{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Messages List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {messages.length === 0 ? (
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
                <p className="text-gray-600">No messages yet</p>
                <p className="text-sm text-gray-500 mt-2">You'll see messages from administrators here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !message.read ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#800000] truncate">
                            {message.subject}
                          </h3>
                          {!message.read && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-semibold">From:</span> {message.senderEmail}
                          </p>
                          <p>
                            <span className="font-semibold">Date:</span> {formatDateTime(new Date(message.createdAt))}
                          </p>
                          <p className="text-gray-500 line-clamp-2 mt-2">{message.message}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(message);
                        }}
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
                        {!selectedMessage.read && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-semibold">From:</span> {selectedMessage.senderEmail}
                        </p>
                        <p>
                          <span className="font-semibold">Date:</span> {formatDateTime(new Date(selectedMessage.createdAt))}
                        </p>
                        {selectedMessage.readAt && (
                          <p>
                            <span className="font-semibold">Read:</span> {formatDateTime(new Date(selectedMessage.readAt))}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleDeleteClick(selectedMessage);
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
            onConfirm={handleDeleteConfirm}
            title="Delete Message"
            message="Are you sure you want to delete this message? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            isLoading={deleting}
          />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
