
import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ReportsPage } from './pages/ReportsPage';
import { DailyReportPage } from './pages/DailyReportPage';
import { ManagementPage } from './pages/ManagementPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { TeamTemplatePage } from './pages/TeamTemplatePage';
import { LoginPage } from './pages/LoginPage';
import { TestDeletionPage } from './pages/TestDeletionPage';
import { Toaster } from './components/ui/use-toast';
import { User } from './entities/User';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await User.me();
      setCurrentUser(user);
      setLoading(false);
    };

    checkAuth();

    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
      checkAuth();
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) return null;

  const renderPage = () => {
    const hash = currentPath.split('?')[0];
    
    // Rota de Teste de Exclusão (Acessível sem login para facilitar o teste, ou com login)
    if (hash === '#/TestDelete') {
        return <TestDeletionPage />;
    }
    
    // Se não estiver logado, vai para Login
    if (!currentUser) {
      return <LoginPage />;
    }

    // Bloqueio de Segurança: Somente marconifabiano@gmail.com acessa Gestão
    const isAdmin = currentUser.email === 'marconifabiano@gmail.com';

    if (hash === '#/Management') {
      return isAdmin ? <ManagementPage /> : <HomePage />;
    }
    
    if (hash === '#/Analysis') {
      return isAdmin ? <AnalysisPage /> : <HomePage />;
    }

    if (hash === '#/' || hash === '') return <HomePage />;
    if (hash === '#/Reports') return <ReportsPage />;
    if (hash === '#/DailyReport') return <DailyReportPage />;
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
