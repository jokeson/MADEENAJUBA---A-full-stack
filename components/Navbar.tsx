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
  LayoutDashboard 
} from "lucide-react";

interface NavbarProps {
  onOpenLoginModal: () => void;
  onOpenSignUpModal: () => void;
}

const Navbar = ({ onOpenLoginModal, onOpenSignUpModal }: NavbarProps) => {
  const { isAuthenticated, user, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Get user initials from email
  const getUserInitials = (email: string): string => {
    if (!email) return "U";
    const emailPart = email.split("@")[0];
    if (emailPart.length === 1) return emailPart.toUpperCase();
    return (emailPart[0] + emailPart[emailPart.length - 1]).toUpperCase();
  };

  // Check if a navigation link is active
  const isActive = (href: string): boolean => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
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
            <Link href="/" className={`hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors ${isActive("/news") ? "border-b-2 border-[#800000]" : ""}`}>
             Home

            </Link>
            <Link href="/events" className={`hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors ${isActive("/events") ? "border-b-2 border-[#800000]" : ""}`}>
              Events
            </Link>
            <Link href="/jobs" className={`hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors ${isActive("/jobs") ? "border-b-2 border-[#800000]" : ""}`}>
              Jobs
            </Link>
            <Link href="/about_us" className={`hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors ${isActive("/ads") ? "border-b-2 border-[#800000]" : ""}`}>
              About Us
            </Link>
            <Link href="/contact_us" className={`hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors ${isActive("/businesses") ? "border-b-2 border-[#800000]" : ""}`}>
              Contact Us
            </Link>
            {isAuthenticated ? (
              <Link href="/wallet" className={`hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors ${isActive("/wallet") ? "border-b-2 border-[#800000]" : ""}`}>
                Wallet
              </Link>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors"
              >
                Wallet
              </button>
            )}
            {isAuthenticated && (
              <Link href="/dashboard" className={`hover:cursor-pointer text-[#800000] text-sm md:text-base font-medium hover:text-[#800000]/80 transition-colors ${isActive("/dashboard") ? "border-b-2 border-[#800000]" : ""}`}>
                Dashboard
              </Link>
            )}
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
                <span className="hidden">Madeenajuba</span>
              </Link>
              <Link 
                href="/news" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/news") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <Newspaper className="w-5 h-5 flex-shrink-0" />
                News
              </Link>
              <Link 
                href="/events" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/events") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <Calendar className="w-5 h-5 flex-shrink-0" />
                Events
              </Link>
              <Link 
                href="/jobs" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/jobs") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <Briefcase className="w-5 h-5 flex-shrink-0" />
                Jobs
              </Link>
              <Link 
                href="/ads" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/ads") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <Megaphone className="w-5 h-5 flex-shrink-0" />
                Ads
              </Link>
              <Link 
                href="/businesses" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/businesses") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <Building2 className="w-5 h-5 flex-shrink-0" />
                Businesses
              </Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/wallet" 
                    className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/wallet") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                    onClick={closeMobileMenu}
                  >
                    <Wallet className="w-5 h-5 flex-shrink-0" />
                    Wallet
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/dashboard") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                    onClick={closeMobileMenu}
                  >
                    <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                    Dashboard
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    closeMobileMenu();
                    onOpenLoginModal();
                  }}
                  className="flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg text-left w-full"
                >
                  <Wallet className="w-5 h-5 flex-shrink-0" />
                  Wallet
                </button>
              )}
              
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
