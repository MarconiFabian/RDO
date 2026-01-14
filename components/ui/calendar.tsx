
import React from 'react';

export const Calendar = ({ mode, selected, onSelect, locale, initialFocus }: any) => {
  // Real calendar is complex, using native date input as mock
  return (
    <div className="p-3">
      <input 
        type="date" 
        value={selected ? new Date(selected).toISOString().split('T')[0] : ''} 
        onChange={(e) => onSelect(new Date(e.target.value))}
        className="w-full rounded border p-2"
      />
    </div>
  );
};
