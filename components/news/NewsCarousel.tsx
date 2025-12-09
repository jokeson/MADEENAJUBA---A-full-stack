"use client";

import { useState, useRef, useEffect } from "react";
import NewsCard from "../cards/NewsCard";
import Link from "next/link";

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

interface NewsCarouselProps {
  newsItems: NewsItem[];
}

const NewsCarousel = ({ newsItems }: NewsCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const cardsPerView = 4;

  // Sort news items by most recent first (they should already be sorted, but ensure it)
  const sortedNewsItems = [...newsItems].sort((a, b) => {
    const dateA = new Date(a.datePosted).getTime();
    const dateB = new Date(b.datePosted).getTime();
    return dateB - dateA;
  });

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Check initial scroll state
  useEffect(() => {
    handleScroll();
    // Also check on resize
    const handleResize = () => {
      setTimeout(handleScroll, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sortedNewsItems.length]);

  const handlePrevious = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.clientWidth / cardsPerView;
      const gap = 24; // gap-6 = 1.5rem = 24px
      const scrollAmount = cardWidth + gap;
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleNext = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.clientWidth / cardsPerView;
      const gap = 24; // gap-6 = 1.5rem = 24px
      const scrollAmount = cardWidth + gap;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Limit to 4 cards for mobile
  const displayedCards = sortedNewsItems.slice(0, 4);
  const hasMoreCards = sortedNewsItems.length > 4;

  return (
    <>
      {/* Desktop/Tablet: Horizontal Carousel */}
      <div className="hidden md:block">
        <div className="relative flex items-center gap-5">
          {/* Navigation Button - Left Side */}
          <button
            onClick={handlePrevious}
            disabled={!canScrollLeft}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePrevious();
              }
            }}
            className={`flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
              canScrollLeft
                ? "text-[#800000] hover:text-[#600000] cursor-pointer"
                : "text-gray-300 cursor-not-allowed"
            }`}
            aria-label="Previous news cards"
            tabIndex={canScrollLeft ? 0 : -1}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Scrollable Container - Always show 4 cards */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 flex gap-6 overflow-x-auto scroll-smooth"
            style={{ 
              scrollbarWidth: "none", 
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {sortedNewsItems.map((news, index) => (
              <div
                key={news.id}
                className="flex-shrink-0"
                style={{ width: `calc((100% - ${(cardsPerView - 1) * 24}px) / ${cardsPerView})` }}
              >
                <NewsCard news={news} index={index} />
              </div>
            ))}
          </div>

          {/* Navigation Button - Right Side */}
          <button
            onClick={handleNext}
            disabled={!canScrollRight}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleNext();
              }
            }}
            className={`flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
              canScrollRight
                ? "text-[#800000] hover:text-[#600000] cursor-pointer"
                : "text-gray-300 cursor-not-allowed"
            }`}
            aria-label="Next news cards"
            tabIndex={canScrollRight ? 0 : -1}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Custom scrollbar hiding */}
          <style jsx global>{`
            .overflow-x-auto::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      </div>

      {/* Mobile: Vertical Layout with 4 cards */}
      <div className="block md:hidden">
        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          {displayedCards.map((news, index) => (
            <div key={news.id}>
              <NewsCard news={news} index={index} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        {hasMoreCards && (
          <div className="mt-6 text-center">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#800000]/90 transition-colors"
              tabIndex={0}
              aria-label="View all news"
            >
              <span>View All News</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default NewsCarousel;
