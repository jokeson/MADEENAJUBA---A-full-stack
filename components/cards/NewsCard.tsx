"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate, formatRelativeTime } from "@/lib/format";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category?: string;
  datePosted: string;
  timePosted: string;
  views: string;
}

const NewsCard = ({ news, index }: { news: NewsItem; index: number }) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    // Navigation will be handled by Link component
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  // Validate and sanitize image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    // Check if it's a Google Images redirect URL or other invalid patterns
    if (url.includes("google.com/url") || url.includes("googleusercontent.com/imgres")) {
      return false;
    }
    // Check if it's a valid image URL
    try {
      const urlObj = new URL(url);
      // Allow data URLs, blob URLs, and http/https URLs
      return url.startsWith("data:") || url.startsWith("blob:") || 
             (urlObj.protocol === "http:" || urlObj.protocol === "https:");
    } catch {
      // If it's a relative path, it's valid
      return url.startsWith("/");
    }
  };

  const getDisplayImage = () => {
    if (imageError) return "/hero-background.jpg";
    if (!isValidImageUrl(news.image)) return "/hero-background.jpg";
    return news.image;
  };

  const displayImage = getDisplayImage();


  return (
    <div className="sm:border-b-0 border-b-2 border-b-[#800000]/40 pb-4 sm:pb-0 mb-4 sm:mb-0 last:border-b-0 last:pb-0 last:mb-0">
      <Link
        href={`/news/${news.id}`}
        className="block h-full cursor-pointer group overflow-hidden rounded-lg border border-gray-300 hover:border-gray-300 transition-all duration-300"
        tabIndex={0}
        aria-label={`Read more about ${news.title}`}
        onKeyDown={handleKeyDown}
      >
      <div className="flex flex-col h-full bg-transparent">
        {/* News Image - Full width, no padding */}
        <div className="relative w-full h-48 sm:h-56 lg:h-64 overflow-hidden">
          <Image
            src={displayImage}
            alt={news.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImageError(true)}
          />
          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category Tag */}
          {news.category && (
            <div className="absolute top-3 left-3 bg-[#800000] text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
              {news.category}
            </div>
          )}
          
          {/* View Count Badge - Futuristic style */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="text-white text-xs font-semibold tracking-wide">{news.views}</span>
          </div>
        </div>

        {/* Content Section - Padding only on bottom and sides */}
      <div 
        className="px-3 xs:px-4 sm:px-5 lg:px-6 pt-3 xs:pt-4 pb-3 xs:pb-4 sm:pb-5 lg:pb-6 border border-gray-300 rounded-b-lg shadow-lg bg-gradient-to-r from-[#d6d6c2] to-[#e8d8d0]"
      >
          {/* Relative Time Label */}
          <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#800000] text-white text-[10px] xs:text-xs sm:text-sm font-semibold">
              {formatRelativeTime(news.datePosted)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base xs:text-lg sm:text-xl font-bold text-[#800000] mb-2 xs:mb-2.5 leading-tight transition-colors line-clamp-1 break-words">
            {news.title}
          </h3>

          {/* Description */}
          <p className="text-[#800000] text-[11px] xs:text-xs sm:text-sm mb-3 xs:mb-4 leading-relaxed flex-grow line-clamp-3 break-words">
            {news.description}
          </p>

          {/* Read More Link - Futuristic style */}
          <div className="font-medium text-[10px] xs:text-xs sm:text-sm flex items-center gap-1.5 xs:gap-2 mt-auto group-hover:gap-2 xs:group-hover:gap-3 transition-all">
            <span className="uppercase tracking-wider text-[#800000] bg-white/80 px-3 py-1.5 rounded-md hover:bg-white transition-colors">Read More</span>
            <svg
              className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
      </div>
        </Link>
    </div>
  );
};

export default NewsCard;