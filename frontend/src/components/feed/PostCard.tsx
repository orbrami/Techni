'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { ru } from 'date-fns/locale';
import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  Trash2, Flag, Send
} from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

interface Post {
  _id: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    grade: string;
  };
  content: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaThumbnail?: string;
  likes: string[];
  comments: Comment[];
  shares: string[];
  sharedFrom?: any;
  createdAt: string;
}

interface Comment {
  _id: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  content: string;
  likes: string[];
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  isAdminView?: boolean;
}

export function PostCard({ post, onDelete, isAdminView }: PostCardProps) {
  const { user, isAdminMode } = useAuthStore();
  const { t, language } = useTranslation();
  const locale = language === 'he' ? he : ru;

  const [liked, setLiked] = useState(post.likes.includes(user?._id || ''));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [comments, setComments] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareBox, setShowShareBox] = useState(false);
  const [shareText, setShareText] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);

  if (isDeleted) return null;

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    try {
      await postsAPI.likePost(post._id);
    } catch {
      setLiked(liked);
      setLikesCount(post.likes.length);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || loadingComment) return;
    setLoadingComment(true);
    try {
      const res = await postsAPI.commentPost(post._id, commentText.trim());
      setComments(prev => [...prev, res.data.comment]);
      setCommentText('');
    } catch {
      toast.error(t.error);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.confirmDeletePost)) return;
    try {
      await postsAPI.deletePost(post._id);
      setIsDeleted(true);
      onDelete?.(post._id);
      toast.success(t.postDeleted);
    } catch {
      toast.error(t.error);
    }
  };

  const handleShare = async () => {
    try {
      await postsAPI.sharePost(post._id, shareText);
      setShowShareBox(false);
      setShareText('');
      toast.success('הפוסט שותף!');
    } catch {
      toast.error(t.error);
    }
  };

  const canDelete = user?._id === post.author._id || isAdminMode;

  return (
    <article className="post-card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Link href={`/profile/${post.author._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {post.author.profilePicture ? (
            <Image
              src={post.author.profilePicture}
              alt={`${post.author.firstName} ${post.author.lastName}`}
              width={42}
              height={42}
              className="avatar w-10 h-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">
              {post.author.firstName} {post.author.lastName}
              {isAdminMode && <span className="admin-badge mr-2">ADMIN VIEW</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="grade-badge">{post.author.grade}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale })}</span>
            </div>
          </div>
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
          {showMenu && (
            <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 min-w-[140px] animate-slide-up">
              {canDelete && (
                <button
                  onClick={() => { handleDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  {t.deletePost}
                </button>
              )}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
              >
                <Flag size={14} />
                {t.report}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shared post indicator */}
      {post.sharedFrom && (
        <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
          <Share2 size={12} />
          <span>{t.sharedPost}</span>
        </div>
      )}

      {/* Content */}
      {post.content && (
        <p className="text-gray-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && (
        <div className="mb-3 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={post.mediaUrl}
            alt="Post image"
            width={600}
            height={400}
            className="w-full h-auto max-h-96 object-cover"
            unoptimized
          />
        </div>
      )}
      {post.mediaUrl && post.mediaType === 'video' && (
        <div className="mb-3 rounded-xl overflow-hidden bg-black">
          <video
            src={post.mediaUrl}
            controls
            className="w-full max-h-96"
            poster={post.mediaThumbnail}
            preload="metadata"
          />
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`like-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
            liked ? 'text-red-500 bg-red-50 liked' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle size={17} />
          {comments.length > 0 && <span>{comments.length}</span>}
        </button>

        <button
          onClick={() => setShowShareBox(!showShareBox)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Share2 size={17} />
          {post.shares.length > 0 && <span>{post.shares.length}</span>}
        </button>
      </div>

      {/* Share box */}
      {showShareBox && (
        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 animate-slide-up">
          <textarea
            value={shareText}
            onChange={e => setShareText(e.target.value)}
            placeholder={t.addShareComment}
            className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
            rows={2}
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => setShowShareBox(false)} className="btn-ghost text-sm py-1.5">{t.cancel}</button>
            <button onClick={handleShare} className="btn-primary text-sm py-1.5 px-4">{t.share}</button>
          </div>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-3 animate-slide-up">
          {comments.map(comment => (
            <div key={comment._id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {comment.author.firstName.charAt(0)}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <Link href={`/profile/${comment.author._id}`} className="text-xs font-bold text-gray-800 hover:underline">
                  {comment.author.firstName} {comment.author.lastName}
                </Link>
                <p className="text-xs text-gray-700 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}

          {/* Comment input */}
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.firstName.charAt(0)}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
                placeholder={t.writeComment}
                className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || loadingComment}
                className="p-2 bg-primary-600 text-white rounded-xl disabled:opacity-50 hover:bg-primary-700 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
