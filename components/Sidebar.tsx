"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/rbac";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleSignOut = (e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsMobileOpen(false);
    signOut();
  };

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      label: "Create Invoice",
      href: "/wallet/invoices/create",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      label: "Create Event",
      href: "/events/create",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
    },
    {
      label: "Create Post",
      href: "/posts/create",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      label: "Wallet",
      href: "/wallet",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    
    ...(user && isAdmin(user.role)
      ? [
          {
            label: "Admin",
            href: "/admin",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ),
          },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (!pathname) return href === "/dashboard";
    
    // Check if this href matches the current pathname
    const matches = pathname === href || pathname.startsWith(href + "/");
    
    if (!matches) {
      // Special case: Dashboard should be active by default if no other nav item matches
      if (href === "/dashboard") {
        const otherItemMatches = navigationItems.some(
          (item) => item.href !== "/dashboard" && 
          (pathname === item.href || pathname.startsWith(item.href + "/"))
        );
        return !otherItemMatches;
      }
      return false;
    }
    
    // If this item matches, check if there's a more specific (longer) route that also matches
    // Only mark as active if this is the most specific match
    const moreSpecificMatch = navigationItems.some(
      (item) => 
        item.href !== href && 
        item.href.length > href.length &&
        (pathname === item.href || pathname.startsWith(item.href + "/"))
    );
    
    // This item is active only if there's no more specific match
    return !moreSpecificMatch;
  };

  const handleNavigation = (href: string, e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Don't navigate if already on this page
    if (pathname === href) {
      setIsMobileOpen(false);
      return;
    }

    // Set navigating state for smooth transition
    setNavigatingTo(href);
    setIsMobileOpen(false);

    // Navigate immediately - no delays on mobile
    router.push(href);
    
    // Clear navigating state after a short delay
    setTimeout(() => {
      setNavigatingTo(null);
    }, 500);
  };

  // Close mobile menu and clear navigating state on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setNavigatingTo(null);
  }, [pathname]);

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Menu Button - Always visible on mobile and tablet, positioned at bottom right */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-4 right-4 -mt-2 z-[9999] md:hidden p-2.5 bg-[#d6d6c2] text-[#800000] rounded-lg hover:bg-[#d6d6c2]/90 transition-colors duration-300 shadow-2xl border border-gray-300/30"
        aria-label="Toggle menu"
        tabIndex={0}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] md:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setIsMobileOpen(false)}
          onTouchStart={(e) => {
            // Only close if clicking directly on overlay, not on sidebar
            if (e.target === e.currentTarget) {
              setIsMobileOpen(false);
            }
          }}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-[#d6d6c2] text-[#800000] flex flex-col z-[9999]
          transform transition-transform duration-300 ease-in-out
          w-64 sm:w-72 md:w-56 lg:w-56 xl:w-60
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
      {/* Logo/Brand */}
      <div className="p-4 sm:p-5 md:p-4 lg:p-5 xl:p-6 border-b border-gray-300/30 mb-3">
        <h2 className="text-lg sm:text-xl md:text-lg lg:text-xl xl:text-2xl font-bold text-[#800000] transition-all duration-300">MADEENAJUBA</h2>
        {user && (
          <p className="text-xs sm:text-sm md:text-xs lg:text-sm text-[#800000] mt-1 truncate">{user.email}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 md:p-3 lg:p-4 xl:p-5 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          const isNavigating = navigatingTo === item.href;
          return (
            <button
              key={item.href}
              onClick={(e) => handleNavigation(item.href, e)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNavigation(item.href, e);
              }}
              disabled={isNavigating}
              className={`
                w-full flex items-center gap-2 sm:gap-3 md:gap-2 lg:gap-3 px-3 sm:px-4 md:px-3 lg:px-4 py-2.5 sm:py-3 md:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm md:text-xs lg:text-sm font-medium
                transition-colors duration-300 ease-in-out
                touch-manipulation
                ${
                  active
                    ? "bg-[#800000] text-white  shadow-[#800000]/20"
                    : isNavigating
                    ? "bg-gray-400/30 text-[#800000]"
                    : "text-[#800000] hover:bg-gray-300/50 hover:text-[#800000] active:bg-gray-300/70"
                }
                ${active ? "cursor-default" : "cursor-pointer"}
                ${isNavigating ? "opacity-70" : "opacity-100"}
                ${isNavigating ? "pointer-events-none" : "pointer-events-auto"}
              `}
              tabIndex={active ? -1 : 0}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`flex-shrink-0 ${
                  isNavigating ? "animate-pulse" : ""
                } ${active ? "text-white" : ""}`}
              >
                {item.icon}
              </span>
              <span className={`flex-1 text-left truncate ${active ? "text-white" : ""}`}>{item.label}</span>
              {isNavigating && (
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 animate-spin flex-shrink-0 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-3 sm:p-4 md:p-3 lg:p-4 xl:p-5 border-t border-gray-300/30">
        <button
          onClick={(e) => handleSignOut(e)}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleSignOut(e);
          }}
          className="w-full flex items-center gap-2 sm:gap-3 md:gap-2 lg:gap-3 px-3 sm:px-4 md:px-3 lg:px-4 py-2.5 sm:py-3 md:py-2.5 lg:py-3 rounded-lg text-sm sm:text-base md:text-sm lg:text-base font-semibold text-red-600 bg-gray-200/50 hover:bg-red-100 transition-colors duration-300 ease-in-out touch-manipulation pointer-events-auto"
          tabIndex={0}
          aria-label="Sign out"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0 text-red-600"
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
          <span className="truncate text-red-600">Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;

