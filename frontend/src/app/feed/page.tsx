'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { Loader2, Filter } from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Navbar } from '@/components/ui/Navbar';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostCard } from '@/components/feed/PostCard';

const GRADE_GROUPS = [
  { label: 'כל הכיתות', value: '' },
  { label: 'כיתות ט', value: 'ט' },
  { label: 'כיתות י', value: 'י' },
  { label: 'כיתות י"א', value: 'יא' },
  { label: 'כיתות י"ב', value: 'יב' },
];

export default function FeedPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('');
  const { ref, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth/login');
    }
  }, [user, token]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    loadPosts(1, gradeFilter, true);
  }, [gradeFilter]);

  useEffect(() => {
    if (inView && hasMore && !loading && page > 1) {
      loadPosts(page, gradeFilter);
    }
  }, [inView]);

  const loadPosts = async (p: number, grade: string, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await postsAPI.getFeed(p, grade || undefined);
      const newPosts = res.data.posts;
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(res.data.pagination.hasMore);
      if (res.data.pagination.hasMore) setPage(p + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (post: any) => {
    setPosts(prev => [post, ...prev]);
  };

  const handlePostDeleted = (id: string) => {
    setPosts(prev => prev.filter(p => p._id !== id));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-3 pt-20 pb-24">
        {/* School banner with real feel */}
        <div className="card mb-4 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary-900 via-primary-700 to-primary-500 relative flex items-center px-6">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
            }} />
            <div className="relative z-10 text-white">
              <h2 className="text-lg font-black">{t.appName} 🏫</h2>
              <p className="text-xs text-primary-200">{t.appTagline}</p>
            </div>
            <div className="absolute bottom-2 left-4 text-xs text-primary-300/70 z-10">{t.disclaimer}</div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-t border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">{user.firstName} {user.lastName}</div>
              <div className="flex items-center gap-1.5">
                <span className="grade-badge">{user.grade}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Create post */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Grade filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          <Filter size={14} className="text-gray-400 shrink-0" />
          {GRADE_GROUPS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setGradeFilter(value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                gradeFilter === value
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-primary-50 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-semibold text-gray-500">{t.noPostsYet}</p>
            <p className="text-sm mt-2">היה הראשון לפרסם!</p>
          </div>
        )}

        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onDelete={handlePostDeleted}
          />
        ))}

        {/* Infinite scroll trigger */}
        <div ref={ref} className="h-8 flex items-center justify-center">
          {loading && (
            <Loader2 className="text-primary-500 animate-spin" size={24} />
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-xs text-gray-400">סיום הפיד 🎉</p>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex safe-bottom z-40">
        <a href="/feed" className="flex-1 flex flex-col items-center py-2 text-primary-700">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-xs mt-0.5">{t.feed}</span>
        </a>
        <a href="/messages" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span className="text-xs mt-0.5">{t.messages}</span>
        </a>
        <a href={`/profile/${user._id}`} className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-xs mt-0.5">{t.profile}</span>
        </a>
      </div>
    </div>
  );
}
