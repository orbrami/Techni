'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home, MessageCircle, Bell, Search, LogOut,
  User, Settings, Shield, ChevronDown, Menu, X
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { useAdminMode } from '@/hooks/useAdminMode';
import { messagesAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdminMode, setLanguage, language } = useAuthStore();
  const { t, dir } = useTranslation();
  const { deactivateAdmin } = useAdminMode();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagesAPI.getUnreadCount().then(r => r.data.count),
    refetchInterval: 30000,
    enabled: !!user,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const navItems = [
    { href: '/feed', icon: Home, label: t.feed },
    { href: '/messages', icon: MessageCircle, label: t.messages, badge: unreadData },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-gray-200/80 shadow-nav">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-700 to-primary-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-black">ט</span>
          </div>
          <span className="font-black text-primary-900 text-base hidden sm:block">{t.appName}</span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-xs hidden md:block mx-4">
          <div className="relative">
            <Search size={16} className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`); }}
              placeholder={t.search + '...'}
              className={`w-full bg-gray-100 border border-transparent rounded-xl py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white ${dir === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>
        </div>

        {/* Nav items */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map(({ href, icon: Icon, label, badge }) => (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                isActive(href)
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-gray-600 hover:text-primary-700 hover:bg-primary-50'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {!!badge && badge > 0 && (
                <span className="badge absolute -top-1 -left-1 text-[10px] min-w-[16px] h-4">{badge > 99 ? '99+' : badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 mr-auto" dir="ltr">
          {/* Admin badge */}
          {isAdminMode && (
            <button
              onClick={() => router.push('/admin')}
              className="hidden sm:flex items-center gap-1.5 admin-badge px-3 py-1.5 cursor-pointer hover:bg-red-200 transition-colors"
            >
              <Shield size={14} />
              <span className="text-xs font-bold">{t.adminMode}</span>
            </button>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'he' ? 'ru' : 'he')}
            className="hidden sm:flex items-center text-xs text-gray-500 hover:text-primary-700 px-2 py-1.5 rounded-lg hover:bg-gray-100"
          >
            {language === 'he' ? '🇷🇺' : '🇮🇱'}
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-2 py-1.5 transition-colors"
            >
              {user?.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.fullName}
                  width={32}
                  height={32}
                  className="avatar w-8 h-8"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block text-right leading-tight">
                <div className="text-xs font-semibold text-gray-800">{user?.firstName}</div>
                <div className="grade-badge text-[10px]">{user?.grade}</div>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </button>

            {showMenu && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
                <Link
                  href={`/profile/${user?._id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
                  onClick={() => setShowMenu(false)}
                >
                  <User size={16} className="text-primary-500" />
                  {t.myProfile}
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
                  onClick={() => setShowMenu(false)}
                >
                  <Settings size={16} className="text-gray-400" />
                  הגדרות
                </Link>
                {isAdminMode && (
                  <>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-600"
                      onClick={() => setShowMenu(false)}
                    >
                      <Shield size={16} />
                      {t.adminPanel}
                    </Link>
                    <button
                      onClick={() => { deactivateAdmin(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-500"
                    >
                      <X size={16} />
                      יציאה ממצב מנהל
                    </button>
                  </>
                )}
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => { handleLogout(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-500"
                >
                  <LogOut size={16} />
                  {t.logout}
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobile(!showMobile)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100"
          >
            {showMobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav menu */}
      {showMobile && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
          {navItems.map(({ href, icon: Icon, label, badge }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setShowMobile(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm ${isActive(href) ? 'text-primary-700 bg-primary-50' : 'text-gray-600'}`}
            >
              <Icon size={18} />
              {label}
              {!!badge && badge > 0 && <span className="badge mr-auto">{badge}</span>}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
