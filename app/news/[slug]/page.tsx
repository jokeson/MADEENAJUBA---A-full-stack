export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16">
        <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#800000] mb-4 xs:mb-6 sm:mb-8 break-words">News Article: {slug}</h1>
        <p className="text-sm xs:text-base sm:text-lg text-[#800000] break-words">News detail page coming soon...</p>
      </div>
    </div>
  );
}

