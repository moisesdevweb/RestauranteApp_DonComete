'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { AdminSidebar } from '@/modules/admin/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router   = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
