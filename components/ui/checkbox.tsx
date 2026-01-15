
import React from 'react';
import { cn } from '../../utils';

export const Checkbox = ({ id, checked, onCheckedChange, className }: any) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => {
      if (typeof onCheckedChange === 'function') {
        onCheckedChange(e.target.checked);
      }
    }}
    className={cn("h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500", className)}
  />
);
