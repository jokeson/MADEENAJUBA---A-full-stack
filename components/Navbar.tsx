"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import { 
  LogOut, 
  X, 
  Menu, 
  Newspaper, 
  Calendar, 
  Briefcase, 
  Megaphone, 
  Building2, 
  Wallet, 
  LayoutDashboard,
  LucideIcon
} from "lucide-react";

interface NavbarProps {
  onOpenLoginModal: () => void;
  onOpenSignUpModal: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  requiresAuth?: boolean;
  showAsButton?: boolean; // Show as button instead of link (e.g., wallet when not authenticated)
  activePath?: string; // Custom path for active state check
}

const Navbar = ({ onOpenLoginModal, onOpenSignUpModal }: NavbarProps) => {
  const { isAuthenticated, user, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Navigation items configuration
  const navItems: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/news", label: "News", icon: Newspaper },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/about_us", label: "About Us", activePath: "/ads" },
    { href: "/contact_us", label: "Contact Us", activePath: "/businesses" },
    { href: "/advertisements", label: "Ads", icon: Megaphone, activePath: "/ads" },
    { href: "/businesses", label: "Businesses", icon: Building2 },
    { 
      href: "/wallet", 
      label: "Wallet", 
      icon: Wallet,
      showAsButton: !isAuthenticated 
    },
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      requiresAuth: true 
    },
  ];

  // Get user initials from email
  const getUserInitials = (email: string): string => {
    if (!email) return "U";
    const emailPart = email.split("@")[0];
    if (emailPart.length === 1) return emailPart.toUpperCase();
    return (emailPart[0] + emailPart[emailPart.length - 1]).toUpperCase();
  };

  // Check if a navigation link is active
  const isActive = (href: string, activePath?: string): boolean => {
    if (!pathname) return false;
    const pathToCheck = activePath || href;
    if (pathToCheck === "/") return pathname === "/";
    return pathname === pathToCheck || pathname.startsWith(pathToCheck + "/");
  };

  // Filter navigation items based on authentication
  const getVisibleNavItems = (): NavItem[] => {
    return navItems.filter(item => {
      if (item.requiresAuth && !isAuthenticated) return false;
      return true;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        isMobileMenuOpen
      ) {
        closeMobileMenu();
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        isProfileMenuOpen
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen || isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, isProfileMenuOpen]);

  return (
    <nav ref={menuRef} className="fixed top-0 left-0 right-0 z-50 bg-[#d6d6c2] backdrop-blur-sm py-1 xs:py-2 shadow-md">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 xs:h-16 relative">
          {/* Logo - Centered on mobile, left-aligned on sm, md, lg screens - Always visible */}
          <div className="flex-1 sm:flex-none flex justify-center sm:justify-start items-center">
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Go to home page"
            >
              <Image
                src="/logo.png"
                alt="MADEENAJUBA Logo"
                width={200}
                height={110}
                className="h-10 xs:h-12 sm:h-14 md:h-16 w-auto object-contain"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Navigation Links - Desktop - Always centered */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 absolute left-1/2 transform -translate-x-1/2">
            {getVisibleNavItems().map((item) => {
              if (item.showAsButton) {
                return (
                  <button
                    key={item.href}
                    onClick={onOpenLoginModal}
                    className="hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors"
                  >
                    {item.label}
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors ${isActive(item.href, item.activePath) ? "border-b-2 border-[#800000]" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Action Buttons or Profile Avatar */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* Notification Bell - Only shown when authenticated - Hidden on mobile */}
            {isAuthenticated && <div className="hidden md:block"><NotificationBell /></div>}

            {/* Action Buttons - Desktop - Hidden when authenticated */}
            {!isAuthenticated && (
              <div className="hidden lg:flex items-center gap-2 pb-2 sm:gap-4">
                <button
                  onClick={onOpenLoginModal}
                  className="px-3 hover:cursor-pointer sm:px-4 py-2 text-xs sm:text-sm font-medium text-white border border-[#800000] hover:bg-white/10 transition-colors whitespace-nowrap"
                  tabIndex={0}
                  aria-label="Sign in"
                >
                  <span className="hidden md:block">Sign in</span>
                </button>
                <button
                  onClick={onOpenSignUpModal}
                  className="px-3 hover:cursor-pointer sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#800000] hover:bg-[#900000] transition-colors whitespace-nowrap"
                  tabIndex={0}
                  aria-label="Sign up"
                >
                  <span className="hidden md:block text-white">Sign up</span>
                </button>
              </div>
            )}

            {/* Profile Avatar - Desktop - Only shown when authenticated */}
            {isAuthenticated && user && (
              <div className="hidden lg:block relative ml-auto" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="w-10 h-10 rounded-full bg-[#800000] text-white font-semibold text-sm flex items-center justify-center hover:bg-[#800000]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 focus:ring-offset-[#0a1629]"
                  tabIndex={0}
                  aria-label="User profile menu"
                >
                  {getUserInitials(user.email)}
                </button>
                
                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-[#800000] truncate">{user.email}</p>
                      <p className="text-xs text-[#800000] capitalize mt-1">{user.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-base font-semibold text-red-500 hover:bg-red-50 transition-colors"
                      tabIndex={0}
                      aria-label="Sign out"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0 text-red-500" />
                      <span className="text-red-500">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button and Notification Bell - Visible only on mobile */}
          <div className="md:hidden flex items-center gap-2 absolute right-0">
            {/* Notification Bell - Only shown when authenticated on mobile */}
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-[#663300] hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
              tabIndex={0}
            >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out w-full -mx-4 sm:-mx-6 lg:-mx-8 ${
            isMobileMenuOpen
              ? "max-h-[800px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div>
          <div className="border-t border-gray-200 w-full pl-4 sm:pl-6 lg:pl-8 pt-4 pr-0 pb-0">
            <div className="flex flex-col gap-2">
              {/* Logo Link */}
              <Link 
                href="/" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <Image
                  src="/logo.png"
                  alt="MADEENAJUBA Logo"
                  width={150}
                  height={82}
                  className="h-10 w-auto object-contain flex-shrink-0"
                  unoptimized
                />
                <span className="hidden">Madeenajuba211</span>
              </Link>
              
              {/* Navigation Links */}
              {getVisibleNavItems().map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.activePath);
                const baseClasses = `flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${active ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`;

                if (item.showAsButton) {
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        closeMobileMenu();
                        onOpenLoginModal();
                      }}
                      className={`${baseClasses} text-left w-full`}
                    >
                      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={baseClasses}
                    onClick={closeMobileMenu}
                  >
                    {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Sign in and Sign up buttons - Mobile - Only shown when not authenticated */}
              {!isAuthenticated && (
                <div className="flex flex-row gap-3 pt-4 pb-4 border-t border-gray-200 px-3">
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      onOpenLoginModal();
                    }}
                    className="flex-1 px-4 py-3 text-sm font-medium text-[#800000] border-2 border-[#800000] hover:bg-[#800000] hover:text-white transition-colors rounded-lg"
                    tabIndex={0}
                    aria-label="Sign in"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      onOpenSignUpModal();
                    }}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[#800000] hover:bg-[#6b0000] transition-colors rounded-lg"
                    tabIndex={0}
                    aria-label="Sign up"
                  >
                    Sign up
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
