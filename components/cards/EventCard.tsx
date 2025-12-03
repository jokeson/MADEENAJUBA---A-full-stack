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
      className="group block bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#800000]"
      tabIndex={0}
      aria-label={`View event: ${title}`}
    >
      {/* Image Section with Title Overlay */}
      <div className="relative w-full h-48 xs:h-56 sm:h-64 md:h-72 bg-gray-100">
        <Image
          src={displayImage}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={() => setImageError(true)}
        />
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Tag Badge - Top Right */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
          {/* Status Badge */}
          {isLive ? (
            <LiveNowBadge />
          ) : isUpcoming ? (
            <ComingUpBadge />
          ) : null}
          
          {/* Price Badge */}
          {isPaid && ticketPriceCents ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-[#800000] text-white">
              {formatCurrency(ticketPriceCents / 100)}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-green-600 text-white">
              Free
            </span>
          )}
        </div>

        {/* Title Overlay on Image - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 xs:p-5 sm:p-6 z-10">
          <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white line-clamp-2 group-hover:text-[#800000] transition-colors break-words drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>

      {/* Content Section Below Image */}
      <div className="p-4 xs:p-5 sm:p-6">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm xs:text-base text-gray-600 mb-4 xs:mb-5">
          <svg
            className="w-4 h-4 xs:w-5 xs:h-5 text-[#800000] flex-shrink-0"
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
          <span className="font-medium">{formatDateTime(startDate)}</span>
        </div>

        {/* View Details Button */}
        <div className="pt-3 xs:pt-4 border-t border-gray-200">
          <span className="inline-flex items-center text-sm xs:text-base font-semibold text-[#800000] group-hover:text-[#900000] transition-colors">
            View Details
            <svg
              className="ml-2 w-4 h-4 xs:w-5 xs:h-5 transition-transform group-hover:translate-x-1"
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
    </Link>
  );
};

export default EventCard;
