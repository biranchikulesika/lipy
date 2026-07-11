export function Logo({ collapsed = false, suffix = '', className }: { collapsed?: boolean; suffix?: string; className?: string }) {
  const sizeClass = className || (collapsed ? 'text-[16px]' : 'text-[16px] sm:text-[18px]');
  return (
    <span className={`font-display font-bold tracking-[0.02em] transition-all duration-300 text-white ${sizeClass}`}>
      L
      <span className="relative inline-flex flex-col items-center">
        <span className="text-transparent">i</span>
        <span className="absolute bottom-0 text-current">ı</span>
        <span className="absolute top-[0.15em] left-[50%] -translate-x-[50%] w-[0.15em] h-[0.15em] rounded-full bg-amber-400" />
      </span>
      {!collapsed && <span>Py</span>}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
