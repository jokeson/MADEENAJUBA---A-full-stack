"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS, PostModel, CommentModel, UserModel } from "@/lib/db/models";
import { getUserById } from "@/lib/db/utils";

// Helper function to get MongoDB user ID from localStorage user ID
const getMongoUserId = async (localStorageUserId: string): Promise<ObjectId | null> => {
  try {
    if (ObjectId.isValid(localStorageUserId)) {
      const existingUser = await getUserById(localStorageUserId);
      if (existingUser && existingUser._id) {
        return existingUser._id;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting MongoDB user ID:", error);
    return null;
  }
};

/**
 * Create a new post
 * Only allowed for: journalist, employee, admin
 */
export async function createPost(data: {
  authorUserId: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: "Politics" | "Sports" | "Business & Economy" | "Technology" | "Entertainment" | "Community & Local News" | "Breaking News" | "Opinion and Article" | "Events" | "Interview" | "Lifestyle";
}) {
  try {
    // Validate required fields
    if (!data.authorUserId || !ObjectId.isValid(data.authorUserId)) {
      return { success: false, error: "Invalid user ID" };
    }

    if (!data.title || !data.title.trim()) {
      return { success: false, error: "Post title is required" };
    }

    if (!data.content || !data.content.trim()) {
      return { success: false, error: "Post content is required" };
    }

    if (!data.category) {
      return { success: false, error: "Post category is required" };
    }

    // Check user role
    const authorId = await getMongoUserId(data.authorUserId);
    if (!authorId) {
      return { success: false, error: "User not found" };
    }

    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ _id: authorId });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const allowedRoles = ["journalist", "employee", "admin"];
    if (!allowedRoles.includes(user.role)) {
      return { success: false, error: "Only journalists, employees, and admins can create posts" };
    }

    // Generate excerpt from content (first 150 characters)
    const excerpt = data.content.trim().substring(0, 150).replace(/<[^>]*>/g, "") + "...";

    // Create post document
    const now = new Date();
    const postData: Omit<PostModel, "_id"> = {
      authorUserId: authorId,
      title: data.title.trim(),
      content: data.content.trim(),
      excerpt,
      imageUrl: data.imageUrl?.trim() || undefined,
      category: data.category,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      views: 0,
    };

    const postsCollection = await getCollection<PostModel>(COLLECTIONS.POSTS);
    const result = await postsCollection.insertOne(postData);

    if (result.insertedId) {
      return {
        success: true,
        postId: result.insertedId.toString(),
        message: "Post created and published successfully!",
      };
    } else {
      return { success: false, error: "Failed to create post" };
    }
  } catch (error) {
    console.error("Error creating post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    };
  }
}

/**
 * Get all published posts for Latest News section
 * Returns posts sorted by published date (newest first)
 */
export async function getAllPosts() {
  try {
    const postsCollection = await getCollection<PostModel>(COLLECTIONS.POSTS);
    const posts = await postsCollection
      .find({})
      .sort({ publishedAt: -1 })
      .toArray();

    // Format posts for client-side use
    const formattedPosts = posts.map((post) => ({
      id: post._id?.toString() || "",
      title: post.title,
      description: post.excerpt || post.content.substring(0, 150).replace(/<[^>]*>/g, "") + "...",
      image: post.imageUrl || "/hero-background.jpg",
      category: post.category,
      datePosted: post.publishedAt.toISOString(),
      timePosted: post.publishedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      views: post.views ? `${Math.floor(post.views / 1000)}K` : "0",
      authorUserId: post.authorUserId.toString(),
    }));

    return { success: true, posts: formattedPosts };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch posts",
      posts: [],
    };
  }
}

/**
 * Get a single post by ID with author information
 */
