'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AdminShell } from '@/components/admin/AdminShell';

const AuthSettings = dynamic(() => import('@/components/admin/AuthSettings').then(mod => mod.AuthSettings), {
  ssr: false,
});

export default function SettingsPage() {
  return (
    <AdminShell title="Authentication" subtitle="Manage sign-in methods">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        }
      >
        <AuthSettings />
      </Suspense>
    </AdminShell>
  );
}
