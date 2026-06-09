'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/lib/store';

const GRADES = [
  { group: 'כיתה ט׳', items: ['ט1','ט2','ט3','ט4','ט5','ט6','ט7','ט8'] },
  { group: 'כיתה י׳', items: ['י1','י2','י3','י4','י5','י6','י7','י8'] },
  { group: 'כיתה י"א', items: ['יא1','יא2','יא3','יא4','יא5','יא6','יא7','יא8'] },
  { group: 'כיתה י"ב', items: ['יב1','יב2','יב3','יב4','יב5','יב6','יב7','יב8'] },
];

const schema = z.object({
  email: z.string().email('Invalid email').endsWith('@edu-darom.org.il', 'Only school emails allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  grade: z.string().min(1, 'Please select a grade'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { t, dir } = useTranslation();
  const { setLanguage, language } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [parsedName, setParsedName] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const emailValue = watch('email');

  // Live parse name from email
  const getNamePreview = (email: string) => {
    if (!email?.includes('@edu-darom.org.il')) return '';
    const local = email.split('@')[0];
    const parts = local.split('.');
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    if (parts.length >= 2) return `${cap(parts[0])} ${cap(parts.slice(1).join(' '))}`;
    return cap(local);
  };

  const namePreview = getNamePreview(emailValue || '');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authAPI.register({ email: data.email, password: data.password, grade: data.grade });
      setSuccess(true);
      setParsedName(getNamePreview(data.email));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || t.error;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div dir={dir} className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">{t.verifyEmail}</h2>
          <p className="text-gray-500 mb-2">{t.verifyEmailText}</p>
          {parsedName && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl">
              <p className="text-sm text-primary-700">
                שמך יהיה: <span className="font-bold">{parsedName}</span>
              </p>
              <p className="text-xs text-primary-500 mt-1">שם זה לא ניתן לשינוי</p>
            </div>
          )}
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary mt-6 w-full"
          >
            חזרה להתחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen flex flex-col lg:flex-row">
      {/* School branding side */}
      <div className="lg:w-2/5 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden min-h-[200px] lg:min-h-screen">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(45deg, white 25%, transparent 25%), 
                              linear-gradient(-45deg, white 25%, transparent 25%)`,
            backgroundSize: '40px 40px',
          }} />
        </div>
        <div className="relative z-10 text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-3xl font-black mb-2">{t.appName}</h1>
          <p className="text-primary-200 text-sm max-w-xs">{t.registerSubtitle}</p>
        </div>
        <p className="absolute bottom-4 text-center text-xs text-primary-300/60 px-4 z-10">{t.disclaimer}</p>
      </div>

      {/* Form */}
      <div className="lg:w-3/5 flex items-center justify-center p-6 lg:p-12 bg-white lg:bg-gray-50">
        <div className="w-full max-w-lg">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLanguage(language === 'he' ? 'ru' : 'he')}
              className="text-sm text-gray-500 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50"
            >
              {language === 'he' ? '🇷🇺 Русский' : '🇮🇱 עברית'}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2">{t.registerTitle}</h2>
            <p className="text-gray-500 text-sm">{t.registerSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email}</label>
              <input
                {...register('email')}
                type="email"
                placeholder={t.emailPlaceholder}
                className="input-field"
                dir="ltr"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              {namePreview && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
                  <span>👤</span>
                  <span>שמך יהיה: <strong>{namePreview}</strong> (לא ניתן לשינוי)</span>
                </div>
              )}
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.selectGrade}</label>
              <select {...register('grade')} className="input-field">
                <option value="">{t.selectGrade}</option>
                {GRADES.map(({ group, items }) => (
                  <optgroup key={group} label={group}>
                    {items.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t.passwordPlaceholder}
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.confirmPassword}</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder={t.passwordPlaceholder}
                className="input-field"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  {t.register}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.hasAccount}{' '}
            <Link href="/auth/login" className="text-primary-600 font-semibold hover:underline">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
