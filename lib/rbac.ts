// Role-Based Access Control utilities
// 
// Role Hierarchy (from lowest to highest privilege):
// 1. user - Basic user with wallet access
// 2. employee, journalist - Content creators and staff
// 3. finance - Financial operations (cash payouts)
// 4. admin - Full system access and management

export type Role = "admin" | "journalist" | "finance" | "employee" | "user";

/**
 * Checks if a user role has sufficient permissions for a required role
 * Uses hierarchical permission system where higher roles inherit lower role permissions
 */
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    user: 1,
    employee: 2,
    journalist: 2,
    finance: 3,
    admin: 4, // Highest privilege level - can access all features
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Checks if user can publish news articles
 * Allowed: journalist, admin
 */
export function canPublishNews(userRole: Role): boolean {
  return userRole === "journalist" || userRole === "admin";
}

/**
 * Checks if user can moderate content (events, jobs, ads)
 * Allowed: admin only
 */
export function canModerate(userRole: Role): boolean {
  return userRole === "admin";
}

/**
 * Checks if user has admin role
 * Admin has access to:
 * - User management (view, update roles)
 * - Wallet management (view all wallets, transaction logs)
 * - Fee ledger (view all system fees)
 * - Redeem code generator (create deposit codes)
 * - KYC review (approve/reject wallet applications)
 * - Content moderation (approve events, jobs, ads)
 * - Financial management (receive system fees)
 * 
 * See MADEENAJUBA.md and README.md for detailed admin capabilities
 */
export function isAdmin(userRole: Role): boolean {
  return userRole === "admin";
}

/**
 * Checks if user can review KYC applications
 * Allowed: admin, employee
 */
export function canReviewKYC(userRole: Role): boolean {
  return userRole === "admin" || userRole === "employee";
}

/**
 * Checks if user can handle finance operations (cash payouts)
 * Allowed: admin, finance
 */
export function canHandleFinance(userRole: Role): boolean {
  return userRole === "admin" || userRole === "finance";
}

