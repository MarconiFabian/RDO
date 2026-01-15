
import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils';

const TabsContext = createContext<{ value: string; onValueChange: (v: string) => void }>({ 
  value: '', 
  onValueChange: () => {} 
});

export const Tabs = ({ value: valueProp, defaultValue, onValueChange: onValueChangeProp, children, className }: any) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : internalValue;
  
  const handleValueChange = (v: string) => {
    if (!isControlled) {
      setInternalValue(v);
    }
    if (onValueChangeProp) {
      onValueChangeProp(v);
    }
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className }: any) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className)}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className }: any) => {
  const { value: selected, onValueChange } = useContext(TabsContext);
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
        selected === value ? "bg-white text-slate-950 shadow-sm" : "hover:bg-slate-50 hover:text-slate-900",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className }: any) => {
  const { value: selected } = useContext(TabsContext);
  if (value !== selected) return null;
  return <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400", className)}>{children}</div>;
};
