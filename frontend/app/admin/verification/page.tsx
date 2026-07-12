'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AdminShell } from '@/components/admin/AdminShell';

const VerificationDashboard = dynamic(
  () => import('@/components/admin/VerificationDashboard').then((mod) => mod.VerificationDashboard),
  { ssr: false },
);

export default function VerificationPage() {
  return (
    <AdminShell title="Verification" subtitle="Monitor sample validation & anti-abuse">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        }
      >
        <VerificationDashboard />
      </Suspense>
    </AdminShell>
  );
}
