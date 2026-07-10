'use client';

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut, ArrowUpRight, ShieldCheck, BarChart3, Database,
  Menu, X, ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ─── Context for sidebar state ───
const SidebarContext = createContext({ collapsed: false });

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: BarChart3, enabled: true },
    ],
  },
  {
    section: 'Management',
    items: [
      { href: '/admin/dataset', label: 'Dataset Viewer', icon: Database, enabled: true },
      { href: '/admin/settings', label: 'Authentication', icon: ShieldCheck, enabled: true },
    ],
  },
];

function LipyLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <span className={`font-display font-bold tracking-[0.02em] transition-all duration-300 ${collapsed ? 'text-[16px]' : 'text-[18px]'}`}>
      L
      <span className="relative inline-flex flex-col items-center">
        <span className="text-transparent">i</span>
        <span className="absolute bottom-0 text-current">ı</span>
        <span className="absolute top-[0.15em] left-[50%] -translate-x-[50%] w-[0.15em] h-[0.15em] rounded-full bg-amber-400" />
      </span>
      {!collapsed && <span>Py</span>}
    </span>
  );
}

// ─── Tooltip for collapsed sidebar ───
function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-stone-100 text-stone-900 text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-100" />
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // Authentication check
  useEffect(() => {
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (!url || !key) {
          setCheckingAuth(false);
          return;
        }
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/admin/login');
        } else {
          setCheckingAuth(false);
        }
      } catch {
        setCheckingAuth(false);
      }
    })();
  }, [router]);

  // Persist sidebar state
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed, mounted]);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!mobileOpen) return;
      if (!mobileMenuRef.current) return;
      if (event.target instanceof Node && !mobileMenuRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [mobileOpen]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  const handleSignOut = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (url && key) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/admin/login');
  };

  const sidebarWidth = collapsed ? 'w-[4.5rem]' : 'w-64';

  const flatNavItems = NAV_ITEMS.flatMap((group) => group.items);

  const renderNavItems = (isMobile: boolean) => (
    <nav className={`flex-1 p-3 space-y-1 ${collapsed && !isMobile ? 'px-2' : ''}`}>
      {flatNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (!item.enabled) {
          const inner = (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-xl text-stone-700 font-semibold text-sm cursor-not-allowed select-none ${
                collapsed && !isMobile ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-40" />
              {(!collapsed || isMobile) && <span className="opacity-40">{item.label}</span>}
            </div>
          );
          return collapsed && !isMobile ? <NavTooltip key={item.label} label={item.label}>{inner}</NavTooltip> : inner;
        }

        const paddingClass = collapsed && !isMobile
          ? (isActive ? '-ml-2 pl-4 pr-0 py-2.5 rounded-l-none rounded-r-lg' : 'justify-center px-0 py-2.5 rounded-xl')
          : (isActive ? '-ml-3 pl-[22px] pr-3.5 py-2.5 rounded-l-none rounded-r-xl' : 'px-3.5 py-2.5 rounded-xl');

        const inner = (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex items-center gap-3 font-semibold text-sm transition-all duration-200 ${paddingClass} ${isActive ? 'border-l-2 border-l-amber-500 bg-stone-900/60 text-stone-100 shadow-sm' : 'border border-transparent text-stone-400 hover:bg-stone-900/40 hover:text-stone-200'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
              isActive ? 'text-amber-400 scale-110 translate-x-0.5' : 'group-hover:scale-110'
            }`} />
            {(!collapsed || isMobile) && (
              <span className={`transition-transform duration-200 ${isActive ? 'translate-x-1 font-bold text-stone-100' : 'group-hover:translate-x-0.5'}`}>
                {item.label}
              </span>
            )}
            {(!collapsed || isMobile) && isActive && (
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-stone-400 opacity-60" />
            )}
          </Link>
        );
        return collapsed && !isMobile ? <NavTooltip key={item.href} label={item.label}>{inner}</NavTooltip> : inner;
      })}
    </nav>
  );

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="h-screen bg-[#070707] text-[#F5F5F5] font-sans selection:bg-blue-900 flex flex-col overflow-hidden">

        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-50 h-14 border-b border-stone-900 bg-[#0A0A0A]/95 backdrop-blur-xl md:hidden">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <Link href="/admin" className="flex items-center">
              <LipyLogo collapsed={false} />
            </Link>

            <button
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className={`relative z-[80] flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95 ${mobileOpen ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-stone-400 hover:bg-white/5 hover:text-white'}`}
            >
              <motion.div
                initial={false}
                animate={{ rotate: mobileOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute flex items-center justify-center"
              >
                {mobileOpen ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden suppressHydrationWarning>
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden suppressHydrationWarning>
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning />
                  </svg>
                )}
              </motion.div>
            </button>
          </div>
        </header>

        {/* ─── Split layout below Header ─── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ─── Desktop Sidebar ─── */}
          <aside
            onDoubleClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('button') || target.closest('a')) {
                return;
              }
              setCollapsed(c => !c);
            }}
            title="Double-click to expand/collapse"
            className={`${sidebarWidth} border-r border-stone-900 bg-[#0A0A0A] hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out select-none cursor-pointer`}
          >
            {/* Sidebar Logo Area */}
            <div className="relative flex flex-col gap-3 px-3 pt-3 border-b border-stone-900/40 shrink-0">
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 px-3 py-2`}>
                <LipyLogo collapsed={collapsed} />
              </div>
            </div>

            {/* Nav */}
            {renderNavItems(false)}

            {/* Bottom Actions */}
            <div className="p-3 space-y-1">
              {/* Sign Out */}
              {(() => {
                const inner = (
                  <button
                    onClick={handleSignOut}
                    className={`flex items-center gap-3 w-full rounded-xl text-red-500 hover:text-red-655 text-red-400 hover:text-red-300 hover:bg-red-50/50 hover:bg-red-950/10 font-semibold text-sm transition-all duration-200 active:scale-95 ease-out ${
                      collapsed ? 'justify-center py-2.5 px-0' : 'px-3.5 py-2.5'
                    }`}
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Sign Out</span>}
                  </button>
                );
                return collapsed ? <NavTooltip label="Sign Out">{inner}</NavTooltip> : inner;
              })()}
            </div>
          </aside>

          {/* ─── Mobile Navigation Menu ─── */}
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 top-14 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                  onClick={() => setMobileOpen(false)}
                />
                <motion.div
                  ref={mobileMenuRef}
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed right-3 top-[3.9rem] z-50 w-[15rem] max-w-[calc(100vw-1.5rem)] rounded-xl border border-stone-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl border-stone-900 bg-[#0A0A0A]/95 md:hidden"
                >
                  <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                    {NAV_ITEMS.map((group) => (
                      <div key={group.section} className="space-y-1">
                        <div className="px-2.5 py-1.5 pt-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/80 text-stone-600/85 select-none">
                          {group.section}
                        </div>

                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`relative flex items-center gap-2.5 text-[13px] font-semibold transition-all ${isActive ? '-ml-2 pl-4 pr-2.5 py-2 rounded-l-none rounded-r-lg border-l-2 border-l-amber-500 bg-stone-900/60 text-stone-100' : 'rounded-lg px-2.5 py-2 text-stone-400 hover:bg-stone-900/40 hover:text-stone-200'
                              }`}
                              onClick={() => setMobileOpen(false)}
                            >
                              <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'text-amber-400 scale-110 translate-x-0.5' : ''}`} />
                              <span className={`transition-transform ${isActive ? 'translate-x-0.5 font-bold' : ''}`}>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ))}

                    <div className="my-1.5 h-px w-full bg-stone-900/80" />

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50/70 hover:text-red-600 text-red-400 hover:bg-red-950/20 hover:text-red-300"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </nav>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Page Content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
