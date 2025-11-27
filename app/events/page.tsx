import { getEvents } from "../../lib/server-actions/events";
import EventCard from "../../components/cards/EventCard";

export default async function EventsPage() {
  // Fetch approved events from database
  const displayEvents = await getEvents();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-6 xs:mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#800000] mb-3 xs:mb-4 sm:mb-6 break-words">
            Explore Madeenajuba's Events
          </h1>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-[#800000] max-w-2xl break-words">
            Discover upcoming events, live happenings, and community gatherings in your city.
          </p>
        </div>

        {/* Events Grid */}
        {displayEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8">
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
    </div>
  );
}
