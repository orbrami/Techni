'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, Video, X, Send, Globe, Users } from 'lucide-react';
import { postsAPI, uploadAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [visibility, setVisibility] = useState<'all' | 'grade'>('all');
  const [uploading, setUploading] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File, type: 'image' | 'video') => {
    setMediaFile(file);
    setMediaType(type);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) return;
    setUploading(true);

    try {
      let mediaUrl: string | undefined;
      let mediaThumbnail: string | undefined;

      if (mediaFile && mediaType) {
        const uploadFn = mediaType === 'image' ? uploadAPI.uploadImage : uploadAPI.uploadVideo;
        const res = await uploadFn(mediaFile);
        mediaUrl = res.data.url;
        if (mediaType === 'video') mediaThumbnail = res.data.thumbnail;
      }

      const res = await postsAPI.createPost({
        content: content.trim(),
        mediaUrl,
        mediaType,
        mediaThumbnail,
        visibility,
        targetGrade: visibility === 'grade' ? user?.grade : undefined,
      });

      onPostCreated(res.data.post);
      setContent('');
      removeMedia();
      setFocused(false);
      toast.success('הפוסט פורסם! 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-4 mb-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user?.profilePicture ? (
            <Image src={user.profilePicture} alt="" width={40} height={40} className="rounded-full w-10 h-10 object-cover" />
          ) : (
            <>{user?.firstName.charAt(0)}{user?.lastName.charAt(0)}</>
          )}
        </div>

        {/* Input area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={t.whatsOnMind}
            className="w-full bg-gray-100 hover:bg-gray-50 focus:bg-white rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            rows={focused ? 3 : 2}
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative mt-3 rounded-xl overflow-hidden bg-gray-100">
              {mediaType === 'image' ? (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-cover" />
              ) : (
                <video src={mediaPreview} className="w-full max-h-64" controls />
              )}
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Toolbar */}
          {focused && (
            <div className="flex items-center justify-between mt-3 animate-fade-in">
              <div className="flex items-center gap-1">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'image')} />
                <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'video')} />

                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-green-600 hover:bg-green-50 font-medium transition-colors"
                >
                  <ImageIcon size={16} />
                  <span className="hidden sm:inline">{t.addPhoto}</span>
                </button>
                <button
                  onClick={() => videoRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
                >
                  <Video size={16} />
                  <span className="hidden sm:inline">{t.addVideo}</span>
                </button>

                {/* Visibility */}
                <select
                  value={visibility}
                  onChange={e => setVisibility(e.target.value as any)}
                  className="text-xs text-gray-500 bg-gray-100 border-0 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="all">🌍 {t.allGrades}</option>
                  <option value="grade">🏫 כיתה {user?.grade}</option>
                </select>
              </div>

              <button
                onClick={handleSubmit}
                disabled={(!content.trim() && !mediaFile) || uploading}
                className="btn-primary flex items-center gap-1.5 py-2 px-4 text-sm"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {t.createPost}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
