import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/server-actions/events";
import { getUserById } from "@/lib/db/utils";
import { getKycUserInfo } from "@/lib/server-actions/kyc";
import { formatDateTime, formatDate, formatCurrency } from "@/lib/format";
import ComingUpBadge from "@/components/badges/ComingUpBadge";
import LiveNowBadge from "@/components/badges/LiveNowBadge";
import BuyTicketButton from "@/components/events/BuyTicketButton";

const DEFAULT_ADDRESS = "Madeenajuba, South Sudan";

const calculateTimeLeft = (startTime: Date): string => {
  const now = new Date();
  const diff = startTime.getTime() - now.getTime();

  if (diff <= 0) {
    return "Event has started";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get event data
  const eventResult = await getEvent(id);
  if (!eventResult.success || !eventResult.event) {
    notFound();
  }

  const event = eventResult.event;
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const eventDate = new Date(event.eventDate);
  const createdAt = new Date(event.createdAt);
  const now = new Date();

  // Determine event status
  const isLive = startTime <= now && endTime >= now;
  const isUpcoming = startTime > now;
  const isEnded = endTime < now;

  // Get creator user information
  let creatorEmail = "Unknown";
  let creatorName = "Unknown";

  try {
    const user = await getUserById(event.creatorUserId);
    if (user) {
      creatorEmail = user.email;
      // Try to get name from KYC
      const kycInfo = await getKycUserInfo(event.creatorUserId);
      if (kycInfo.success && kycInfo.firstName && kycInfo.lastName) {
        creatorName = `${kycInfo.firstName} ${kycInfo.lastName}`;
      } else {
        // Fallback to email if no KYC info
        creatorName = user.email;
      }
    }
  } catch (error) {
    console.error("Error fetching creator info:", error);
  }

  // Validate and sanitize image URL
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    if (url.includes("google.com/url") || url.includes("googleusercontent.com/imgres")) {
      return false;
    }
    try {
      const urlObj = new URL(url);
      return url.startsWith("data:") || url.startsWith("blob:") || 
             (urlObj.protocol === "http:" || urlObj.protocol === "https:");
    } catch {
      return url.startsWith("/");
    }
  };

  const displayImage = event.imageUrl && isValidImageUrl(event.imageUrl) 
    ? event.imageUrl 
    : "/hero-background.jpg";

  const timeLeft = isUpcoming ? calculateTimeLeft(startTime) : isLive ? "Event is live now" : "Event has ended";
  const canBuyTicket = !event.isFree && event.ticketPriceCents && event.ticketPriceCents > 0;
  
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 pt-20 xs:pt-24 sm:pt-20 md:pt-12 lg:pt-16 pb-6 xs:pb-8 sm:pb-10 md:pb-12 lg:pb-16">
        {/* Back Button */}
        <Link
          href="/events"
          className="inline-flex items-center mb-4 xs:mb-5 sm:mb-6 mt-2 xs:mt-4 sm:mt-2 md:mt-0 text-[#800000] hover:text-[#900000] transition-colors text-sm xs:text-base"
          tabIndex={0}
          aria-label="Back to events"
        >
          <svg
            className="w-4 h-4 xs:w-5 xs:h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-semibold">Back to Events</span>
        </Link>

        {/* Event Image - Large and Full */}
        <div className="relative w-full h-[250px] xs:h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-lg sm:rounded-xl overflow-hidden mb-6 sm:mb-8">
          <Image
            src={displayImage}
            alt={event.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
            {/* Price Badge */}
            <div>
              {event.isFree ? (
                <span className="inline-flex items-center px-4 py-2 rounded-lg text-base font-bold bg-green-500 text-white">
                  Free
                </span>
              ) : event.ticketPriceCents ? (
                <span className="inline-flex items-center px-4 py-2 rounded-lg text-base font-bold bg-[#800000] text-white">
                  {formatCurrency(event.ticketPriceCents / 100)}
                </span>
              ) : null}
            </div>

            {/* Status Badge */}
            <div>
              {isLive ? <LiveNowBadge /> : isUpcoming ? <ComingUpBadge /> : null}
            </div>
          </div>

          {/* Title overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10">
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-2 sm:mb-4 break-words">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8">
            {/* Event Details Section */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8">
              <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-[#800000] mb-3 xs:mb-4 sm:mb-5 md:mb-6 break-words">Event Details</h2>
              
              <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Event Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
              {/* Date & Time Card */}
              <div className="bg-white rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 md:p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-[#800000]"
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Date & Time
                    </h3>
                    <p className="text-base font-medium text-gray-900">
                      {formatDate(eventDate)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDateTime(startTime)} - {formatDateTime(endTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 md:p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-[#800000]"
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Location
                    </h3>
                    <p className="text-base font-medium text-gray-900">
                      {DEFAULT_ADDRESS}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8">
            {/* Time Left Card */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 md:p-6">
              <h3 className="text-xs xs:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 xs:mb-3 sm:mb-4">
                Time Left
              </h3>
              <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-[#800000] break-words">
                {timeLeft}
              </p>
            </div>

            {/* Buy Ticket Button */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 md:p-6">
              {canBuyTicket && event.ticketQuantity && event.ticketQuantity > 0 ? (
                <BuyTicketButton
                  eventId={event.id}
                  eventTitle={event.title}
                  ticketPriceCents={event.ticketPriceCents!}
                  ticketQuantity={event.ticketQuantity}
                />
              ) : (
                <button
                  className="w-full px-3 xs:px-4 sm:px-5 md:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm sm:text-base bg-gray-300 text-gray-600 font-semibold rounded-lg cursor-not-allowed"
                  disabled
                  tabIndex={0}
                  aria-label={event.isFree ? "This is a free event" : "No tickets available"}
                >
                  {event.isFree ? "Free Event" : "No Tickets Available"}
                </button>
              )}
            </div>

            {/* Event Information */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 md:p-6 space-y-3 xs:space-y-3 sm:space-y-4">
              <h3 className="text-sm xs:text-base sm:text-lg font-bold text-[#800000] mb-2 xs:mb-3 sm:mb-4 break-words">Event Information</h3>
              
              {/* Posted Time */}
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Posted
                </p>
                <p className="text-base text-gray-900">
                  {formatDateTime(createdAt)}
                </p>
              </div>

              {/* Posted By */}
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Posted By
                </p>
                <p className="text-base font-medium text-gray-900">
                  {creatorName}
                </p>
                <p className="text-sm text-gray-600">
                  {creatorEmail}
                </p>
              </div>

              {/* Event Status */}
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Status
                </p>
                <p className="text-base text-gray-900 capitalize">
                  {event.status.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
