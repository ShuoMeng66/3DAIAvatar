import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-purple-primary text-white hover:bg-purple-primary-hover shadow-[var(--shadow-purple-button)]',
  secondary:
    'bg-purple-accent/40 text-purple-text hover:bg-purple-accent/60',
  ghost:
    'bg-transparent text-purple-text-muted hover:bg-purple-accent/30 hover:text-purple-text',
  outline:
    'bg-transparent text-purple-primary border-2 border-purple-primary hover:bg-purple-primary/10',
};

export default function Button({
  variant = 'primary',
  children,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2',
        'min-h-[64px] px-8 text-[22px] font-bold rounded-2xl',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
