"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { createPost, getUserPosts, getAllPostsForAdmin, deletePost } from "@/lib/server-actions/posts";
import { uploadImageToCloudinary } from "@/lib/server-actions/cloudinary";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type TabType = "create" | "posts";

const CreatePostPage = () => {
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("create");
  
  // Create Post Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"Politics" | "Sports" | "Business & Economy" | "Technology" | "Entertainment" | "Community & Local News" | "Breaking News" | "Opinion and Article" | "Events" | "Interview" | "Lifestyle">("Politics");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [roleError, setRoleError] = useState("");

  // Posts List State
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    postId: string;
    postTitle: string;
  }>({
    isOpen: false,
    postId: "",
    postTitle: "",
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/sign-in");
      return;
    }

    // Check user role
    if (!loading && isAuthenticated && user) {
      const allowedRoles = ["journalist", "employee", "admin"];
      if (!allowedRoles.includes(user.role)) {
        setRoleError("Only journalists, employees, and admins can create posts.");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (activeTab === "posts" && user) {
      loadPosts();
    }
  }, [activeTab, user]);

  const loadPosts = async () => {
    if (!user) return;
    
    setLoadingPosts(true);
    try {
      let result;
      if (user.role === "admin") {
        result = await getAllPostsForAdmin();
      } else {
        result = await getUserPosts(user.id);
      }

      if (result.success) {
        setPosts(result.posts);
      } else {
        toast.error(result.error || "Failed to load posts");
      }
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setImageFile(file);
    setImageUrl("");

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Post title is required");
      return;
    }

    if (!content.trim()) {
      setError("Post content is required");
      return;
    }

    if (!user?.id) {
      setError("User not found");
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl.trim() || undefined;

      if (imageFile) {
        const compressedBase64 = await new Promise<string>((resolve, reject) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          const img = new window.Image();
          const objectUrl = URL.createObjectURL(imageFile);

          img.onload = () => {
            try {
              const maxWidth = 1200;
              const maxHeight = 1200;
              let width = img.width;
              let height = img.height;

              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
              }

              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              let compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
              if (compressedDataUrl.length > 900000) {
                compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);
              }

              URL.revokeObjectURL(objectUrl);
              resolve(compressedDataUrl);
            } catch (error) {
              URL.revokeObjectURL(objectUrl);
              reject(error);
            }
          };

          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Failed to load image"));
          };

          img.src = objectUrl;
        });

        const uploadResult = await uploadImageToCloudinary(
          compressedBase64,
          "madeenajuba/posts",
          undefined
        );

        if (!uploadResult.success || !uploadResult.url) {
          setError(uploadResult.error || "Failed to upload image. Please try again.");
          setSubmitting(false);
          return;
        }

        finalImageUrl = uploadResult.url;
      }

      const result = await createPost({
        authorUserId: user.id,
        title: title.trim(),
        content: content.trim(),
        imageUrl: finalImageUrl,
        category,
      });

      if (result.success) {
        toast.success(result.message || "Post created successfully!");
        setTitle("");
        setContent("");
        setCategory("Politics");
        setImageFile(null);
        setImagePreview("");
        setImageUrl("");
        // Reload posts if on posts tab
        if (activeTab === "posts") {
          loadPosts();
        }
        // Navigate to homepage to see the post in Latest News section
        setTimeout(() => {
          router.push("/");
        }, 1000); // Small delay to show the success toast
      } else {
        setError(result.error || "Failed to create post");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (postId: string, postTitle: string) => {
    setDeleteModal({
      isOpen: true,
      postId,
      postTitle,
    });
  };

  const handleDeletePost = async () => {
    if (!user || !deleteModal.postId) return;

    setDeleting(true);
    try {
      const result = await deletePost(deleteModal.postId, user.id);
      if (result.success) {
        toast.success("Post deleted successfully");
        setDeleteModal({ isOpen: false, postId: "", postTitle: "" });
        setDeleting(false);
        loadPosts();
      } else {
        toast.error(result.error || "Failed to delete post");
        setDeleting(false);
      }
    } catch (error) {
      toast.error("Failed to delete post");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roleError) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex">
        <Sidebar />
        <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60 md:mt-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p>{roleError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60 md:mt-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-300">
            <nav className="flex gap-4" aria-label="Post management tabs">
              <button
                onClick={() => setActiveTab("create")}
                className={`py-3 px-4 border-b-2 font-semibold transition-colors ${
                  activeTab === "create"
                    ? "border-[#800000] text-[#800000]"
                    : "border-transparent text-gray-600 hover:text-[#800000]"
                }`}
                aria-selected={activeTab === "create"}
                role="tab"
              >
                Create Post
              </button>
              <button
                onClick={() => setActiveTab("posts")}
                className={`py-3 px-4 border-b-2 font-semibold transition-colors ${
                  activeTab === "posts"
                    ? "border-[#800000] text-[#800000]"
                    : "border-transparent text-gray-600 hover:text-[#800000]"
                }`}
                aria-selected={activeTab === "posts"}
                role="tab"
              >
                Posts
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "create" ? (
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#800000] mb-8">
                Create Post
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Title Input */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[#800000] mb-2">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                    placeholder="Enter post title"
                    required
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-[#800000] mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                    required
                  >
                    <option value="Politics">Politics</option>
                    <option value="Sports">Sports</option>
                    <option value="Business & Economy">Business & Economy</option>
                    <option value="Technology">Technology</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Community & Local News">Community & Local News</option>
                    <option value="Breaking News">Breaking News</option>
                    <option value="Opinion and Article">Opinion and Article</option>
                    <option value="Events">Events</option>
                    <option value="Interview">Interview</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>
                </div>

                {/* Content Input */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-[#800000] mb-2">
                    Post Content *
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent resize-y"
                    placeholder="Write your post content here. You can paste text from external sources or write directly."
                    required
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Tip: You can write content directly or paste text from external sources.
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#800000] mb-2">
                    Post Image (Optional)
                  </label>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#800000] file:text-white hover:file:bg-[#600000] cursor-pointer"
                      />
                    </div>
                    <div className="text-sm text-gray-600">OR</div>
                    <div>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={handleImageUrlChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                        placeholder="Enter image URL"
                      />
                    </div>
                    {imagePreview && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-[#800000] mb-2">Image Preview:</p>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#600000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Publishing..." : "Publish Post"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#800000] mb-8">
                {user?.role === "admin" ? "All Posts" : "My Posts"}
              </h1>

              {loadingPosts ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-300">
                  <p className="text-gray-600">No posts found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg border border-gray-300 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {post.imageUrl && (
                        <div className="relative w-full h-48">
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute top-2 left-2">
                            <span className="bg-[#800000] text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {post.category}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-[#800000] mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{post.publishedDate}</span>
                          <span>{post.views} views</span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/news/${post.id}`}
                            className="flex-1 text-center px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#600000] transition-colors text-sm font-semibold"
                          >
                            View Details
                          </Link>
                          {(user?.role === "admin" || post.authorUserId === user?.id) && (
                            <button
                              onClick={() => handleDeleteClick(post.id, post.title)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, postId: "", postTitle: "" })}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message={`Are you sure you want to delete "${deleteModal.postTitle}"? This action cannot be undone and will also delete all associated comments.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        isLoading={deleting}
      />
    </div>
  );
};

export default CreatePostPage;
