
import React from 'react';
import { cn } from '../../utils';

export const Label = ({ className, ...props }: any) => (
  <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
);
