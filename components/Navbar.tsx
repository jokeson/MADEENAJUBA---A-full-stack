"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";

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
          {/* Logo - Centered on mobile, left-aligned on desktop - Hidden on desktop when signed in */}
          <div className={`flex-1 md:flex-none flex justify-center md:justify-start items-center ${isAuthenticated ? "md:hidden" : ""}`}>
            <Link 
              href="/" 
              className="text-lg xs:text-xl sm:text-xl md:text-2xl font-bold text-[#800000] hover:text-[#800000]/80 transition-colors cursor-pointer break-words"
              aria-label="Go to home page"
            >
              MADEENAJUBA
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
            {/* Notification Bell - Only shown when authenticated */}
            {isAuthenticated && <NotificationBell />}

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
                      <svg
                        className="w-4 h-4 flex-shrink-0 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="text-red-500">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button and Notification Bell - Visible only on mobile */}
          <div className="md:hidden flex items-center gap-2 absolute right-0">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-[#663300] hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
              tabIndex={0}
            >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
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
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
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
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Madeenajuba
              </Link>
              <Link 
                href="/news" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/news") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                News
              </Link>
              <Link 
                href="/events" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/events") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Events
              </Link>
              <Link 
                href="/jobs" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/jobs") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Jobs
              </Link>
              <Link 
                href="/ads" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/ads") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                Ads
              </Link>
              <Link 
                href="/businesses" 
                className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/businesses") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Businesses
              </Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/wallet" 
                    className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/wallet") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Wallet
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className={`flex items-center gap-3 text-[#800000] text-base font-medium hover:bg-gray-50 transition-colors py-3 px-3 rounded-lg ${isActive("/dashboard") ? "bg-gray-50 border-l-4 border-[#800000]" : ""}`} 
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
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
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
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
