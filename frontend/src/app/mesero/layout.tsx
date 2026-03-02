'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

export default function MeseroLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuthStore(); // ← cambia esto
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !user) router.replace('/login');
  }, [_hasHydrated, user]);

  if (!_hasHydrated) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  return <>{children}</>;
}