export async function getPostById(postId: string) {
  try {
    if (!ObjectId.isValid(postId)) {
      return { success: false, error: "Invalid post ID" };
    }

    const postsCollection = await getCollection<PostModel>(COLLECTIONS.POSTS);
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Get author information
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const author = await usersCollection.findOne({ _id: post.authorUserId });

    // Increment views
    await postsCollection.updateOne(
      { _id: post._id },
      { $inc: { views: 1 } }
    );

    // Get KYC data for author (for name and avatar)
    const kycCollection = await getCollection(COLLECTIONS.KYC);
    const kyc = await kycCollection.findOne({ userId: post.authorUserId });

    // Get avatar from KYC documents (use id_front if available)
    const avatarDoc = kyc?.documents?.find((doc: { type: string; url: string; uploadedAt: Date }) => doc.type === "id_front") || kyc?.documents?.[0];

    const formattedPost = {
      id: post._id?.toString() || "",
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl || "/hero-background.jpg",
      publishedAt: post.publishedAt.toISOString(),
      publishedDate: post.publishedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      publishedTime: post.publishedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      likes: post.likes || 0,
      views: post.views || 0,
      category: post.category,
      author: {
        id: author?._id?.toString() || "",
        email: author?.email || "",
        firstName: kyc?.firstName || "",
        lastName: kyc?.lastName || "",
        avatar: avatarDoc?.url || undefined,
      },
    };

    return { success: true, post: formattedPost };
  } catch (error) {
    console.error("Error fetching post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch post",
    };
  }
}

/**
 * Like a post
 */
export async function likePost(postId: string) {
  try {
    if (!ObjectId.isValid(postId)) {
      return { success: false, error: "Invalid post ID" };
    }

    const postsCollection = await getCollection<PostModel>(COLLECTIONS.POSTS);
    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { likes: 1 } }
    );

    if (result.modifiedCount > 0) {
      return { success: true };
    } else {
      return { success: false, error: "Post not found" };
    }
  } catch (error) {
    console.error("Error liking post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to like post",
    };
  }
}

/**
 * Add a comment to a post
 * Only allowed for logged-in users
 */
export async function addComment(data: {
  postId: string;
  authorUserId: string;
  content: string;
}) {
  try {
    if (!ObjectId.isValid(data.postId)) {
      return { success: false, error: "Invalid post ID" };
    }

    if (!data.authorUserId || !ObjectId.isValid(data.authorUserId)) {
      return { success: false, error: "Invalid user ID" };
    }

    if (!data.content || !data.content.trim()) {
      return { success: false, error: "Comment content is required" };
    }

    const authorId = await getMongoUserId(data.authorUserId);
    if (!authorId) {
      return { success: false, error: "User not found" };
    }

    const now = new Date();
    const commentData: Omit<CommentModel, "_id"> = {
      postId: new ObjectId(data.postId),
      authorUserId: authorId,
      content: data.content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const commentsCollection = await getCollection<CommentModel>(COLLECTIONS.COMMENTS);
    const result = await commentsCollection.insertOne(commentData);

    if (result.insertedId) {
      return {
        success: true,
        commentId: result.insertedId.toString(),
        message: "Comment added successfully",
      };
    } else {
      return { success: false, error: "Failed to add comment" };
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add comment",
    };
  }
}

/**
 * Get all comments for a post
 */
export async function getPostComments(postId: string) {
  try {
    if (!ObjectId.isValid(postId)) {
      return { success: false, error: "Invalid post ID", comments: [] };
    }

    const commentsCollection = await getCollection<CommentModel>(COLLECTIONS.COMMENTS);
    const comments = await commentsCollection
      .find({ postId: new ObjectId(postId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Get author information for each comment
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const kycCollection = await getCollection(COLLECTIONS.KYC);

    const formattedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await usersCollection.findOne({ _id: comment.authorUserId });
        const kyc = await kycCollection.findOne({ userId: comment.authorUserId });

        // Get avatar from KYC documents (use id_front if available)
        const avatarDoc = kyc?.documents?.find((doc: { type: string; url: string; uploadedAt: Date }) => doc.type === "id_front") || kyc?.documents?.[0];

        return {
          id: comment._id?.toString() || "",
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          createdDate: comment.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          createdTime: comment.createdAt.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          author: {
            id: author?._id?.toString() || "",
            email: author?.email || "",
            firstName: kyc?.firstName || "",
            lastName: kyc?.lastName || "",
            avatar: avatarDoc?.url || undefined,
          },
        };
      })
    );

    return { success: true, comments: formattedComments };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch comments",
      comments: [],
    };
  }
}

