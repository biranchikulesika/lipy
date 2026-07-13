'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AdminShell } from '@/components/admin/AdminShell';

const StatsDashboard = dynamic(
  () => import('@/components/admin/StatsDashboard').then((mod) => mod.StatsDashboard),
  { ssr: false },
);

export default function StatsPage() {
  return (
    <AdminShell title="Statistics" subtitle="Dataset metrics & verification pipeline">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        }
      >
        <StatsDashboard />
      </Suspense>
    </AdminShell>
  );
}
