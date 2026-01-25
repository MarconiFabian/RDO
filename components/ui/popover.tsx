
import React, { useState } from 'react';
import { cn } from '../../utils';

export const Popover = ({ children }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      {React.Children.map(children, child => {
        if (!child) return null;
        if (child.type === PopoverTrigger) return React.cloneElement(child, { onClick: () => setOpen(!open) });
        if (child.type === PopoverContent && open) return React.cloneElement(child, { onClose: () => setOpen(false) });
        return null;
      })}
    </div>
  );
};

export const PopoverTrigger = ({ children, asChild, onClick }: any) => {
  if (asChild) return React.cloneElement(children, { onClick });
  return <button onClick={onClick} className="outline-none">{children}</button>;
};

export const PopoverContent = ({ children, className, onClose, align = 'start' }: any) => (
  <div className={cn(
    "absolute z-50 mt-2 rounded-md border bg-white p-4 shadow-md",
    align === 'end' ? 'right-0' : 'left-0',
    className
  )}>
    <div className="flex justify-end mb-2">
      <button onClick={onClose} className="text-xs text-slate-400 font-bold uppercase hover:text-slate-600">Fechar</button>
    </div>
    {children}
  </div>
);
