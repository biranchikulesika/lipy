type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  collapsed?: boolean;
  suffix?: string;
  className?: string;
  iDotTop?: string;
}

const sizeMap: Record<LogoSize, string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-xl sm:text-2xl font-bold',
  lg: 'text-3xl sm:text-5xl font-black',
  xl: 'text-4xl sm:text-5xl lg:text-6xl font-extrabold',
};

export function Logo({ size = 'sm', collapsed = false, suffix = '', className, iDotTop = '0.2em' }: LogoProps) {
  const sizeClass = className || sizeMap[size];
  return (
    <span className={`font-display font-bold tracking-[0.02em] transition-all duration-300 text-white ${sizeClass}`}>
      L
      <span className="relative inline-flex flex-col items-center">
        <span className="text-transparent">i</span>
        <span className="absolute bottom-0 text-current">ı</span>
        <span className="absolute left-[50%] translate-x-[-50%] w-[0.15em] h-[0.15em] rounded-full bg-amber-400" style={{ top: iDotTop }} />
      </span>
      {!collapsed && <span>Py</span>}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
