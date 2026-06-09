'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { AdminCodeModal } from '@/components/admin/AdminCodeModal';
import { useAdminMode } from '@/hooks/useAdminMode';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function AppShell({ children }: { children: React.ReactNode }) {
  const language = useAuthStore((s) => s.language);
  const { showCodeModal, setShowCodeModal, handleCornerTap, activateAdmin } = useAdminMode();
  const dir = language === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return (
    <div dir={dir} lang={language} className="min-h-screen">
      {/* Secret corner tap zone - top right (RTL: left) */}
      <div
        className="fixed top-0 right-0 w-16 h-16 z-[9999] cursor-default select-none"
        onClick={handleCornerTap}
        aria-hidden="true"
      />

      {children}

      {showCodeModal && (
        <AdminCodeModal
          onClose={() => setShowCodeModal(false)}
          onSubmit={activateAdmin}
        />
      )}

      <Toaster
        position={language === 'he' ? 'top-right' : 'top-left'}
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'var(--font-heebo)',
            direction: dir,
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>{children}</AppShell>
    </QueryClientProvider>
  );
}
