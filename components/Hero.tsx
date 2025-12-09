"use client";

import { useState, useEffect } from "react";
import { getSystemSettings } from "@/lib/server-actions/system-settings";

type HeroSettings = {
  headline: string;
  subheadline: string;
  backgroundImageUrl: string;
};

const Hero = () => {
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadHeroSettings = async () => {
      try {
        const result = await getSystemSettings();

        if (result?.success && result.settings) {
          setHeroSettings({
            headline:
              result.settings.heroHeadline ||
              "Welcome to Madeenajuba",
            subheadline:
              result.settings.heroSubheadline ||
              "Discover news, events, jobs, and businesses in one digital home.",
            backgroundImageUrl:
              result.settings.heroBackgroundImageUrl || "",
          });
        } else {
          // Fallback if DB returns nothing
          setHeroSettings({
            headline: "Welcome to Madeenajuba",
            subheadline:
              "Discover news, events, jobs, and businesses in one digital home.",
            backgroundImageUrl: "",
          });
        }
      } catch (err) {
        console.error("Error loading hero settings:", err);
        // Basic fallback
        setHeroSettings({
          headline: "Welcome to Madeenajuba",
          subheadline:
            "Discover news, events, jobs, and businesses in one digital home.",
          backgroundImageUrl: "",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHeroSettings();
  }, []);

  // Handle line breaks in headline
  const headlineLines = heroSettings?.headline
    ? heroSettings.headline.replace(/\\n/g, "\n").split("\n")
    : [];

  // Build background style - only if image exists
  const backgroundStyle: React.CSSProperties =
    heroSettings?.backgroundImageUrl && !imageError
      ? {
          backgroundImage: `url('${heroSettings.backgroundImageUrl}')`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {};

  // Show loading if no image or still loading
  const showLoading = loading || !heroSettings || !heroSettings.backgroundImageUrl || imageError;

  return (
    <>
      {/* Responsive background size styles - cover on all screen sizes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .hero-section-mobile {
            background-size: cover !important;
            background-position: center !important;
          }
        `
      }} />
      <section
        className="hero-section-mobile relative min-h-screen w-full text-white overflow-hidden"
        style={backgroundStyle}
      >
      {/* Overlay to make text readable on bright images - only if image exists */}
      {heroSettings?.backgroundImageUrl && !imageError && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* Validate image load */}
      {heroSettings?.backgroundImageUrl && (
        <img
          src={heroSettings.backgroundImageUrl}
          alt=""
          className="hidden"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8">
        {showLoading ? (
          // Loading state: spinner + text
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 rounded-full border-4 border-white/40 border-t-white animate-spin" />
            <p className="text-xs xs:text-sm sm:text-base md:text-lg text-white">Loading...</p>
          </div>
        ) : (
          <div className="w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 text-center space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
            {/* H1 - with line break support, white text, fully responsive */}
            <h1 
              className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight text-white break-words"
              style={{ color: '#ffffff' }}
            >
              {headlineLines.length > 0 ? (
                headlineLines.map((line, index) => (
                  <span key={index} style={{ color: '#ffffff' }}>
                    {line}
                    {index < headlineLines.length - 1 && <br />}
                  </span>
                ))
              ) : (
                <span style={{ color: '#ffffff' }}>{heroSettings.headline}</span>
              )}
            </h1>

            {/* H2 / subheadline - white text, fully responsive */}
            <p 
              className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed text-white break-words px-1 xs:px-2"
              style={{ color: '#ffffff' }}
            >
              {heroSettings.subheadline}
            </p>
          </div>
        )}
      </div>
    </section>
    </>
  );
};

export default Hero;

