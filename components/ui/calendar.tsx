
import React from 'react';

export const Calendar = ({ mode, selected, onSelect, locale, initialFocus }: any) => {
  // Helper para evitar crash com data inválida
  const getSafeDateValue = (date: any) => {
    try {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return (
    <div className="p-3">
      <input 
        type="date" 
        value={getSafeDateValue(selected)} 
        onChange={(e) => {
           const d = new Date(e.target.valueAsNumber); // Usa valueAsNumber para evitar fuso horário incorreto
           if(!isNaN(d.getTime())) onSelect(d);
        }}
        className="w-full rounded border p-2"
      />
    </div>
  );
};
