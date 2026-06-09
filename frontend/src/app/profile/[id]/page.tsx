'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Edit3, MessageCircle, UserCheck, UserPlus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { usersAPI, postsAPI, uploadAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Navbar } from '@/components/ui/Navbar';
import { PostCard } from '@/components/feed/PostCard';
import toast from 'react-hot-toast';

const GRADES = [
  'ט1','ט2','ט3','ט4','ט5','ט6','ט7','ט8',
  'י1','י2','י3','י4','י5','י6','י7','י8',
  'יא1','יא2','יא3','יא4','יא5','יא6','יא7','יא8',
  'יב1','יב2','יב3','יב4','יב5','יב6','יב7','יב8',
];

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser, setUser } = useAuthStore();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState('');
  const [showGradeChange, setShowGradeChange] = useState(false);
  const [newGrade, setNewGrade] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isOwnProfile = currentUser?._id === id;

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => usersAPI.getUser(id).then(r => r.data.user),
  });

  const { data: postsData } = useQuery({
    queryKey: ['user-posts', id],
    queryFn: () => postsAPI.getUserPosts(id).then(r => r.data),
  });

  useEffect(() => {
    if (data) setBio(data.bio || '');
  }, [data]);

  const followMutation = useMutation({
    mutationFn: () => usersAPI.follow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', id] }),
  });

  const saveBio = async () => {
    try {
      const res = await usersAPI.updateProfile({ bio });
      if (isOwnProfile) setUser(res.data.user);
      setEditMode(false);
      toast.success('הפרופיל עודכן!');
      qc.invalidateQueries({ queryKey: ['profile', id] });
    } catch {
      toast.error(t.error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const res = await uploadAPI.uploadAvatar(file);
      const profileRes = await usersAPI.updateProfile({ profilePicture: res.data.url });
      if (isOwnProfile) setUser(profileRes.data.user);
      qc.invalidateQueries({ queryKey: ['profile', id] });
      toast.success('תמונת הפרופיל עודכנה!');
    } catch {
      toast.error(t.error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleGradeChange = async () => {
    if (!newGrade) return;
    try {
      const res = await usersAPI.changeGrade(newGrade);
      if (isOwnProfile) setUser(res.data.user);
      setShowGradeChange(false);
      qc.invalidateQueries({ queryKey: ['profile', id] });
      toast.success(`כיתה שונתה ל-${newGrade}. נותרו ${res.data.gradeChangesLeft} שינויים`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-3 pt-20">
          <div className="card p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isFollowing = data.followers?.includes(currentUser?._id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-3 pt-20 pb-24">

        {/* Profile card */}
        <div className="card mb-4 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-primary-900 to-primary-600 relative">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%)',
              backgroundSize: '20px 20px',
            }} />
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-12 mb-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center">
                  {data.profilePicture ? (
                    <Image src={data.profilePicture} alt={data.fullName} width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-2xl font-black">{data.firstName.charAt(0)}</span>
                  )}
                </div>
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors"
                    >
                      {avatarUploading ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={12} />
                      )}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                    />
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-4"
                  >
                    <Edit3 size={15} />
                    {t.editProfile}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push(`/messages?with=${id}`)}
                      className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3"
                    >
                      <MessageCircle size={15} />
                    </button>
                    <button
                      onClick={() => followMutation.mutate()}
                      className={`flex items-center gap-1.5 text-sm py-2 px-4 rounded-xl font-semibold transition-all ${
                        isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'btn-primary'
                      }`}
                    >
                      {isFollowing ? <><UserCheck size={15} /> {t.unfollow}</> : <><UserPlus size={15} /> {t.follow}</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name & info */}
            <div>
              <h1 className="text-xl font-black text-gray-900">{data.firstName} {data.lastName}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="grade-badge text-sm">{data.grade}</span>
                {data.createdAt && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {t.joined} {format(new Date(data.createdAt), 'MMMM yyyy', { locale: he })}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-3">
                <div className="text-center">
                  <div className="font-black text-gray-900">{postsData?.pagination?.total || 0}</div>
                  <div className="text-xs text-gray-500">{t.posts}</div>
                </div>
                <div className="text-center">
                  <div className="font-black text-gray-900">{data.followers?.length || 0}</div>
                  <div className="text-xs text-gray-500">{t.followers}</div>
                </div>
                <div className="text-center">
                  <div className="font-black text-gray-900">{data.following?.length || 0}</div>
                  <div className="text-xs text-gray-500">{t.following}</div>
                </div>
              </div>

              {/* Bio */}
              {editMode ? (
                <div className="mt-3">
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={160}
                    placeholder={t.bioPlaceholder}
                    className="w-full input-field text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button onClick={() => setEditMode(false)} className="btn-ghost text-sm">{t.cancel}</button>
                    <button onClick={saveBio} className="btn-primary text-sm py-2 px-4">{t.save}</button>
                  </div>
                </div>
              ) : (
                data.bio && <p className="text-sm text-gray-600 mt-3">{data.bio}</p>
              )}

              {/* Grade change */}
              {isOwnProfile && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {t.gradeChangesLeft}: <strong className={data.gradeChangesLeft === 0 ? 'text-red-500' : 'text-primary-600'}>{data.gradeChangesLeft}</strong>
                    </span>
                    {data.gradeChangesLeft > 0 && (
                      <button
                        onClick={() => setShowGradeChange(!showGradeChange)}
                        className="text-xs text-primary-600 hover:underline font-semibold"
                      >
                        {t.changeGrade}
                      </button>
                    )}
                  </div>
                  {showGradeChange && (
                    <div className="mt-2 flex gap-2">
                      <select value={newGrade} onChange={e => setNewGrade(e.target.value)} className="flex-1 input-field text-sm py-1.5">
                        <option value="">{t.selectGrade}</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <button onClick={handleGradeChange} className="btn-primary text-sm py-1.5 px-3">{t.save}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts grid */}
        <div>
          <h2 className="font-bold text-gray-700 mb-3 text-sm">{t.posts}</h2>
          {postsData?.posts?.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">📝</p>
              <p>{t.noPostsYet}</p>
            </div>
          ) : (
            postsData?.posts?.map((post: any) => (
              <PostCard key={post._id} post={post} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
