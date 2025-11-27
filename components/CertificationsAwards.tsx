import NewsCard from "./cards/NewsCard";

const CertificationsAwards = () => {
  const newsItems = [
    {
      id: "1",
      title: "City Council Approves New Downtown Development Project",
      description: "The city council has unanimously approved a major downtown development project that will bring new businesses and housing to the area.",
      image: "/hero-background.jpg",
      datePosted: new Date().toISOString(),
      timePosted: "2:30 PM",
      views: "45K",
    },
    {
      id: "2",
      title: "Local Festival Draws Record Attendance This Weekend",
      description: "The annual city festival broke attendance records this year with over 50,000 visitors enjoying food, music, and local vendors.",
      image: "/hero-background.jpg",
      datePosted: new Date(Date.now() - 86400000).toISOString(),
      timePosted: "11:15 AM",
      views: "32K",
    },
    {
      id: "3",
      title: "New Public Transportation Route Opens Next Month",
      description: "City officials announced a new bus route connecting the east and west sides of the city, improving access for thousands of residents.",
      image: "/hero-background.jpg",
      datePosted: new Date(Date.now() - 172800000).toISOString(),
      timePosted: "9:00 AM",
      views: "28K",
    },
    {
      id: "4",
      title: "Local School District Receives State Recognition Award",
      description: "The city's school district has been recognized by the state for excellence in education and innovative teaching methods.",
      image: "/hero-background.jpg",
      datePosted: new Date(Date.now() - 259200000).toISOString(),
      timePosted: "3:45 PM",
      views: "19K",
    },
    
  ];
const LatestNews = newsItems.map((news, index) => (
    <div
      key={news.id}
      className="bg-transparent"
    >
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

