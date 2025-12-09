"use client";

import { useState, useEffect } from "react";
import { Role } from "@/lib/rbac";
import RoleDropdown from "./RoleDropdown";
import { deleteUser, getUsers, updateUserRole } from "@/lib/server-actions/admin";
import { getSystemSettings } from "@/lib/server-actions/system-settings";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  email: string;
  role: Role;
  hasWallet?: boolean;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

const UserTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [maxBalanceForDeletion, setMaxBalanceForDeletion] = useState(0);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
    loadDeletionSettings();
  }, []);

  const loadDeletionSettings = async () => {
    try {
      const result = await getSystemSettings();
      if (result.success && result.settings) {
        setMaxBalanceForDeletion(result.settings.maxBalanceForDeletion ?? 0);
      }
    } catch (err) {
      console.error("Error loading deletion settings:", err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getUsers();
      if (result.success && Array.isArray(result.users)) {
        // Convert server response format to component format
        const formattedUsers: User[] = result.users.map((u: any) => ({
          id: u._id || u.id || "",
          email: u.email,
          role: u.role,
          hasWallet: u.hasWallet || false,
          createdAt: u.createdAt || new Date().toISOString(),
        }));
        setUsers(formattedUsers);
      } else {
        setUsers([]);
        setError(result.error || "Failed to load users");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setError("");
    setSuccess("");
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setSuccess(`User role updated successfully`);
        await loadUsers();
        setCurrentPage(1); // Reset to first page after reload
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to update role");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Error updating role:", err);
      setError("Failed to update role");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete || !currentUser?.id) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const result = await deleteUser(userToDelete.id, currentUser.id);
      
      if (result.success) {
        setSuccess(result.message || "User deleted successfully");
        setDeleteModalOpen(false);
        setUserToDelete(null);
        await loadUsers();
        setCurrentPage(1); // Reset to first page after reload
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to delete user");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
      setTimeout(() => setError(""), 5000);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "journalist":
        return "bg-blue-100 text-blue-800";
      case "finance":
        return "bg-green-100 text-green-800";
      case "employee":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-[#800000]";
    }
  };

  // Filter users based on search query (email or ID)
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase().trim();
    const emailMatch = user.email.toLowerCase().includes(query);
    const idMatch = user.id.toLowerCase().includes(query);
    return emailMatch || idMatch;
  });

  // Pagination calculations based on filtered users
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Generate page numbers array
  const getPageNumbers = (totalPages: number, currentPage: number) => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push("...");
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-xl font-semibold text-[#800000]">User Management</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000] placeholder:text-[#800000]"
              aria-label="Search users by email or ID"
              tabIndex={0}
            />
          </div>
          <span className="text-sm text-[#800000] whitespace-nowrap">
            {searchQuery.trim() ? (
              <>
                Showing {filteredUsers.length} of {users.length} users
              </>
            ) : (
              <>Total Users: {users.length}</>
            )}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {success}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {users.length === 0 ? (
          <div className="text-center py-8 text-[#800000]">
            No users found. Create a user account to get started.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-[#800000]">
            <p className="mb-2">No users found matching your search.</p>
            <p className="text-sm">
              Try searching with a different email or ID.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#800000]">
                            {user.email}
                          </div>
                          <div className="text-sm text-[#800000]">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <RoleDropdown
                          currentRole={user.role}
                          userId={user.id}
                          hasWallet={user.hasWallet || false}
                          onRoleChange={handleRoleChange}
                        />
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="px-3 py-1.5 bg-[#800000] text-white text-xs font-medium rounded-md hover:bg-[#900000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          tabIndex={0}
                          aria-label={`Delete user ${user.email}`}
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete user (requires wallet balance = 0 or < 1)"}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                  tabIndex={0}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                  tabIndex={0}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#800000]">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> of{" "}
                    <span className="font-medium">{filteredUsers.length}</span> results
                    {searchQuery.trim() && (
                      <span className="text-[#800000]"> (filtered from {users.length} total)</span>
                    )}
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#800000]/50 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      tabIndex={0}
                      aria-label="Previous page"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {getPageNumbers(totalPages, currentPage).map((page, index) => (
                      page === "..." ? (
                        <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[#800000] ring-1 ring-inset ring-gray-300">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? "z-10 bg-[#800000] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800000]"
                              : "text-[#800000] ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          }`}
                          tabIndex={0}
                          aria-label={`Go to page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </button>
                      )
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#800000]/50 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      tabIndex={0}
                      aria-label="Next page"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={
          userToDelete
            ? `Are you sure you want to delete user "${userToDelete.email}"? This action will permanently delete the user account, wallet, transactions, KYC data, and all related information. This action cannot be undone. NOTE: User can only be deleted if wallet balance is $${(maxBalanceForDeletion / 100).toFixed(2)} or less.`
            : ""
        }
        confirmText="Delete User"
        cancelText="Cancel"
        isLoading={deleting}
      />
    </div>
  );
};

export default UserTable;
