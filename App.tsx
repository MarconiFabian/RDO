
import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ReportsPage } from './pages/ReportsPage';
import { DailyReportPage } from './pages/DailyReportPage';
import { ManagementPage } from './pages/ManagementPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { Toaster } from './components/ui/use-toast';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    if (currentPath === '#/' || currentPath === '') return <HomePage />;
    if (currentPath.startsWith('#/Reports')) return <ReportsPage />;
    if (currentPath.startsWith('#/DailyReport')) return <DailyReportPage />;
    if (currentPath.startsWith('#/Management')) return <ManagementPage />;
    if (currentPath.startsWith('#/Resources')) return <ResourcesPage />;
    
    return <HomePage />;
  };

  return (
    <div className="app-container min-h-screen bg-slate-50">
      {renderPage()}
      <Toaster />
    </div>
  );
}
