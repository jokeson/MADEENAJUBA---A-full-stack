"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ComingUpBadge from "../badges/ComingUpBadge";
import LiveNowBadge from "../badges/LiveNowBadge";
import { formatDateTime, formatCurrency } from "../../lib/format";

interface EventCardProps {
  id: string;
  title: string;
  details?: string;
  imageUrl?: string;
  startAt: Date | string;
  endAt?: Date | string;
  isPaid?: boolean;
  ticketPriceCents?: number;
  status?: "scheduled" | "live" | "ended" | "rejected";
  location?: string;
}

const EventCard = ({
  id,
  title,
  details,
  imageUrl,
  startAt,
  endAt,
  isPaid,
  ticketPriceCents,
  status = "scheduled",
  location,
}: EventCardProps) => {
  const [imageError, setImageError] = useState(false);
  const startDate = typeof startAt === "string" ? new Date(startAt) : startAt;
  const isLive = status === "live";
  const isUpcoming = status === "scheduled" && startDate > new Date();
  const isEnded = status === "ended";

  // Validate and sanitize image URL
  const isValidImageUrl = (url: string | undefined): boolean => {
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
    if (!imageUrl || !isValidImageUrl(imageUrl)) return "/hero-background.jpg";
    return imageUrl;
  };

  const displayImage = getDisplayImage();

  return (
    <Link
      href={`/events/${id}`}
      className="group block relative w-full h-[300px] xs:h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] 2xl:h-[600px] rounded-lg sm:rounded-xl overflow-hidden transition-shadow duration-300 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"
      tabIndex={0}
      aria-label={`View event: ${title}`}
    >
      {/* Full Image Background - Using object-contain to show entire image without cropping */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
        <Image
          src={displayImage}
          alt={title}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority
          onError={() => setImageError(true)}
        />
      </div>
      
      {/* Subtle bottom gradient only for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      
      {/* Content Overlay - All text on top of image */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8">
        {/* Top Section - Badges */}
        <div className="flex items-start justify-between">
          {/* Price Badge */}
          <div>
            {isPaid && ticketPriceCents ? (
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm md:text-base font-bold bg-[#800000]/95 text-white shadow-xl backdrop-blur-sm">
                {formatCurrency(ticketPriceCents / 100)}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm md:text-base font-bold bg-green-500/95 text-white shadow-xl backdrop-blur-sm">
                Free
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div>
            {isLive ? <LiveNowBadge /> : isUpcoming ? <ComingUpBadge /> : null}
          </div>
        </div>

        {/* Bottom Section - Event Details */}
        <div className="space-y-3 sm:space-y-4">
          {/* Title */}
          <div className="bg-black/80 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg">
            <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight line-clamp-2 group-hover:text-[#800000] transition-colors duration-300 break-words">
            {title}
          </h3>
          </div>

          {/* Details */}
          {details && (
            <div className="bg-black/80 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg">
              <p className="text-white/90 text-[10px] xs:text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2 break-words">
              {details}
            </p>
            </div>
          )}

          {/* Date & Location Info */}
          <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
            {/* Date & Time */}
            <div className="flex items-center text-white/95 text-xs sm:text-sm md:text-base">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-[#800000] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium truncate">{formatDateTime(startDate)}</span>
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-center text-white/95 text-xs sm:text-sm md:text-base">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-[#800000] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>

          {/* View Details CTA */}
          <div className="pt-3 sm:pt-4 border-t border-white/20">
            <span className="inline-flex items-center text-sm sm:text-base font-semibold text-[#800000] group-hover:text-white transition-colors duration-300">
              View Details
              <svg
                className="ml-2 w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
