
import React from 'react';
import { cn } from '../../utils';

// Providing a single, unified CustomSelect component
export const CustomSelect = ({ value, onValueChange, children, className, placeholder }: any) => {
    // Find all SelectItem components and extract values
    const items: any[] = [];
    const traverse = (children: any) => {
        React.Children.forEach(children, child => {
            if (!child) return;
            if (child.type === SelectItem) {
                items.push({ value: child.props.value, label: child.props.children });
            } else if (child.props && child.props.children) {
                traverse(child.props.children);
            }
        });
    };
    traverse(children);

    return (
        <select 
            value={value || ""} 
            onChange={(e) => {
              if (typeof onValueChange === 'function') {
                onValueChange(e.target.value);
              }
            }}
            className={cn("flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400", className)}
        >
            <option value="" disabled>{placeholder || "Selecione..."}</option>
            {items.map(item => (
                <option key={item.value} value={item.value}>{typeof item.label === 'string' ? item.label : item.value}</option>
            ))}
        </select>
    );
};

// Aliasing for compatibility
export const Select = CustomSelect;
export const SelectTrigger = ({ children, className }: any) => <div className={className}>{children}</div>;
export const SelectValue = ({ placeholder, value }: any) => <span>{value || placeholder}</span>;
export const SelectContent = ({ children }: any) => <>{children}</>;
export const SelectGroup = ({ children }: any) => <>{children}</>;
export const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
