import NewsCard from "./cards/NewsCard";
import { getAllPosts } from "@/lib/server-actions/posts";

const CertificationsAwards = async () => {
  const result = await getAllPosts();
  const newsItems = result.success ? result.posts : [];

  // If no posts, show empty state or fallback
  if (newsItems.length === 0) {
    return (
      <section className="py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black mb-4 xs:mb-5 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12 text-center px-2 break-words">
            Latest News
          </h2>
          <div className="text-center text-gray-500 py-12">
            <p>No news posts available yet. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

  const LatestNews = newsItems.map((news, index) => (
    <div key={news.id} className="bg-transparent">
      <NewsCard news={news} index={index} />
    </div>
  ));

  return (
    <section className="py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8">
        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black mb-4 xs:mb-5 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12 text-center px-2 break-words">
          Latest News
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
          {LatestNews}
        </div>
      </div>
    </section>
  );
};

export default CertificationsAwards;

