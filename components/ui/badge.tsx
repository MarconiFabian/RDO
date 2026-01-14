
import React from 'react';
import { cn } from '../../utils';

export const Badge = ({ className, variant = "default", ...props }: any) => {
  const variants: any = {
    default: "bg-slate-900 text-slate-50",
    secondary: "bg-slate-100 text-slate-900",
    destructive: "bg-red-500 text-slate-50",
    success: "bg-green-600 text-white",
    outline: "text-slate-950 border border-slate-200",
  };
  return <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2", variants[variant], className)} {...props} />;
};
