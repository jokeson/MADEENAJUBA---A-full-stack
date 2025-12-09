import NewsCard from "@/components/cards/NewsCard";
import { getAllPosts } from "@/lib/server-actions/posts";

export default async function NewsPage() {
  const result = await getAllPosts();
  const newsItems = result.success ? result.posts : [];

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-[#800000] mb-4 xs:mb-6 sm:mb-8 break-words">
          All News
        </h1>
        
        {newsItems.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-sm xs:text-base sm:text-lg">
            <p>No news posts available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 w-full">
            {newsItems.map((news, index) => (
              <div key={news.id} className="bg-transparent">
                <NewsCard news={news} index={index} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

