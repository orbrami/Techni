'use client';
import { useState } from 'react';
import { Globe, Moon, Bell, Shield, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Navbar } from '@/components/ui/Navbar';
import { usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, language, setLanguage, setUser, logout } = useAuthStore();
  const { t, dir } = useTranslation();
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = async (lang: 'he' | 'ru') => {
    setSaving(true);
    try {
      const res = await usersAPI.updateProfile({ language: lang });
      setLanguage(lang);
      setUser(res.data.user);
      toast.success('השפה עודכנה!');
    } catch {
      toast.error(t.error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-3 pt-20 pb-10">
        <h1 className="text-2xl font-black text-gray-900 mb-6">הגדרות</h1>

        {/* Language */}
        <div className="card p-4 mb-4">
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Globe size={18} className="text-primary-500" />
            שפה
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleLanguageChange('he')}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${
                language === 'he'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🇮🇱 עברית
            </button>
            <button
              onClick={() => handleLanguageChange('ru')}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${
                language === 'ru'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🇷🇺 Русский
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="card p-4 mb-4">
          <h2 className="font-bold text-gray-700 mb-3">פרטי חשבון</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">שם</span>
              <span className="text-sm font-semibold text-gray-800">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">מייל</span>
              <span className="text-sm font-semibold text-gray-800 dir-ltr text-left" dir="ltr">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">כיתה</span>
              <span className="grade-badge">{user?.grade}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">שינויי כיתה שנותרו</span>
              <span className={`text-sm font-bold ${user?.gradeChangesLeft === 0 ? 'text-red-500' : 'text-primary-600'}`}>
                {user?.gradeChangesLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card p-4 mb-4">
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Shield size={18} className="text-primary-500" />
            אבטחה
          </h2>
          <button
            onClick={() => router.push('/auth/forgot-password')}
            className="w-full flex items-center justify-between py-3 px-3 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <span className="text-sm text-gray-700">שנה סיסמה</span>
            <ArrowIcon size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="card p-4 mb-4 bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 leading-relaxed">{t.disclaimer}</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-semibold transition-colors"
        >
          <LogOut size={18} />
          {t.logout}
        </button>
      </main>
    </div>
  );
}
