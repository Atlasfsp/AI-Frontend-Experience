import { cn } from '../lib/cn';

const variantMap = {
  ghost:
    'border border-white/10 bg-transparent text-slate-100 hover:bg-white/5',
  primary:
    'border border-cyan-300/40 bg-cyan-300/15 text-cyan-50 hover:bg-cyan-300/20',
  secondary:
    'border border-white/10 bg-white/8 text-white hover:bg-white/12',
} as const;

const sizeMap = {
  md: 'h-11 px-4 text-sm',
  sm: 'h-9 px-3 text-xs uppercase tracking-[0.16em]',
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: keyof typeof sizeMap;
  variant?: keyof typeof variantMap;
}

export function Button({
  children,
  className,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-55',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
