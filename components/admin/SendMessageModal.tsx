"use client";

import { useState, useEffect } from "react";
import { sendMessageToUser } from "@/lib/server-actions/user-messages";
import { getUsers } from "@/lib/server-actions/admin";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface User {
  id: string;
  email: string;
}

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedUserId?: string;
}

const SendMessageModal = ({ isOpen, onClose, onSuccess, preselectedUserId }: SendMessageModalProps) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (preselectedUserId) {
        setSelectedUserId(preselectedUserId);
      }
    } else {
      // Reset form when modal closes
      setSelectedUserId("");
      setSubject("");
      setMessage("");
      setSearchQuery("");
    }
  }, [isOpen, preselectedUserId]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const result = await getUsers();
      if (result.success && Array.isArray(result.users)) {
        const formattedUsers: User[] = result.users.map((u: any) => ({
          id: u._id || u.id || "",
          email: u.email,
        }));
        setUsers(formattedUsers);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);

    try {
      const result = await sendMessageToUser({
        userId: selectedUserId,
        senderId: currentUser?.id,
        senderEmail: currentUser?.email,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (result.success) {
        toast.success("Message sent successfully!");
        setSubject("");
        setMessage("");
        setSelectedUserId("");
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("An error occurred while sending the message");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#800000]">Send Message to User</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Selection */}
            <div>
              <label htmlFor="user-select" className="block text-sm font-semibold text-[#800000] mb-2">
                Select User <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search users by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                />
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  disabled={loadingUsers || sending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">-- Select a user --</option>
                  {filteredUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
                {loadingUsers && (
                  <p className="text-sm text-gray-500">Loading users...</p>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-[#800000] mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Enter message subject"
                disabled={sending}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-[#800000] mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={8}
                placeholder="Enter your message here..."
                disabled={sending}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent resize-none disabled:bg-gray-100"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !selectedUserId || !subject.trim() || !message.trim()}
                className="flex-1 px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#900000] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal;
