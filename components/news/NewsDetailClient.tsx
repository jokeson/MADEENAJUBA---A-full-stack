"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { likePost, addComment, getPostCommentsWithReplies, replyToComment } from "@/lib/server-actions/posts";
import toast from "react-hot-toast";
import Image from "next/image";

interface NewsDetailClientProps {
  postId: string;
  initialLikes: number;
  author: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

const NewsDetailClient = ({ postId, initialLikes, author }: NewsDetailClientProps) => {
  const { isAuthenticated, user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<{ [key: string]: boolean }>({});
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentTextareaVisible, setCommentTextareaVisible] = useState(false);
  const isAuthor = user?.id === author.id;

  useEffect(() => {
    const loadComments = async () => {
      try {
        const result = await getPostCommentsWithReplies(postId);
        if (result.success) {
          setComments(result.comments);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [postId]);

  const handleLike = async () => {
    if (liked) return;

    try {
      const result = await likePost(postId);
      if (result.success) {
        setLikes((prev) => prev + 1);
        setLiked(true);
        toast.success("Post liked!");
      } else {
        toast.error(result.error || "Failed to like post");
      }
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = document.title;

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
        break;
      case "tiktok":
        // TikTok doesn't have a direct share URL, so we'll copy to clipboard
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        return;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmittingComment(true);
    try {
      const result = await addComment({
        postId,
        authorUserId: user.id,
        content: comment.trim(),
      });

      if (result.success) {
        toast.success("Comment added successfully!");
        setComment("");
        setCommentTextareaVisible(false);
        // Reload comments
        const commentsResult = await getPostCommentsWithReplies(postId);
        if (commentsResult.success) {
          setComments(commentsResult.comments);
        }
      } else {
        toast.error(result.error || "Failed to add comment");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = async (parentCommentId: string) => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to reply");
      return;
    }

    const replyText = replyContent[parentCommentId]?.trim();
    if (!replyText) {
      toast.error("Reply cannot be empty");
      return;
    }

    setSubmittingReply({ ...submittingReply, [parentCommentId]: true });
    try {
      const result = await replyToComment({
        postId,
        parentCommentId,
        authorUserId: user.id,
        content: replyText,
      });

      if (result.success) {
        toast.success("Reply added successfully!");
        setReplyContent({ ...replyContent, [parentCommentId]: "" });
        setReplyingTo(null);
        // Reload comments
        const commentsResult = await getPostCommentsWithReplies(postId);
        if (commentsResult.success) {
          setComments(commentsResult.comments);
        }
      } else {
        toast.error(result.error || "Failed to add reply");
      }
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setSubmittingReply({ ...submittingReply, [parentCommentId]: false });
    }
  };

  const getAuthorInitials = (firstName: string, lastName: string, email: string): string => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Social Media Style Interaction Bar */}
      <div className="border-t border-gray-200 pt-4">
        {/* Reactions and Counts Row */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {/* Reaction Icons */}
            <div className="flex items-center -space-x-1">
              <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
              </div>
              <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center">
                <span className="text-xs">😄</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {likes > 0 ? `${likes} others` : 'Be the first to like'}
            </span>
          </div>
          
          {/* Comment and Share Counts */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCommentsVisible(!commentsVisible)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#800000] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{comments.length}</span>
            </button>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-around">
          <button
            onClick={handleLike}
            disabled={liked}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-1 justify-center ${
              liked
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="Like this post"
          >
            <svg
              className={`w-5 h-5 ${liked ? "text-red-600" : "text-gray-500"}`}
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span>Like</span>
          </button>
          
          <button
            onClick={() => {
              setCommentTextareaVisible(!commentTextareaVisible);
              setCommentsVisible(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors flex-1 justify-center"
            aria-label="Comment on this post"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comment</span>
          </button>
          
          <button
            onClick={() => handleShare("facebook")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors flex-1 justify-center"
            aria-label="Share this post"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comment Textarea - Toggleable - Professional Style */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          commentTextareaVisible
            ? "max-h-[500px] opacity-100 mb-4"
            : "max-h-0 opacity-0 mb-0"
        }`}
      >
        <div className="bg-white rounded-xl p-6 lg:p-8 border border-gray-200 shadow-sm">
          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div className="flex items-start gap-3">
                {/* User Avatar */}
                {user && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#800000] to-[#600000] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0 border-2 border-gray-200 shadow-sm">
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent resize-y bg-white text-gray-700 placeholder-gray-400"
                    placeholder="Write a comment..."
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCommentTextareaVisible(false);
                    setComment("");
                  }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-6 py-2.5 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#600000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {submittingComment ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </span>
                  ) : (
                    "Post Comment"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-center border border-gray-200">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-gray-600 mb-3 font-medium">Please sign in to write a comment</p>
              <a
                href="/auth/sign-in"
                className="inline-block px-6 py-2.5 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#600000] transition-colors shadow-sm hover:shadow-md"
              >
                Sign In
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section - Professional Style */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          commentsVisible
            ? "max-h-[5000px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        {/* Comments List */}
        {!commentsVisible ? null : loadingComments ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 lg:p-8 border border-gray-200 shadow-sm">
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-4">
                  {/* Comment Author Avatar - Professional Style */}
                  {comment.author.avatar ? (
                    <div className="relative flex-shrink-0">
                      <Image
                        src={comment.author.avatar}
                        alt={`${comment.author.firstName} ${comment.author.lastName}`}
                        width={48}
                        height={48}
                        className="rounded-full object-cover w-12 h-12 border-2 border-gray-200 shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#800000] to-[#600000] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0 border-2 border-gray-200 shadow-sm">
                      {getAuthorInitials(
                        comment.author.firstName,
                        comment.author.lastName,
                        comment.author.email
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {/* Comment Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#800000] text-base">
                          {comment.author.firstName && comment.author.lastName
                            ? `${comment.author.firstName} ${comment.author.lastName}`
                            : comment.author.email}
                        </p>
                        {comment.author.id === user?.id && (
                          <span className="px-2 py-0.5 bg-[#800000]/10 text-[#800000] rounded text-xs font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {comment.createdDate} at {comment.createdTime}
                      </span>
                    </div>
                    {/* Comment Content */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-100">
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>
                    
                    {/* Reply Button */}
                    {isAuthenticated && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-sm text-[#800000] hover:text-[#600000] font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        {replyingTo === comment.id ? "Cancel Reply" : "Reply"}
                      </button>
                    )}

                    {/* Reply Form */}
                    {replyingTo === comment.id && isAuthenticated && (
                      <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200">
                        <textarea
                          value={replyContent[comment.id] || ""}
                          onChange={(e) =>
                            setReplyContent({ ...replyContent, [comment.id]: e.target.value })
                          }
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent resize-y mb-2 text-sm bg-white"
                          placeholder="Write a reply..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReply(comment.id)}
                            disabled={submittingReply[comment.id]}
                            className="px-4 py-1.5 bg-[#800000] text-white rounded-lg text-sm font-semibold hover:bg-[#600000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submittingReply[comment.id] ? "Posting..." : "Post Reply"}
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent({ ...replyContent, [comment.id]: "" });
                            }}
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-4 pl-4 space-y-4 border-l-2 border-gray-200">
                        {comment.replies.map((reply: any) => (
                          <div key={reply.id} className="flex items-start gap-3">
                            {reply.author.avatar ? (
                              <div className="relative flex-shrink-0">
                                <Image
                                  src={reply.author.avatar}
                                  alt={`${reply.author.firstName} ${reply.author.lastName}`}
                                  width={36}
                                  height={36}
                                  className="rounded-full object-cover w-9 h-9 border-2 border-gray-200"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#800000] to-[#600000] text-white flex items-center justify-center font-semibold text-xs flex-shrink-0 border-2 border-gray-200">
                                {getAuthorInitials(
                                  reply.author.firstName,
                                  reply.author.lastName,
                                  reply.author.email
                                )}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="font-semibold text-sm text-[#800000]">
                                  {reply.author.firstName && reply.author.lastName
                                    ? `${reply.author.firstName} ${reply.author.lastName}`
                                    : reply.author.email}
                                </p>
                                {reply.author.id === user?.id && (
                                  <span className="px-1.5 py-0.5 bg-[#800000]/10 text-[#800000] rounded text-xs font-medium">
                                    You
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">
                                  {reply.createdDate} at {reply.createdTime}
                                </span>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{reply.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default NewsDetailClient;

