'use client';

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = 'primary',
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseStyles = "whitespace-nowrap flex items-center justify-center px-24 py-12 rounded-[24px] font-montserrat text-p2 font-medium transition-colors duration-200";
  
  const variants = {
    primary: "bg-primary hover:bg-primary/90 text-white disabled:bg-primary/50",
    secondary: "border border-primary text-primary hover:bg-primary hover:text-white"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {loading && <Loader2 className="w-20 h-20 mr-8 animate-spin" />}
      {children}
    </button>
  );
}