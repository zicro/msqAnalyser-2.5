import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className,
  disabled
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "warning" | "error" | "success" }) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", variants[variant])}>
      {children}
    </span>
  );
};
