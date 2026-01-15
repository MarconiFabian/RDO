
import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ReportsPage } from './pages/ReportsPage';
import { DailyReportPage } from './pages/DailyReportPage';
import { ManagementPage } from './pages/ManagementPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { TeamTemplatePage } from './pages/TeamTemplatePage';
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
    const hash = currentPath.split('?')[0];
    if (hash === '#/' || hash === '') return <HomePage />;
    if (hash === '#/Reports') return <ReportsPage />;
    if (hash === '#/DailyReport') return <DailyReportPage />;
    if (hash === '#/Management') return <ManagementPage />;
    if (hash === '#/Analysis') return <AnalysisPage />;
    if (hash === '#/Resources') return <ResourcesPage />;
    if (hash === '#/TeamTemplate') return <TeamTemplatePage />;
    
    return <HomePage />;
  };

  return (
    <div className="min-h-screen bg-sky-950 font-sans antialiased text-slate-900">
      {renderPage()}
      <Toaster />
    </div>
  );
}
