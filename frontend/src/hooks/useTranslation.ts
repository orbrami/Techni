'use client';
import { useAuthStore } from '@/lib/store';
import { translations } from '@/i18n/translations';

export function useTranslation() {
  const language = useAuthStore((s) => s.language);
  const t = translations[language] || translations.he;
  const dir = language === 'he' ? 'rtl' : 'ltr';
  return { t, language, dir };
}
