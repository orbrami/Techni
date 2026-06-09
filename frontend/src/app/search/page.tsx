'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Navbar } from '@/components/ui/Navbar';
import { useQuery } from '@tanstack/react-query';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => usersAPI.search(query).then(r => r.data.users),
    enabled: query.length >= 2,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-3 pt-20 pb-10">
        <h1 className="text-2xl font-black text-gray-900 mb-6">{t.search}</h1>

        <div className="relative mb-6">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש תלמיד לפי שם..."
            className="input-field pr-12 text-base"
            autoFocus
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data?.length === 0 && query.length >= 2 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>לא נמצאו תלמידים עבור "{query}"</p>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-2">
            {data.map((u: any) => (
              <div key={u._id} className="card p-4 flex items-center gap-4">
                <Link href={`/profile/${u._id}`} className="flex items-center gap-3 flex-1 hover:opacity-80">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                    {u.profilePicture
                      ? <Image src={u.profilePicture} alt="" width={48} height={48} className="w-full h-full object-cover" />
                      : <>{u.firstName.charAt(0)}{u.lastName.charAt(0)}</>
                    }
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                    <span className="grade-badge">{u.grade}</span>
                  </div>
                </Link>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/messages?with=${u._id}`)}
                    className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <MessageCircle size={15} />
                  </button>
                  <Link href={`/profile/${u._id}`} className="btn-primary text-sm py-1.5 px-4">
                    {t.profile}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {query.length < 2 && (
          <div className="text-center py-12 text-gray-400">
            <Search size={48} className="mx-auto mb-3 opacity-20" />
            <p>הקלד לפחות 2 אותיות לחיפוש</p>
          </div>
        )}
      </main>
    </div>
  );
}