/**
 * Get posts by user ID
 * Returns all posts created by a specific user
 */
export async function getUserPosts(userId: string) {
  try {
    if (!ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID", posts: [] };
    }

    const authorId = await getMongoUserId(userId);
    if (!authorId) {
      return { success: false, error: "User not found", posts: [] };
    }

    const postsCollection = await getCollection<PostModel>(COLLECTIONS.POSTS);
    const posts = await postsCollection
      .find({ authorUserId: authorId })
      .sort({ publishedAt: -1 })
      .toArray();

    const formattedPosts = posts.map((post) => ({
      id: post._id?.toString() || "",
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || post.content.substring(0, 150).replace(/<[^>]*>/g, "") + "...",
      imageUrl: post.imageUrl || "/hero-background.jpg",
      category: post.category,
      publishedAt: post.publishedAt.toISOString(),
      publishedDate: post.publishedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      publishedTime: post.publishedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      likes: post.likes || 0,
      views: post.views || 0,
      createdAt: post.createdAt.toISOString(),
      authorUserId: post.authorUserId.toString(),
    }));

    return { success: true, posts: formattedPosts };
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch posts",
      posts: [],
    };
  }
}

/**
 * Get all posts (for admin)
 * Returns all posts in the system
 */
export async function getAllPostsForAdmin() {
  try {
    const postsCollection = await getCollection<PostModel>(COLLECTIONS.POSTS);
    const posts = await postsCollection
      .find({})
      .sort({ publishedAt: -1 })
      .toArray();

    // Get author information for each post
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const kycCollection = await getCollection(COLLECTIONS.KYC);

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await usersCollection.findOne({ _id: post.authorUserId });
        const kyc = await kycCollection.findOne({ userId: post.authorUserId });
        const avatarDoc = kyc?.documents?.find((doc: { type: string; url: string; uploadedAt: Date }) => doc.type === "id_front") || kyc?.documents?.[0];

        return {
          id: post._id?.toString() || "",
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || post.content.substring(0, 150).replace(/<[^>]*>/g, "") + "...",
          imageUrl: post.imageUrl || "/hero-background.jpg",
          category: post.category,
          publishedAt: post.publishedAt.toISOString(),
          publishedDate: post.publishedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          publishedTime: post.publishedAt.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          likes: post.likes || 0,
          views: post.views || 0,
          createdAt: post.createdAt.toISOString(),
          authorUserId: post.authorUserId.toString(),
          author: {
            id: author?._id?.toString() || "",
            email: author?.email || "",
            firstName: kyc?.firstName || "",
            lastName: kyc?.lastName || "",
            avatar: avatarDoc?.url || undefined,
          },
        };
      })
    );

    return { success: true, posts: formattedPosts };
  } catch (error) {
    console.error("Error fetching all posts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch posts",
      posts: [],
    };
  }
}

/**
 * Delete a post
 * Only the post author or admin can delete
 */
export async function deletePost(postId: string, userId: string) {
  try {
    if (!ObjectId.isValid(postId)) {
      return { success: false, error: "Invalid post ID" };
    }

    if (!ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    const postsCollection = await getCollection<PostModel>(COLLECTIONS.POSTS);
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    const authorId = await getMongoUserId(userId);
    if (!authorId) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin or the post author
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ _id: authorId });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isAdmin = user.role === "admin";
    const isAuthor = post.authorUserId.toString() === authorId.toString();

    if (!isAdmin && !isAuthor) {
      return { success: false, error: "You don't have permission to delete this post" };
    }

    // Delete the post
    await postsCollection.deleteOne({ _id: new ObjectId(postId) });

    // Delete all comments associated with the post
    const commentsCollection = await getCollection<CommentModel>(COLLECTIONS.COMMENTS);
    await commentsCollection.deleteMany({ postId: new ObjectId(postId) });

    return { success: true, message: "Post deleted successfully" };
  } catch (error) {
    console.error("Error deleting post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
  }
}

