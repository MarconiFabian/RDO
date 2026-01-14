
import React from 'react';
import { cn } from '../../utils';

export const Table = ({ className, ...props }: any) => (
  <div className="relative w-full overflow-auto">
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }: any) => <thead className={cn("[&_tr]:border-b", className)} {...props} />;
export const TableBody = ({ className, ...props }: any) => <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
export const TableRow = ({ className, ...props }: any) => <tr className={cn("border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100", className)} {...props} />;
export const TableHead = ({ className, ...props }: any) => <th className={cn("h-10 px-2 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0", className)} {...props} />;
export const TableCell = ({ className, ...props }: any) => <td className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />;
export const TableCaption = ({ className, ...props }: any) => <caption className={cn("mt-4 text-sm text-slate-500", className)} {...props} />;
export const TableFooter = ({ className, ...props }: any) => <tfoot className={cn("border-t bg-slate-100/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />;
