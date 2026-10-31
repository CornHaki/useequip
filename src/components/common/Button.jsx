import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "px-6 py-3 bg-accent hover:bg-primary text-white",
    secondary: "px-5 py-2.5 bg-secondary hover:bg-accent hover:text-white text-textMain",
    outline: "px-4 py-2 border border-slate-200 hover:bg-secondary text-textMain/80 hover:text-textMain",
    danger: "px-4 py-2 bg-surface hover:bg-secondary text-textMain border border-slate-200"
  };
  return <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}