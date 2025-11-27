"use client";

import { useState } from "react";
import { Role } from "@/lib/rbac";

interface RoleDropdownProps {
  currentRole: Role;
  userId: string;
  hasWallet: boolean;
  onRoleChange: (userId: string, newRole: Role) => void;
}

const RoleDropdown = ({
  currentRole,
  userId,
  hasWallet,
  onRoleChange,
}: RoleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const roles: Role[] = ["user", "journalist", "finance", "employee", "admin"];
  
  // Roles that require a wallet
  const rolesRequiringWallet: Role[] = ["admin", "journalist", "finance", "employee"];

  const handleRoleSelect = (newRole: Role) => {
    // Prevent selecting roles that require a wallet if user doesn't have one
    if (rolesRequiringWallet.includes(newRole) && !hasWallet) {
      return; // Don't allow selection
    }
    
    if (newRole !== currentRole) {
      onRoleChange(userId, newRole);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        tabIndex={0}
        aria-label={`Change role for user ${userId}`}
        aria-expanded={isOpen}
      >
        Change Role
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          ></div>
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              {roles.map((role) => {
                const requiresWallet = rolesRequiringWallet.includes(role);
                const isDisabled = requiresWallet && !hasWallet;
                
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    disabled={isDisabled}
                    className={`
                      block w-full text-left px-4 py-2 text-sm transition-colors
                      ${
                        role === currentRole
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : isDisabled
                          ? "text-gray-400 cursor-not-allowed bg-gray-50"
                          : "text-[#800000] hover:bg-gray-100"
                      }
                    `}
                    role="menuitem"
                    tabIndex={isDisabled ? -1 : 0}
                    title={
                      isDisabled
                        ? "User must have a wallet to be assigned this role. Please approve their KYC application first."
                        : undefined
                    }
                  >
                    {role === currentRole && "✓ "}
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                    {isDisabled && " (requires wallet)"}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoleDropdown;
