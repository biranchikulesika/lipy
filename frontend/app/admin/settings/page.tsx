'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AuthSettings } from '@/components/admin/AuthSettings';

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
