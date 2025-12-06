// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { getPostById } from "@/lib/server-actions/posts";
import NewsDetailClient from "@/components/news/NewsDetailClient";
import Image from "next/image";
import { formatDate } from "@/lib/format";
import BackButton from "@/components/news/BackButton";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPostById(slug);

  if (!result.success || !result.post) {
    return (
      <div className="min-h-screen bg-[#f5f5f0]">
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            <h1 className="text-xl font-bold mb-2">Post Not Found</h1>
            <p>{result.error || "The post you're looking for doesn't exist."}</p>
          </div>
        </div>
      </div>
    );
  }

  const { post } = result;

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 pt-20 xs:pt-24 sm:pt-20 md:pt-20 lg:pt-24 pb-6 xs:pb-8 sm:pb-10 md:pb-12 lg:pb-16">
        {/* Back Button */}
        <BackButton />

        {/* Header Image */}
        {post.imageUrl && (
          <div className="relative w-full h-64 sm:h-80 md:h-96 mb-8 rounded-lg overflow-hidden mt-5">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
            />
          </div>
        )}

        {/* Post Title */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-[#800000] mb-4 break-words">
          {post.title}
        </h1>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-gray-600 mb-6">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{post.publishedDate}</span>
          <span>•</span>
          <span>{post.publishedTime}</span>
        </div>

        {/* Full Content */}
        <div
          className="prose prose-lg max-w-none mb-8 text-gray-900 [&>p]:text-lg [&>p]:leading-8 [&>p]:mb-6 [&>p:last-child]:mb-0 [&>p]:text-gray-900 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-8 [&>h1]:text-[#800000] [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:text-[#800000] [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mb-3 [&>h3]:mt-5 [&>h3]:text-[#800000] [&>ul]:mb-6 [&>ul]:pl-6 [&>ul]:list-disc [&>ol]:mb-6 [&>ol]:pl-6 [&>ol]:list-decimal [&>li]:mb-2 [&>li]:text-lg [&>li]:leading-8 [&>blockquote]:border-l-4 [&>blockquote]:border-[#800000] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:mb-6 [&>blockquote]:text-gray-700 [&>img]:rounded-lg [&>img]:my-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Interactive Section (Like, Share, Author, Comments) */}
        <NewsDetailClient
          postId={post.id}
          initialLikes={post.likes}
          author={post.author}
        />
      </div>
    </div>
  );
}

