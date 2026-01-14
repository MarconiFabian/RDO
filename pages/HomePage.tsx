
import React, { useEffect } from 'react';
import { createPageUrl } from '../utils';

export function HomePage() {
  useEffect(() => {
    // Immediate redirect to Reports list
    const timer = setTimeout(() => {
      window.location.hash = createPageUrl('Reports');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-sky-950 via-blue-900 to-blue-950 text-white text-center p-4">
      <div className="bg-white/10 p-8 rounded-full mb-6">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
      <h1 className="text-3xl font-bold mb-2">Diário de Obras Porto</h1>
      <p className="text-blue-200">Carregando seus relatórios...</p>
    </div>
  );
}
