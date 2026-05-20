"use client";
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { Avatar, Modal } from "@/components/ui";
import { imgUrl, feedApi, type ApiComment } from "@/lib/api";
import {
  MdFavorite, MdFavoriteBorder, MdChatBubbleOutline, MdShare,
  MdAdd, MdDynamicFeed, MdMoreVert, MdDelete, MdFlag, MdSend
} from "react-icons/md";

export default function FeedPage() {
  const { user, isLoggedIn, posts, feedMeta, feedLoading, loadFeed, createPost, deletePost, likePost, unlikePost, likedPostIds } = useStore();
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadFeed();
    }
  }, [mounted, loadFeed]);

  const handlePost = async () => {
    if (!newContent.trim() || submitting) return;
    setSubmitting(true);
    await createPost(newContent.trim());
    setNewContent("");
    setNewPostOpen(false);
    setSubmitting(false);
  };

  const loadComments = async (postId: string) => {
    setCommentLoading(true);
    setCommentsOpen(postId);
    setComments([]);
    try {
      const res = await feedApi.getComments(postId);
      if (res?.data) setComments(res.data);
    } finally {
      setCommentLoading(false);
    }
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !commentsOpen) return;
    try {
      const res = await feedApi.addComment(commentsOpen, commentInput.trim());
      if (res?.data) {
        setComments(prev => [...prev, res.data]);
        setCommentInput("");
      }
    } catch {}
  };

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
          <MdDynamicFeed size={64} style={{ color:"var(--tx3)", margin:"0 auto 16px" }}/>
          <div className="font-bebas text-4xl text-white mb-4">Community Feed</div>
          <p className="mb-6" style={{ color:"var(--tx2)" }}>Log in to see posts from the vinyl community.</p>
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
            <MdAdd size={18}/> New Post
          </button>
        </div>

        {/* Loading */}
        {feedLoading && posts.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_,i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full" style={{ background:"var(--surf)" }}/>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded" style={{ background:"var(--surf)", width:"40%" }}/>
                    <div className="h-3 rounded" style={{ background:"var(--surf)", width:"25%" }}/>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 rounded" style={{ background:"var(--surf)" }}/>
                  <div className="h-3 rounded" style={{ background:"var(--surf)", width:"75%" }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {posts.map(post => {
          const isLiked = likedPostIds instanceof Set ? likedPostIds.has(post.id) : false;
          const isOwn = post.user.id === user?.id;
          const cover = imgUrl(post.user.avatarUrl);
          return (
            <div key={post.id} className="card p-5 fade-up">
              <div className="flex items-start gap-3 mb-4">
                {cover ? (
                  <img src={cover} className="w-11 h-11 rounded-full object-cover flex-shrink-0" alt=""/>
                ) : (
                  <Avatar color="#FF006E" name={post.user.username} size={44}/>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">@{post.user.username}</span>
                    {post.user.tier === "PREMIUM" && (
                      <span className="badge badge-pk" style={{ fontSize:"0.5rem" }}>PRO</span>
                    )}
                    <span className="text-xs" style={{ color:"var(--tx3)" }}>{formatTime(post.createdAt)}</span>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)}
                    className="btn btn-ghost btn-sm" style={{ padding:"4px 6px" }}>
                    <MdMoreVert size={16} style={{ color:"var(--tx3)" }}/>
                  </button>
                  {openMenu === post.id && (
                    <div className="absolute right-0 top-8 z-20 rounded-xl overflow-hidden shadow-xl" style={{ background:"var(--card)", border:"1px solid var(--bdr)", minWidth:140 }}>
                      {isOwn && (
                        <button onClick={() => { deletePost(post.id); setOpenMenu(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors"
                          style={{ color:"var(--pk)", background:"none", border:"none", cursor:"pointer" }}>
                          <MdDelete size={15}/> Delete
                        </button>
                      )}
                      <button onClick={() => { feedApi.reportPost(post.id, "Inappropriate"); setOpenMenu(null); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors"
                        style={{ color:"var(--tx2)", background:"none", border:"none", cursor:"pointer" }}>
                        <MdFlag size={15}/> Report
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color:"var(--tx2)" }}>{post.content}</p>

              {/* Images */}
              {post.images?.length > 0 && (
                <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {post.images.map((img, idx) => {
                    const url = imgUrl(img.url);
                    return url ? (
                      <img key={idx} src={url} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight:280 }}/>
                    ) : null;
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-5 pt-3 border-t" style={{ borderColor:"var(--bdr)" }}>
                <button onClick={() => isLiked ? unlikePost(post.id) : likePost(post.id)}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color:isLiked?"#FF006E":"var(--tx3)", background:"none", border:"none", cursor:"pointer" }}>
                  {isLiked ? <MdFavorite size={18}/> : <MdFavoriteBorder size={18}/>}
                  {post.likeCount}
                </button>
                <button onClick={() => loadComments(post.id)}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color:"var(--tx3)", background:"none", border:"none", cursor:"pointer" }}>
                  <MdChatBubbleOutline size={17}/> {post.commentCount}
                </button>
                <button className="flex items-center gap-1.5 text-sm ml-auto"
                  style={{ color:"var(--tx3)", background:"none", border:"none", cursor:"pointer" }}>
                  <MdShare size={17}/>
                </button>
              </div>
            </div>
          );
        })}

        {/* Load more */}
        {feedMeta?.hasNext && (
          <button className="btn btn-ghost btn-md w-full" onClick={() => loadFeed(feedMeta.cursor || undefined)}>
            Load More
          </button>
        )}

        {posts.length === 0 && !feedLoading && (
          <div className="text-center py-16" style={{ color:"var(--tx3)" }}>
            <MdDynamicFeed size={48} style={{ margin:"0 auto 12px", opacity:0.4 }}/>
            <div className="font-bebas text-2xl">Nothing here yet</div>
            <div className="text-sm mt-2">Be the first to share!</div>
          </div>
        )}
      </div>

      {/* New Post Modal */}
      <Modal open={newPostOpen} onClose={() => setNewPostOpen(false)} title="Share with Community">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Avatar color="#FF006E" name={user?.username || "U"} size={36}/>
            <div className="flex-1">
              <textarea className="inp w-full" rows={4} placeholder="What's spinning? Share a haul, setup, or discovery…"
                value={newContent} onChange={e => setNewContent(e.target.value)}
                style={{ resize:"none" }}/>
            </div>
          </div>
          <button className="btn btn-pk btn-md w-full" onClick={handlePost} disabled={!newContent.trim() || submitting}>
            {submitting ? "Posting…" : "Post to Feed"}
          </button>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal open={!!commentsOpen} onClose={() => { setCommentsOpen(null); setComments([]); }} title="Comments">
        <div className="flex flex-col gap-4" style={{ maxHeight:"60vh" }}>
          <div className="flex-1 overflow-y-auto space-y-3">
            {commentLoading && (
              <div className="text-center py-8" style={{ color:"var(--tx3)" }}>Loading…</div>
            )}
            {!commentLoading && comments.length === 0 && (
              <div className="text-center py-8" style={{ color:"var(--tx3)" }}>No comments yet. Be first!</div>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <Avatar color="#7B2FFF" name={c.user.username} size={32}/>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-xs text-white">@{c.user.username}</span>
                    <span className="text-xs" style={{ color:"var(--tx3)" }}>{c.likeCount > 0 ? `❤ ${c.likeCount}` : ""}</span>
                  </div>
                  <p className="text-sm" style={{ color:"var(--tx2)" }}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-3 border-t" style={{ borderColor:"var(--bdr)" }}>
            <input className="inp flex-1 text-sm" placeholder="Add a comment…"
              value={commentInput} onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitComment()}/>
            <button className="btn btn-pk btn-sm" onClick={submitComment} disabled={!commentInput.trim()}>
              <MdSend size={15}/>
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
