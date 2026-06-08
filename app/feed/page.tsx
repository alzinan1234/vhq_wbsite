"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { Avatar, Modal } from "@/components/ui";
import { imgUrl, feedApi, getRawAccessToken, getRefreshToken, tryRefresh, type ApiComment, type ApiMeta } from "@/lib/api";
import {
  MdFavorite, MdFavoriteBorder, MdChatBubbleOutline, MdShare,
  MdAdd, MdDynamicFeed, MdMoreVert, MdDelete, MdFlag, MdSend,
  MdImage, MdClose, MdReply, MdExpandMore, MdExpandLess,
} from "react-icons/md";

const BASE_URL = "https://api.thevinylheadquarters.com/v1";

// ─── API helper — uses main token + refresh logic ─────────────────────────────
async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const makeRequest = async (): Promise<Response> => {
    const token = getRawAccessToken();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };
    return fetch(`${BASE_URL}${path}`, { ...options, headers });
  };

  let res = await makeRequest();

  // 401 → try refresh once then retry
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await makeRequest();
    }
  }

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Comment like state persisted in localStorage ─────────────────────────────
const LIKED_COMMENTS_KEY = "vhq_liked_comments";

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
}
function saveSet(key: string, s: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(Array.from(s)));
}

// ─── Types ────────────────────────────────────────────────────────────────────
type CommentWithReplies = ApiComment & {
  replies?: ApiComment[];
  replyMeta?: ApiMeta;
  replyLoading?: boolean;
  showReplies?: boolean;
};

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px",
      }}
      onClick={() => { if (!loading) onClose(); }}
    >
      <div
        style={{
          background: "var(--card)", border: "1px solid var(--bdr)",
          borderRadius: 16, padding: "24px 24px 20px", maxWidth: 340, width: "100%",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,0,110,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <MdDelete size={22} color="#FF006E" />
        </div>
        <div className="font-bebas text-xl text-white text-center" style={{ marginBottom: 8 }}>
          Delete Post?
        </div>
        <p className="text-sm text-center" style={{ color: "var(--tx2)", marginBottom: 20, lineHeight: 1.5 }}>
          This action cannot be undone. The post will be permanently removed.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: "var(--surf)", border: "1px solid var(--bdr)",
              color: "var(--tx2)", fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: "#FF006E", border: "none",
              color: "#fff", fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600, opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function FeedPage() {
  const {
    user, isLoggedIn, posts, feedMeta, feedLoading,
    loadFeed, likePost, unlikePost, isPostLiked,
  } = useStore();

  // ── Comment like state ──────────────────────────────────────────────────────
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const likedCommentsRef = useRef<Set<string>>(new Set());
  const [likingPostIds, setLikingPostIds] = useState<Set<string>>(new Set());
  const [likingCommentIds, setLikingCommentIds] = useState<Set<string>>(new Set());

  // ── UI state ────────────────────────────────────────────────────────────────
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [replyInput, setReplyInput] = useState("");

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ── Delete state — keep deleteTarget until modal fully done ────────────────
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const commentEndRef = useRef<HTMLDivElement>(null);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const likedCmts = loadSet(LIKED_COMMENTS_KEY);
    setLikedComments(likedCmts);
    likedCommentsRef.current = likedCmts;
  }, []);

  useEffect(() => {
    if (mounted && isLoggedIn) loadFeed();
  }, [mounted, isLoggedIn]); // eslint-disable-line

  useEffect(() => {
    likedCommentsRef.current = likedComments;
  }, [likedComments]);

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setOpenMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ── Post Like ───────────────────────────────────────────────────────────────
  const handleLikePost = useCallback(async (postId: string) => {
    if (likingPostIds.has(postId)) return;
    setLikingPostIds(prev => new Set(prev).add(postId));
    try {
      if (isPostLiked(postId)) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } finally {
      setLikingPostIds(prev => { const s = new Set(prev); s.delete(postId); return s; });
    }
  }, [likingPostIds, isPostLiked, likePost, unlikePost]);

  // ── Comment Like ────────────────────────────────────────────────────────────
  const handleLikeComment = useCallback(async (commentId: string) => {
    if (likingCommentIds.has(commentId)) return;
    const isLiked = likedCommentsRef.current.has(commentId);
    const newSet = new Set(likedCommentsRef.current);
    if (isLiked) newSet.delete(commentId); else newSet.add(commentId);
    setLikedComments(newSet);
    likedCommentsRef.current = newSet;
    saveSet(LIKED_COMMENTS_KEY, newSet);

    setComments(prev => prev.map(c => {
      if (c.id === commentId) return { ...c, likeCount: c.likeCount + (isLiked ? -1 : 1) };
      return {
        ...c,
        replies: c.replies?.map(r =>
          r.id === commentId ? { ...r, likeCount: r.likeCount + (isLiked ? -1 : 1) } : r
        ),
      };
    }));

    setLikingCommentIds(prev => new Set(prev).add(commentId));
    try {
      await apiFetch(`/comments/${commentId}/like`, { method: isLiked ? "DELETE" : "POST" });
    } catch {
      // Rollback
      const rb = new Set(likedCommentsRef.current);
      if (isLiked) rb.add(commentId); else rb.delete(commentId);
      setLikedComments(rb);
      likedCommentsRef.current = rb;
      saveSet(LIKED_COMMENTS_KEY, rb);
      setComments(prev => prev.map(c => {
        if (c.id === commentId) return { ...c, likeCount: c.likeCount + (isLiked ? 1 : -1) };
        return {
          ...c,
          replies: c.replies?.map(r =>
            r.id === commentId ? { ...r, likeCount: r.likeCount + (isLiked ? 1 : -1) } : r
          ),
        };
      }));
    } finally {
      setLikingCommentIds(prev => { const s = new Set(prev); s.delete(commentId); return s; });
    }
  }, [likingCommentIds]);

  // ── Image select ────────────────────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const allowed = files.slice(0, 4 - selectedImages.length);
    setSelectedImages(prev => [...prev, ...allowed]);
    allowed.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Create Post — uses store's createPost for proper persistence ────────────
  // Images are uploaded separately after post creation
  const handlePost = async () => {
    if ((!newContent.trim() && selectedImages.length === 0) || submitting) return;
    setSubmitting(true);
    try {
      if (selectedImages.length > 0) {
        // Create post with images via multipart
        const formData = new FormData();
        formData.append("content", newContent.trim() || ".");
        formData.append("visibility", "PUBLIC");
        selectedImages.forEach(f => formData.append("images", f));
        const res = await apiFetch<{ data: any }>("/posts", { method: "POST", body: formData });
        if (res?.data) {
          // Prepend to store so it persists across re-renders and survives feed reload
          useStore.setState(s => ({ posts: [res.data, ...s.posts] }));
        }
      } else {
        // Text-only post via store action (handles persistence correctly)
        await useStore.getState().createPost(newContent.trim());
      }
      setNewContent("");
      setSelectedImages([]);
      setImagePreviews([]);
      setNewPostOpen(false);
    } catch (e: any) {
      console.error("Post failed:", e);
      useStore.getState().showToast(e?.message || "Post failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseNewPost = () => {
    if (submitting) return;
    setNewPostOpen(false);
    setNewContent("");
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // ── Delete Post — fixed race condition ──────────────────────────────────────
  // deleteTarget stores the ID, deleteModalOpen controls visibility separately
  // so modal doesn't flicker when target is cleared
  const handleDeleteClick = (postId: string) => {
    setOpenMenu(null);
    setDeleteTarget(postId);
    setDeleteModalOpen(true);
  };

  const handleDeleteClose = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    // Small delay before clearing target so modal close animation completes
    setTimeout(() => setDeleteTarget(null), 200);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      // Call API directly — more reliable than going through store action
      // which had a race condition with the deleteTarget state
      await apiFetch(`/posts/${deleteTarget}`, { method: "DELETE" });
      // Remove from store manually
      useStore.setState(s => ({ posts: s.posts.filter(p => p.id !== deleteTarget) }));
      useStore.getState().showToast("Post deleted");
      setDeleteModalOpen(false);
      setTimeout(() => setDeleteTarget(null), 200);
    } catch (e: any) {
      useStore.getState().showToast(e?.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Report Post ─────────────────────────────────────────────────────────────
  const handleReportPost = async (postId: string) => {
    setOpenMenu(null);
    try {
      await apiFetch(`/posts/${postId}/report`, {
        method: "POST", body: JSON.stringify({ reason: "Inappropriate" }),
      });
      useStore.getState().showToast("Post reported");
    } catch (e) { console.error(e); }
  };

  // ── Load Comments ───────────────────────────────────────────────────────────
  const openComments = async (postId: string) => {
    setCommentsPostId(postId);
    setComments([]);
    setCommentInput("");
    setReplyingTo(null);
    setReplyInput("");
    setCommentLoading(true);
    try {
      const res = await apiFetch<{ data: ApiComment[] }>(`/posts/${postId}/comments?limit=20`);
      if (res?.data) {
        setComments(res.data.map(c => ({ ...c, replies: [], showReplies: false })));
      }
    } catch (e) {
      console.error("Failed to load comments:", e);
    } finally {
      setCommentLoading(false);
    }
  };

  // ── Add Comment — updates post commentCount in store immediately ────────────
  const submitComment = async () => {
    const text = commentInput.trim();
    if (!text || !commentsPostId) return;
    setCommentInput("");
    try {
      const res = await apiFetch<{ data: ApiComment }>(`/posts/${commentsPostId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: text, parentId: null }),
      });
      if (res?.data) {
        setComments(prev => [...prev, { ...res.data, replies: [], showReplies: false }]);
        // Update commentCount in store — persists until next feed load
        useStore.setState(s => ({
          posts: s.posts.map(p =>
            p.id === commentsPostId ? { ...p, commentCount: p.commentCount + 1 } : p
          ),
        }));
        setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (e) {
      console.error("Comment failed:", e);
      setCommentInput(text); // Restore on failure
    }
  };

  // ── Reply to Comment ────────────────────────────────────────────────────────
  const submitReply = async () => {
    const text = replyInput.trim();
    if (!text || !replyingTo || !commentsPostId) return;
    setReplyInput("");
    try {
      const res = await apiFetch<{ data: ApiComment }>(`/posts/${commentsPostId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: text, parentId: replyingTo.id }),
      });
      if (res?.data) {
        setComments(prev => prev.map(c =>
          c.id === replyingTo.id
            ? {
                ...c,
                replies: [...(c.replies || []), res.data],
                showReplies: true,
                _count: { replies: (c._count?.replies || 0) + 1 },
              }
            : c
        ));
        setReplyingTo(null);
      }
    } catch (e) {
      console.error("Reply failed:", e);
      setReplyInput(text);
    }
  };

  // ── Toggle Replies ──────────────────────────────────────────────────────────
  const toggleReplies = async (comment: CommentWithReplies) => {
    if (comment.showReplies) {
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, showReplies: false } : c));
      return;
    }
    if (comment.replies && comment.replies.length > 0) {
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, showReplies: true } : c));
      return;
    }
    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, replyLoading: true } : c));
    try {
      const res = await apiFetch<{ data: ApiComment[]; meta: ApiMeta }>(
        `/comments/${comment.id}/replies?limit=20`
      );
      setComments(prev => prev.map(c =>
        c.id === comment.id
          ? { ...c, replies: res.data || [], replyMeta: res.meta, showReplies: true, replyLoading: false }
          : c
      ));
    } catch (e) {
      console.error("Failed to load replies:", e);
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, replyLoading: false } : c));
    }
  };

  // ── Delete Comment ──────────────────────────────────────────────────────────
  const deleteComment = async (commentId: string, isReply: boolean, parentId?: string) => {
    // Optimistic remove
    if (isReply && parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }
          : c
      ));
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (commentsPostId) {
        useStore.setState(s => ({
          posts: s.posts.map(p =>
            p.id === commentsPostId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
          ),
        }));
      }
    }
    try {
      await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
    } catch (e) {
      console.error("Delete comment failed:", e);
      // Reload to restore state
      if (commentsPostId) openComments(commentsPostId);
    }
  };

  // ── Load More ───────────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (!feedMeta?.hasNext || loadingMore) return;
    setLoadingMore(true);
    await loadFeed(feedMeta.cursor || undefined);
    setLoadingMore(false);
  };

  // ── Format time ─────────────────────────────────────────────────────────────
  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <MdDynamicFeed size={64} style={{ color: "var(--tx3)", margin: "0 auto 16px" }} />
          <div className="font-bebas text-4xl text-white mb-4">Community Feed</div>
          <p className="mb-6" style={{ color: "var(--tx2)" }}>Log in to see posts from the vinyl community.</p>
          <a href="/auth"><button className="btn btn-pk btn-lg">Log In / Sign Up</button></a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto w-full space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="lbl mb-1">Community</div>
            <div className="font-bebas text-4xl text-white">Feed</div>
          </div>
          <button className="btn btn-pk btn-md flex items-center gap-2" onClick={() => setNewPostOpen(true)}>
            <MdAdd size={18} /> New Post
          </button>
        </div>

        {/* Loading skeletons */}
        {feedLoading && posts.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full" style={{ background: "var(--surf)" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded" style={{ background: "var(--surf)", width: "40%" }} />
                    <div className="h-3 rounded" style={{ background: "var(--surf)", width: "25%" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 rounded" style={{ background: "var(--surf)" }} />
                  <div className="h-3 rounded" style={{ background: "var(--surf)", width: "75%" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {posts.map(post => {
          const isLiked = isPostLiked(post.id);
          const isOwn = post.user.id === user?.id;
          const cover = imgUrl(post.user.avatarUrl);

          return (
            <div key={post.id} className="card p-5 fade-up">
              {/* Post header */}
              <div className="flex items-start gap-3 mb-4">
                {cover
                  ? <img src={cover} className="w-11 h-11 rounded-full object-cover flex-shrink-0" alt="" />
                  : <Avatar color="#FF006E" name={post.user.username} size={44} />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">@{post.user.username}</span>
                    {post.user.tier === "PREMIUM" && (
                      <span className="badge badge-pk" style={{ fontSize: "0.5rem" }}>PRO</span>
                    )}
                    <span className="text-xs" style={{ color: "var(--tx3)" }}>{formatTime(post.createdAt)}</span>
                  </div>
                </div>

                {/* Three-dot menu */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "4px 6px" }}
                    aria-label="Post options"
                  >
                    <MdMoreVert size={16} style={{ color: "var(--tx3)" }} />
                  </button>
                  {openMenu === post.id && (
                    <div
                      className="absolute right-0 top-8 z-20 rounded-xl overflow-hidden shadow-xl"
                      style={{ background: "var(--card)", border: "1px solid var(--bdr)", minWidth: 150 }}
                    >
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteClick(post.id)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm"
                          style={{ color: "#FF006E", background: "none", border: "none", cursor: "pointer" }}
                        >
                          <MdDelete size={15} /> Delete Post
                        </button>
                      )}
                      <button
                        onClick={() => handleReportPost(post.id)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm"
                        style={{ color: "var(--tx2)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        <MdFlag size={15} /> Report
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              {post.content && post.content.trim() !== "." && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--tx2)" }}>
                  {post.content}
                </p>
              )}

              {/* Images */}
              {post.images?.length > 0 && (
                <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {post.images.map((img, idx) => {
                    const url = imgUrl(img.url);
                    return url ? (
                      <img
                        key={idx} src={url} alt=""
                        className="w-full rounded-xl object-cover"
                        style={{ maxHeight: 280 }}
                      />
                    ) : null;
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-5 pt-3 border-t" style={{ borderColor: "var(--bdr)" }}>
                <button
                  onClick={() => handleLikePost(post.id)}
                  disabled={likingPostIds.has(post.id)}
                  className="flex items-center gap-1.5 text-sm"
                  style={{
                    color: isLiked ? "#FF006E" : "var(--tx3)",
                    background: "none", border: "none", cursor: "pointer",
                    opacity: likingPostIds.has(post.id) ? 0.5 : 1,
                    transition: "color 0.15s",
                  }}
                >
                  {isLiked ? <MdFavorite size={18} /> : <MdFavoriteBorder size={18} />}
                  {post.likeCount}
                </button>
                <button
                  onClick={() => openComments(post.id)}
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "var(--tx3)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <MdChatBubbleOutline size={17} /> {post.commentCount}
                </button>
                <button
                  className="flex items-center gap-1.5 text-sm ml-auto"
                  style={{ color: "var(--tx3)", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => navigator.share?.({ text: post.content, url: window.location.href })}
                >
                  <MdShare size={17} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Load more */}
        {feedMeta?.hasNext && (
          <button
            className="btn btn-ghost btn-md w-full"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        )}

        {posts.length === 0 && !feedLoading && (
          <div className="text-center py-16" style={{ color: "var(--tx3)" }}>
            <MdDynamicFeed size={48} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <div className="font-bebas text-2xl">Nothing here yet</div>
            <div className="text-sm mt-2">Be the first to share!</div>
          </div>
        )}
      </div>

      {/* ══════════════════ Delete Confirmation Modal ══════════════════ */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

      {/* ══════════════════ New Post Modal ══════════════════ */}
      <Modal open={newPostOpen} onClose={handleCloseNewPost} title="Share with Community">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Avatar color="#FF006E" name={user?.username || "U"} size={36} />
            <div className="flex-1">
              <textarea
                className="inp w-full" rows={4}
                placeholder="What's spinning? Share a haul, setup, or discovery…"
                value={newContent} onChange={e => setNewContent(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>
          </div>

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className={`grid gap-2 ${imagePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden" style={{ maxHeight: 160 }}>
                  <img src={src} alt="" className="w-full object-cover" style={{ maxHeight: 160 }} />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center"
                    style={{
                      width: 22, height: 22, background: "rgba(0,0,0,0.75)",
                      border: "none", cursor: "pointer", color: "#fff",
                    }}
                  >
                    <MdClose size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            {selectedImages.length < 4 && (
              <>
                <input
                  ref={imageInputRef} type="file" accept="image/*" multiple
                  style={{ display: "none" }} onChange={handleImageSelect}
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm"
                  style={{
                    color: "var(--tx3)", background: "none",
                    border: "1px solid var(--bdr)", borderRadius: 8,
                    padding: "6px 12px", cursor: "pointer",
                  }}
                >
                  <MdImage size={16} />
                  Photo{selectedImages.length > 0 ? ` (${selectedImages.length}/4)` : ""}
                </button>
              </>
            )}
            <button
              className="btn btn-pk btn-md flex-1"
              onClick={handlePost}
              disabled={(!newContent.trim() && selectedImages.length === 0) || submitting}
            >
              {submitting ? "Posting…" : "Post to Feed"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════ Comments Modal ══════════════════ */}
      <Modal
        open={!!commentsPostId}
        onClose={() => {
          setCommentsPostId(null);
          setComments([]);
          setReplyingTo(null);
          setReplyInput("");
          setCommentInput("");
        }}
        title="Comments"
      >
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "65vh" }}>

          {/* Comments list */}
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }} className="space-y-3">
            {commentLoading && (
              <div className="text-center py-8" style={{ color: "var(--tx3)" }}>Loading…</div>
            )}
            {!commentLoading && comments.length === 0 && (
              <div className="text-center py-8" style={{ color: "var(--tx3)" }}>
                No comments yet. Be first!
              </div>
            )}

            {comments.map(c => {
              const isMyComment = c.user.id === user?.id;
              const commentLiked = likedComments.has(c.id);
              return (
                <div key={c.id}>
                  <div className="flex gap-2.5">
                    <Avatar color="#7B2FFF" name={c.user.username} size={30} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-xs text-white">@{c.user.username}</span>
                        <span className="text-xs" style={{ color: "var(--tx3)" }}>{formatTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm mb-1.5" style={{ color: "var(--tx2)" }}>{c.content}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLikeComment(c.id)}
                          disabled={likingCommentIds.has(c.id)}
                          className="flex items-center gap-1 text-xs"
                          style={{
                            color: commentLiked ? "#FF006E" : "var(--tx3)",
                            background: "none", border: "none", cursor: "pointer",
                            opacity: likingCommentIds.has(c.id) ? 0.5 : 1,
                            transition: "color 0.15s",
                          }}
                        >
                          {commentLiked ? <MdFavorite size={13} /> : <MdFavoriteBorder size={13} />}
                          {c.likeCount > 0 ? c.likeCount : ""}
                        </button>
                        <button
                          onClick={() => { setReplyingTo({ id: c.id, username: c.user.username }); setReplyInput(""); }}
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--tx3)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          <MdReply size={13} /> Reply
                        </button>
                        {(c._count?.replies || 0) > 0 && (
                          <button
                            onClick={() => toggleReplies(c)}
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "var(--tx3)", background: "none", border: "none", cursor: "pointer" }}
                          >
                            {c.replyLoading
                              ? "Loading…"
                              : c.showReplies
                                ? <><MdExpandLess size={13} /> Hide</>
                                : <><MdExpandMore size={13} /> {c._count?.replies} repl{c._count?.replies === 1 ? "y" : "ies"}</>
                            }
                          </button>
                        )}
                        {isMyComment && (
                          <button
                            onClick={() => deleteComment(c.id, false)}
                            className="flex items-center gap-1 text-xs ml-auto"
                            style={{ color: "#FF006E", background: "none", border: "none", cursor: "pointer" }}
                          >
                            <MdDelete size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {c.showReplies && c.replies && c.replies.length > 0 && (
                    <div className="mt-2 ml-10 space-y-2.5">
                      {c.replies.map(r => {
                        const isMyReply = r.user.id === user?.id;
                        const replyLiked = likedComments.has(r.id);
                        return (
                          <div key={r.id} className="flex gap-2">
                            <Avatar color="#FF006E" name={r.user.username} size={26} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="font-bold text-xs text-white">@{r.user.username}</span>
                                <span className="text-xs" style={{ color: "var(--tx3)" }}>{formatTime(r.createdAt)}</span>
                              </div>
                              <p className="text-sm mb-1" style={{ color: "var(--tx2)" }}>{r.content}</p>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleLikeComment(r.id)}
                                  disabled={likingCommentIds.has(r.id)}
                                  className="flex items-center gap-1 text-xs"
                                  style={{
                                    color: replyLiked ? "#FF006E" : "var(--tx3)",
                                    background: "none", border: "none", cursor: "pointer",
                                    opacity: likingCommentIds.has(r.id) ? 0.5 : 1,
                                    transition: "color 0.15s",
                                  }}
                                >
                                  {replyLiked ? <MdFavorite size={12} /> : <MdFavoriteBorder size={12} />}
                                  {r.likeCount > 0 ? r.likeCount : ""}
                                </button>
                                {isMyReply && (
                                  <button
                                    onClick={() => deleteComment(r.id, true, c.id)}
                                    className="flex items-center gap-1 text-xs ml-auto"
                                    style={{ color: "#FF006E", background: "none", border: "none", cursor: "pointer" }}
                                  >
                                    <MdDelete size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyingTo?.id === c.id && (
                    <div className="mt-2 ml-10 flex gap-2 items-center">
                      <input
                        className="inp flex-1 text-xs"
                        placeholder={`Reply to @${replyingTo.username}…`}
                        value={replyInput}
                        onChange={e => setReplyInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault(); submitReply();
                          }
                        }}
                        autoFocus
                        style={{ padding: "6px 10px" }}
                      />
                      <button
                        className="btn btn-pk btn-sm"
                        onClick={submitReply}
                        disabled={!replyInput.trim()}
                      >
                        <MdSend size={13} />
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyInput(""); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tx3)" }}
                      >
                        <MdClose size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={commentEndRef} />
          </div>

          {/* Comment input */}
          <div
            className="flex gap-2 pt-3 mt-3 border-t flex-shrink-0"
            style={{ borderColor: "var(--bdr)" }}
          >
            <input
              className="inp flex-1 text-sm"
              placeholder="Add a comment…"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); submitComment();
                }
              }}
            />
            <button
              className="btn btn-pk btn-sm"
              onClick={submitComment}
              disabled={!commentInput.trim()}
            >
              <MdSend size={15} />
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}