/**
 * Reply to a comment
 */
export async function replyToComment(data: {
  postId: string;
  parentCommentId: string;
  authorUserId: string;
  content: string;
}) {
  try {
    if (!ObjectId.isValid(data.postId)) {
      return { success: false, error: "Invalid post ID" };
    }

    if (!ObjectId.isValid(data.parentCommentId)) {
      return { success: false, error: "Invalid parent comment ID" };
    }

    if (!data.authorUserId || !ObjectId.isValid(data.authorUserId)) {
      return { success: false, error: "Invalid user ID" };
    }

    if (!data.content || !data.content.trim()) {
      return { success: false, error: "Reply content is required" };
    }

    const authorId = await getMongoUserId(data.authorUserId);
    if (!authorId) {
      return { success: false, error: "User not found" };
    }

    const now = new Date();
    const replyData: Omit<CommentModel, "_id"> = {
      postId: new ObjectId(data.postId),
      authorUserId: authorId,
      content: data.content.trim(),
      parentCommentId: new ObjectId(data.parentCommentId),
      createdAt: now,
      updatedAt: now,
    };

    const commentsCollection = await getCollection<CommentModel>(COLLECTIONS.COMMENTS);
    const result = await commentsCollection.insertOne(replyData);

    if (result.insertedId) {
      return {
        success: true,
        commentId: result.insertedId.toString(),
        message: "Reply added successfully",
      };
    } else {
      return { success: false, error: "Failed to add reply" };
    }
  } catch (error) {
    console.error("Error adding reply:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add reply",
    };
  }
}

/**
 * Get comments with replies (nested structure)
 */
export async function getPostCommentsWithReplies(postId: string) {
  try {
    if (!ObjectId.isValid(postId)) {
      return { success: false, error: "Invalid post ID", comments: [] };
    }

    const commentsCollection = await getCollection<CommentModel>(COLLECTIONS.COMMENTS);
    const allComments = await commentsCollection
      .find({ postId: new ObjectId(postId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Get author information for each comment
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const kycCollection = await getCollection(COLLECTIONS.KYC);

    const commentsWithAuthors = await Promise.all(
      allComments.map(async (comment) => {
        const author = await usersCollection.findOne({ _id: comment.authorUserId });
        const kyc = await kycCollection.findOne({ userId: comment.authorUserId });
        const avatarDoc = kyc?.documents?.find((doc: { type: string; url: string; uploadedAt: Date }) => doc.type === "id_front") || kyc?.documents?.[0];

        return {
          id: comment._id?.toString() || "",
          content: comment.content,
          parentCommentId: comment.parentCommentId?.toString(),
          createdAt: comment.createdAt.toISOString(),
          createdDate: comment.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          createdTime: comment.createdAt.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          author: {
            id: author?._id?.toString() || "",
            email: author?.email || "",
            firstName: kyc?.firstName || "",
            lastName: kyc?.lastName || "",
            avatar: avatarDoc?.url || undefined,
          },
        };
      })
    );

    // Organize comments into parent-child structure
    const topLevelComments = commentsWithAuthors.filter((c) => !c.parentCommentId);
    const replies = commentsWithAuthors.filter((c) => c.parentCommentId);

    const formattedComments = topLevelComments.map((comment) => {
      const commentReplies = replies.filter((r) => r.parentCommentId === comment.id);
      return {
        ...comment,
        replies: commentReplies,
      };
    });

    return { success: true, comments: formattedComments };
  } catch (error) {
    console.error("Error fetching comments with replies:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch comments",
      comments: [],
    };
  }
}

