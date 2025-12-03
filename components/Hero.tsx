"use client";

import { useState, useEffect } from "react";
import SignUpModal from "./SignUpModal";
import LoginModal from "./LoginModal";
import { getSystemSettings } from "@/lib/server-actions/system-settings";

const Hero = () => {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [heroSettings, setHeroSettings] = useState({
    headline: "Time is money.\nSave both.",
    subheadline: "Easy-to-use corporate cards, bill payments, accounting, and a whole lot more. All in one place.",
    backgroundImageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [imageKey, setImageKey] = useState(0); // Key to force image reload when URL changes
  const [isMounted, setIsMounted] = useState(false); // Track if component is mounted (client-side)
  const [imageError, setImageError] = useState(false); // Track if image failed to load

  useEffect(() => {
    const loadHeroSettings = async () => {
      try {
        // Fetch hero settings from database (includes Cloudinary URL if image was uploaded)
        const result = await getSystemSettings();
        if (result.success && result.settings) {
          // Get image URL from database - can be Cloudinary URL or any other image URL
          const newImageUrl = result.settings.heroBackgroundImageUrl || "";
          
          setHeroSettings(prev => {
            // If image URL changed, force reload by updating key
            if (prev.backgroundImageUrl !== newImageUrl) {
              setImageKey(prevKey => prevKey + 1); // Force image reload by changing key
              setImageError(false); // Reset error state when URL changes
            }
            
            return {
              headline: result.settings.heroHeadline || "Time is money.\nSave both.",
              subheadline: result.settings.heroSubheadline || "Easy-to-use corporate cards, bill payments, accounting, and a whole lot more. All in one place.",
              backgroundImageUrl: newImageUrl, // This is the URL from database (Cloudinary or other)
            };
          });
        }
      } catch (error) {
        console.error("Error loading hero settings from database:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadHeroSettings();
    
    // Mark as mounted after initial load
    setIsMounted(true);
    
    // Check when window gains focus (user switches back to tab/window)
    const handleFocus = () => {
      loadHeroSettings();
    };
    window.addEventListener("focus", handleFocus);
    
    // Check when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadHeroSettings();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Optional: Long interval as a safety net (only if page is visible)
    // This ensures updates even if focus/visibility events don't fire
    const interval = setInterval(() => {
      if (!document.hidden && document.hasFocus()) {
        loadHeroSettings();
      }
    }, 30000); // 30 seconds as fallback, only when page is active
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // Empty dependency array - only run on mount

  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  const handleCloseSignUpModal = () => {
    setIsSignUpModalOpen(false);
  };

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleSwitchToSignUp = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
  };


  // Split headline by \n to handle line breaks (handle both actual \n and escaped \\n)
  const headlineLines = heroSettings.headline.replace(/\\n/g, "\n").split("\n");

  // Get the background style - use placeholder if no image or image error
  // Image URL comes from database (can be Cloudinary URL or any other image URL)
  const getBackgroundStyle = () => {
    const url = heroSettings.backgroundImageUrl;
    
    // If no image URL from database or image failed to load, use gradient placeholder
    if (!url || url.trim() === "" || imageError) {
      return {
        background: "linear-gradient(135deg, #0a1629 0%, #1a2a3a 50%, #0d1b2f 100%)",
      };
    }
    
    // Add cache-busting parameter for Cloudinary or other image URLs
    // This ensures the browser fetches the latest image from Cloudinary/database
    const separator = url.includes("?") ? "&" : "?";
    let imageUrl = url;
    if (isMounted) {
      imageUrl = `${url}${separator}k=${imageKey}&t=${Date.now()}`;
    } else {
      imageUrl = `${url}${separator}k=${imageKey}`;
    }
    
    return {
      backgroundImage: `url('${imageUrl}')`,
      backgroundSize: "cover", // Cover for full width display
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "scroll", // Better performance on mobile
      width: "100%",
      minHeight: "100vh",
      // Removed backgroundColor - no background behind the image
    };
  };

  const backgroundStyle = getBackgroundStyle();

  return (
    <>
      <div
        className="relative min-h-screen text-white overflow-hidden pt-16 sm:pt-20 md:pt-20 w-full"
        style={{
          ...backgroundStyle,
          transition: "background-image 0.3s ease-in-out, background 0.3s ease-in-out",
        }}
        key={`hero-bg-${imageKey}`}
      >
        {/* Overlay to ensure text readability - only if image exists */}
        {heroSettings.backgroundImageUrl && heroSettings.backgroundImageUrl.trim() !== "" && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        )}
        {/* Hidden image to detect load errors - validates Cloudinary/database image URL */}
        {heroSettings.backgroundImageUrl && heroSettings.backgroundImageUrl.trim() !== "" && (
          <img
            src={heroSettings.backgroundImageUrl}
            alt=""
            className="hidden"
            onError={() => {
              console.error("Failed to load hero image from database/Cloudinary:", heroSettings.backgroundImageUrl);
              setImageError(true);
            }}
            onLoad={() => {
              setImageError(false);
            }}
            key={`hero-img-check-${imageKey}`}
          />
        )}
        {/* Hero Section */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 pt-6 xs:pt-8 sm:pt-10 md:pt-12 lg:pt-16 xl:pt-20 pb-8 xs:pb-10 sm:pb-12 md:pb-16 lg:pb-20 xl:pb-24">
            <div className="flex items-center justify-center min-h-[50vh] xs:min-h-[55vh] sm:min-h-[60vh] md:min-h-[65vh] lg:min-h-[70vh] xl:min-h-[80vh]">
              {/* Hero Content - Only Admin Text */}
              <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 text-center w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl px-2 xs:px-3 sm:px-4">
                {/* Headline - From Admin */}
                <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white leading-tight break-words">
                  {loading ? (
                    <>
                      Time is money.
                      <br />
                      Save both.
                    </>
                  ) : (
                    headlineLines.map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < headlineLines.length - 1 && <br />}
                      </span>
                    ))
                  )}
                </h1>

                {/* Sub-headline - From Admin */}
                <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white leading-relaxed break-words px-1 xs:px-2">
                  {loading
                    ? "Easy-to-use corporate cards, bill payments, accounting, and a whole lot more. All in one place."
                    : heroSettings.subheadline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={handleCloseSignUpModal}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onSwitchToSignUp={handleSwitchToSignUp}
      />
    </>
  );
};

export default Hero;

