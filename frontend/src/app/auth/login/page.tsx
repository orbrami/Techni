'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';

const schema = z.object({
  email: z.string().email().endsWith('@edu-darom.org.il', 'Only school emails allowed'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setLanguage, language } = useAuthStore();
  const { t, dir } = useTranslation();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data.email, data.password);
      setAuth(res.data.user, res.data.token);
      toast.success(t.loginSuccess);
      router.push('/feed');
    } catch (err: any) {
      const msg = err.response?.data?.message || t.error;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen flex flex-col lg:flex-row">
      {/* Left/Top: School branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden min-h-[280px] lg:min-h-screen">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px), 
                              radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
            backgroundSize: '60px 60px',
          }} />
        </div>

        {/* School logo/image area */}
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <span className="text-4xl lg:text-5xl">🏫</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mb-2">{t.appName}</h1>
          <p className="text-primary-200 text-sm lg:text-base max-w-xs text-center leading-relaxed">{t.appTagline}</p>
          
          <div className="mt-6 flex gap-3 justify-center">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-xs text-center backdrop-blur-sm">
              <div className="font-bold text-lg">500+</div>
              <div className="text-primary-200">תלמידים</div>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-xs text-center backdrop-blur-sm">
              <div className="font-bold text-lg">32</div>
              <div className="text-primary-200">כיתות</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="absolute bottom-4 text-center text-xs text-primary-300/70 px-4 z-10">{t.disclaimer}</p>
      </div>

      {/* Right/Bottom: Login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white lg:bg-gray-50">
        <div className="w-full max-w-md">
          {/* Language toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLanguage(language === 'he' ? 'ru' : 'he')}
              className="text-sm text-gray-500 hover:text-primary-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
            >
              {language === 'he' ? '🇷🇺 Русский' : '🇮🇱 עברית'}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2">{t.loginTitle}</h2>
            <p className="text-gray-500 text-sm">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email}</label>
              <input
                {...register('email')}
                type="email"
                placeholder={t.emailPlaceholder}
                className="input-field text-sm"
                dir="ltr"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t.passwordPlaceholder}
                  className="input-field text-sm pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:underline">
                {t.forgotPassword}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  {t.login}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.noAccount}{' '}
            <Link href="/auth/register" className="text-primary-600 font-semibold hover:underline">
              {t.register}
            </Link>
          </p>

          {/* School image hint */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-xs font-semibold text-blue-800">{t.invalidEmail}</p>
              <p className="text-xs text-blue-600 mt-0.5">example.student@edu-darom.org.il</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
