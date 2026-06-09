'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, FileText, Ban, CheckCircle, Trash2, BarChart3, AlertTriangle } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Navbar } from '@/components/ui/Navbar';
import toast from 'react-hot-toast';

type Tab = 'stats' | 'users' | 'posts';

export default function AdminPage() {
  const router = useRouter();
  const { isAdminMode, user } = useAuthStore();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('stats');
  const [userSearch, setUserSearch] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banningUserId, setBanningUserId] = useState<string | null>(null);

  // Redirect if not admin
  if (!isAdminMode && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="text-center card p-10 max-w-md mx-4">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">גישה נדחתה</h2>
          <p className="text-gray-500 mb-6">אין לך הרשאות מנהל. השתמש בקוד הסודי כדי להיכנס.</p>
          <button onClick={() => router.push('/feed')} className="btn-primary">חזרה לפיד</button>
        </div>
      </div>
    );
  }

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats().then(r => r.data),
    enabled: tab === 'stats',
  });

  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => adminAPI.getUsers(1, userSearch || undefined).then(r => r.data),
    enabled: tab === 'users',
  });

  const { data: postsData } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => adminAPI.getPosts().then(r => r.data),
    enabled: tab === 'posts',
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminAPI.banUser(id, reason),
    onSuccess: () => { toast.success('המשתמש נחסם'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setBanningUserId(null); },
    onError: () => toast.error(t.error),
  });

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminAPI.unbanUser(id),
    onSuccess: () => { toast.success('החסימה בוטלה'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error(t.error),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => adminAPI.deletePost(id),
    onSuccess: () => { toast.success('הפוסט נמחק'); qc.invalidateQueries({ queryKey: ['admin-posts'] }); },
    onError: () => toast.error(t.error),
  });

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'stats', label: 'סטטיסטיקות', icon: BarChart3 },
    { id: 'users', label: t.users, icon: Users },
    { id: 'posts', label: t.posts, icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-3 pt-20 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{t.adminPanel}</h1>
            <p className="text-sm text-red-500 font-semibold">{t.adminMode} — {t.adminActivated}</p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-700">
            <strong>שים לב:</strong> פעולות האדמין בלתי הפיכות. פעל באחריות. המצב יאופס עם רענון הדף.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                tab === id ? 'bg-primary-700 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t.totalUsers, value: stats.totalUsers, color: 'blue', icon: Users },
                { label: 'מאומתים', value: stats.verifiedUsers, color: 'green', icon: CheckCircle },
                { label: t.newThisWeek, value: stats.recentUsers, color: 'purple', icon: BarChart3 },
                { label: 'חסומים', value: stats.bannedUsers, color: 'red', icon: Ban },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="card p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${color}-100`}>
                    <Icon className={`text-${color}-600`} size={20} />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Users by grade chart */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-4">תלמידים לפי כיתה</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {stats.usersByGrade?.map(({ _id, count }: any) => (
                  <div key={_id} className="flex items-center gap-3">
                    <span className="grade-badge w-12 text-center">{_id}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (count / (stats.verifiedUsers || 1)) * 100 * 4)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-8 text-left">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <div className="card p-4 mb-4">
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="חיפוש לפי שם או מייל..."
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              {usersData?.users?.map((u: any) => (
                <div key={u._id} className={`card p-4 ${u.isBanned ? 'border-l-4 border-red-400' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {u.firstName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">
                          {u.firstName} {u.lastName}
                          {u.isBanned && <span className="admin-badge mr-2">חסום</span>}
                          {u.role === 'admin' && <span className="grade-badge bg-purple-100 text-purple-700 mr-2">אדמין</span>}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{u.email}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="grade-badge text-[10px]">{u.grade}</span>
                          <span className="text-[10px] text-gray-400">
                            {u.isVerified ? '✅ מאומת' : '⏳ לא מאומת'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {u.isBanned ? (
                        <button
                          onClick={() => unbanMutation.mutate(u._id)}
                          disabled={unbanMutation.isPending}
                          className="flex items-center gap-1.5 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <CheckCircle size={13} />
                          {t.unbanUser}
                        </button>
                      ) : (
                        banningUserId === u._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={banReason}
                              onChange={e => setBanReason(e.target.value)}
                              placeholder="סיבה..."
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-red-300"
                            />
                            <button
                              onClick={() => { banMutation.mutate({ id: u._id, reason: banReason }); setBanReason(''); }}
                              className="bg-red-500 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-red-600"
                            >אשר</button>
                            <button onClick={() => setBanningUserId(null)} className="text-gray-400 text-xs px-2 py-1.5">ביטול</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setBanningUserId(u._id)}
                            className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <Ban size={13} />
                            {t.banUser}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {u.isBanned && u.banReason && (
                    <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-1.5 rounded-lg">סיבת חסימה: {u.banReason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {tab === 'posts' && (
          <div className="space-y-3">
            {postsData?.posts?.map((post: any) => (
              <div key={post._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {post.author?.firstName?.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900">
                          {post.author?.firstName} {post.author?.lastName}
                        </span>
                        <span className="grade-badge mr-2 text-[10px]">{post.author?.grade}</span>
                      </div>
                    </div>
                    {post.content && (
                      <p className="text-sm text-gray-700 truncate">{post.content}</p>
                    )}
                    {post.mediaType && (
                      <span className="text-xs text-gray-400 mt-1">📎 {post.mediaType === 'image' ? 'תמונה' : 'וידאו'}</span>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>❤️ {post.likes?.length || 0}</span>
                      <span>💬 {post.comments?.length || 0}</span>
                      <span>🔄 {post.shares?.length || 0}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm('מחק פוסט זה?')) deletePostMutation.mutate(post._id); }}
                    disabled={deletePostMutation.isPending}
                    className="flex items-center gap-1.5 bg-red-50 text-red-500 hover:bg-red-100 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
