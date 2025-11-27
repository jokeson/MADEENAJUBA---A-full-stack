import Link from "next/link";
import { getEvents } from "../lib/server-actions/events";
import EventCard from "./cards/EventCard";

const EventsSection = async () => {
  // Fetch approved events from database
  const events = await getEvents();

  // Limit to 6 events for preview on homepage
  const displayEvents = events.slice(0, 6);

  return (
    <section className="relative bg-[#f5f5f0] py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 xs:w-80 sm:w-96 h-64 xs:h-80 sm:h-96 bg-[#800000] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 xs:w-80 sm:w-96 h-64 xs:h-80 sm:h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 z-10">
        {/* Header */}
        <div className="mb-5 xs:mb-6 sm:mb-7 md:mb-8 lg:mb-10 xl:mb-12 text-center">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#800000] mb-2 xs:mb-3 sm:mb-4 px-2 break-words">
            Explore Madeenajuba's Events
          </h2>
          <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-[#800000] max-w-2xl mx-auto px-3 xs:px-4 break-words">
            Discover upcoming events, live happenings, and community gatherings in your city.
          </p>
        </div>

        {/* Events Grid */}
        {displayEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              {displayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  details={event.details}
                  imageUrl={event.imageUrl || "/hero-background.jpg"}
                  startAt={event.startAt}
                  endAt={event.endAt}
                  isPaid={event.isPaid}
                  ticketPriceCents={event.ticketPriceCents}
                  status={event.status}
                  location={event.location}
                />
              ))}
            </div>

            {/* View All Events Link */}
            <div className="text-center px-3 xs:px-4">
              <Link
                href="/events"
                className="inline-flex items-center px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm sm:text-base font-semibold rounded-lg bg-[#800000] text-white hover:bg-[#900000] transition-colors shadow-lg hover:shadow-xl hover:shadow-[#800000]/50"
                tabIndex={0}
                aria-label="View all events"
              >
                View All Events
                <svg
                  className="ml-2 w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5"
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
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-24 w-24 text-[#800000]/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-[#800000]">No events found</h3>
            <p className="mt-2 text-[#800000]">Check back later for upcoming events in Madeenajuba.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;

