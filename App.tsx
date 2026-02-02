
import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ReportsPage } from './pages/ReportsPage';
import { DailyReportPage } from './pages/DailyReportPage';
import { ManagementPage } from './pages/ManagementPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { TeamTemplatePage } from './pages/TeamTemplatePage';
import { NotificationsPage } from './pages/NotificationsPage'; // Novo Import
import { LoginPage } from './pages/LoginPage';
import { Toaster } from './components/ui/use-toast';
import { User } from './entities/User';
import { EntityStorage } from './entities/Storage';
import { Wifi, WifiOff } from 'lucide-react';
import { NoticeModal } from './components/notices/NoticeModal'; 

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnlineStorage, setIsOnlineStorage] = useState(false);

  const checkAuth = async () => {
    const user = await User.me();
    setCurrentUser(user);
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
    setIsOnlineStorage(EntityStorage.isOnline());

    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
      checkAuth();
    };

    const handleAuthUpdate = () => {
      checkAuth();
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('auth-update', handleAuthUpdate);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('auth-update', handleAuthUpdate);
    };
  }, []);

  if (loading) return null;

  const renderPage = () => {
    const hash = currentPath.split('?')[0];
    
    if (!currentUser) {
      return <LoginPage />;
    }

    const isAdmin = currentUser.name === 'Marconi Fabian' || currentUser.admin === true;

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
    if (hash === '#/Notifications') return <NotificationsPage />; // Nova Rota
    
    return <HomePage />;
  };

  return (
    <div className="min-h-screen bg-[#0f2441] font-sans antialiased text-slate-900 overflow-x-hidden selection:bg-sky-200">
      
      {/* Sistema de Notificações Prioritárias (Bloqueia a tela se houver aviso não lido) */}
      <NoticeModal />

      {renderPage()}
      <Toaster />

      {currentUser && (
        <div className={`fixed bottom-2 left-2 px-2 py-1 rounded-full flex items-center gap-1.5 text-[9px] font-bold z-50 pointer-events-none opacity-60 ${isOnlineStorage ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
           {isOnlineStorage ? (
             <>
                <Wifi className="w-3 h-3" />
                <span>ONLINE (Nuvem)</span>
             </>
           ) : (
             <>
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE (Local)</span>
             </>
           )}
        </div>
      )}
    </div>
  );
}
