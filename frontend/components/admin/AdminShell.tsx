'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut, ArrowUpRight, ShieldCheck, BarChart3, Database,
  PanelLeftClose, PanelLeft, Menu, X, ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

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
    <span className={`font-display font-bold tracking-[0.15em] transition-all duration-300 ${collapsed ? 'text-[16px]' : 'text-[18px]'}`}>
      L
      <span className="relative inline-flex flex-col items-center">
        <span className="text-transparent">i</span>
        <span className="absolute bottom-0 text-current">ı</span>
        <span className="absolute top-[0.15em] left-[50%] -translate-x-[50%] w-[0.15em] h-[0.15em] rounded-full bg-amber-600 dark:bg-amber-400" />
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
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-900 dark:border-r-stone-100" />
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
        const supabase = createBrowserClient(url, key);
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#070707] flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  const handleSignOut = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (url && key) {
      const supabase = createBrowserClient(url, key);
      await supabase.auth.signOut();
    }
    router.push('/admin/login');
  };

  const sidebarWidth = collapsed ? 'w-[4.5rem]' : 'w-64';

  const renderNavItems = (isMobile: boolean) => (
    <nav className={`flex-1 p-3 space-y-1 ${collapsed && !isMobile ? 'px-2' : ''}`}>
      {NAV_ITEMS.map((group) => (
        <div key={group.section}>
          {/* Section label */}
          {(!collapsed || isMobile) && (
            <div className="px-3.5 py-2 pt-4 first:pt-1 text-[10px] font-bold uppercase tracking-widest text-stone-400/80 dark:text-stone-600/85 select-none">
              {group.section}
            </div>
          )}

          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (!item.enabled) {
              const inner = (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 rounded-xl text-stone-300 dark:text-stone-700 font-semibold text-sm cursor-not-allowed select-none ${
                    collapsed && !isMobile ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-40" />
                  {(!collapsed || isMobile) && <span className="opacity-40">{item.label}</span>}
                </div>
              );
              return collapsed && !isMobile ? <NavTooltip key={item.label} label={item.label}>{inner}</NavTooltip> : inner;
            }

            const inner = (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  collapsed && !isMobile ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-stone-900 to-stone-850 dark:from-stone-100 dark:to-stone-200 text-white dark:text-stone-950 shadow-md shadow-stone-900/10 dark:shadow-none font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/70 dark:hover:bg-stone-900/40 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                  isActive ? 'scale-105' : 'group-hover:scale-110'
                }`} />
                {(!collapsed || isMobile) && (
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    {item.label}
                  </span>
                )}
                {(!collapsed || isMobile) && isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70 animate-pulse" />
                )}
              </Link>
            );
            return collapsed && !isMobile ? <NavTooltip key={item.href} label={item.label}>{inner}</NavTooltip> : inner;
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="h-screen bg-stone-50 dark:bg-[#070707] dark:text-[#F5F5F5] text-[#262626] font-sans selection:bg-blue-200 dark:selection:bg-blue-900 flex flex-col overflow-hidden">

        {/* ─── Top Full-Width Navbar ─── */}
        <header className="h-[4.5rem] bg-white/60 dark:bg-[#0A0A0A]/70 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 select-none border-b border-stone-200/40 dark:border-stone-900/40">
          <div className="flex items-center h-full">
            {/* Logo Area aligned with Desktop Sidebar */}
            <div className={`hidden md:flex items-center h-full ${sidebarWidth} transition-all duration-300 ease-in-out`}>
              <LipyLogo collapsed={collapsed} />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 mr-3 rounded-xl border border-stone-200/60 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-500 dark:text-stone-400 transition-all duration-200 md:hidden flex items-center justify-center"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Title / Subtitle */}
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">{title}</h1>
              {subtitle && (
                <p className="text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 -mt-0.5 hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Action links */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="group flex items-center gap-1.5 border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm shadow-emerald-500/5"
            >
              <span className="hidden sm:inline">OCR Workspace</span>
              <span className="sm:hidden">Workspace</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </header>

        {/* ─── Split layout below Header ─── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ─── Desktop Sidebar ─── */}
          <aside className={`${sidebarWidth} border-r border-stone-200/60 dark:border-stone-900 bg-white dark:bg-[#0A0A0A] hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out`}>
            {/* Nav */}
            {renderNavItems(false)}

            {/* Bottom Actions */}
            <div className="p-3 space-y-1">
              {/* Collapse Toggle */}
              <button
                onClick={() => setCollapsed(c => !c)}
                className={`flex items-center gap-3 w-full rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100/70 dark:hover:bg-stone-900/40 font-semibold text-sm transition-all duration-200 ${
                  collapsed ? 'justify-center py-2.5 px-0' : 'px-3.5 py-2.5'
                }`}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeft className="w-4 h-4 shrink-0" /> : <PanelLeftClose className="w-4 h-4 shrink-0" />}
                {!collapsed && <span>Collapse</span>}
              </button>

              {/* Sign Out */}
              {(() => {
                const inner = (
                  <button
                    onClick={handleSignOut}
                    className={`flex items-center gap-3 w-full rounded-xl text-red-500 hover:text-red-655 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 font-semibold text-sm transition-all duration-200 ${
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

          {/* ─── Mobile Overlay Sidebar ─── */}
          <AnimatePresence>
            {mobileOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                  onClick={() => setMobileOpen(false)}
                />
                {/* Drawer */}
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed top-0 left-0 bottom-0 w-72 bg-white/90 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-r border-stone-200/60 dark:border-stone-850 z-50 flex flex-col md:hidden shadow-2xl"
                >
                  {/* Drawer Header */}
                  <div className="h-[4.5rem] flex items-center justify-between px-5 shrink-0">
                    <LipyLogo collapsed={false} />
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="p-1.5 rounded-xl border border-stone-100 dark:border-stone-900 hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-500 dark:text-stone-400 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {renderNavItems(true)}

                  <div className="p-4 pb-6">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-red-500 hover:text-red-655 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 font-semibold text-sm transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
