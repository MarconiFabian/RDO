
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DailyReport } from '../entities/DailyReport';
import { User } from '../entities/User';
import { EntityStorage } from '../entities/Storage';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { 
  FileText, Search, Plus, Users, BarChart3, ClipboardList, Bell, Shield, ImageIcon, UserPlus, LogOut, Camera, User as UserIcon, Settings, Wrench
} from "lucide-react";
import { createPageUrl, cn, SYSTEM_CONFIG } from '../utils';
import { useToast } from "../components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

export function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const { toast } = useToast();
  
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('custom_logo'));

  const profileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      setCurrentUser(userData);
      const adminStatus = userData?.name === 'Marconi Fabian' || userData?.admin === true;
      setIsAdmin(adminStatus);
      setCustomLogo(localStorage.getItem('custom_logo'));

      // Agora Async
      const allUsers = await EntityStorage.list<any>('AuthorizedUser');
      const avatarMap: Record<string, string> = {};
      allUsers.forEach(u => {
        if (u.avatar && u.name) {
            avatarMap[u.name] = u.avatar;
        }
      });
      setUserAvatars(avatarMap);

      // Agora Async
      const allReports = await DailyReport.list();
      
      const visible = adminStatus ? allReports : allReports.filter(r => r.created_by === userData?.name);
      
      setReports(visible);
      setFilteredReports(visible);

      const notifs = [];
      
      if (adminStatus) {
         const pending = allUsers.filter(u => u.status === 'pending');
         if (pending.length > 0) {
            notifs.push({
                id: 'pending-users',
                title: 'Aprovações Pendentes',
                description: `${pending.length} usuário(s) aguardando liberação.`,
                type: 'action',
                link: 'Management'
            });
         }
      }

      notifs.push({
         id: 'welcome',
         title: 'Bem-vindo ao RDO Online',
         description: 'Sistema pronto para uso.',
         type: 'info'
      });

      setNotifications(notifs);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadData();
    const handleStorage = () => {
        loadData();
        setCustomLogo(localStorage.getItem('custom_logo'));
    };
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, [loadData]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const searchLower = term.toLowerCase();
    const filtered = reports.filter(r =>
      r.om_number?.includes(term) ||
      r.activity_location?.toLowerCase().includes(searchLower) ||
      r.name?.toLowerCase().includes(searchLower)
    );
    setFilteredReports(filtered);
  };

  const handleLogout = () => {
    User.logout();
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Erro", description: "A imagem deve ter no máximo 2MB.", variant: "destructive" });
        return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Agora Async
        const allUsers = await EntityStorage.list<any>('AuthorizedUser');
        const dbUser = allUsers.find(u => u.id === currentUser.id); 
        
        if (dbUser) {
            await EntityStorage.update('AuthorizedUser', dbUser.id, { avatar: base64 });
            
            const updatedSession = { ...currentUser, avatar: base64 };
            localStorage.setItem('currentUser', JSON.stringify(updatedSession));
            
            toast({ title: "Foto Atualizada", description: "Sua identidade visual foi salva." });
            loadData();
        }
    };
    reader.readAsDataURL(file);
  };

  const safeFormatDate = (dateStr: string) => {
      try {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return '';
          return format(d, "dd 'de' MMM", { locale: ptBR });
      } catch {
          return '';
      }
  };

  const hasPhoto = currentUser?.name ? userAvatars[currentUser.name] : null;

  const displayLogo = customLogo || SYSTEM_CONFIG.defaultLogo;

  return (
    <div className="min-h-screen bg-[#0f2441] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] font-sans flex flex-col">
      
      <div className="px-6 pt-8 pb-6">
        <div className="flex justify-between items-center mb-6 gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                
                <div className="bg-white p-1 rounded-lg h-12 w-auto px-3 flex items-center justify-center overflow-hidden shadow-md shrink-0 opacity-90">
                    <img 
                        src={displayLogo} 
                        alt="Logo" 
                        className="h-full w-auto object-contain"
                    />
                </div>

                <div className="h-8 w-px bg-white/10 mx-1 shrink-0"></div>
                
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div 
                        className="relative group cursor-pointer shrink-0"
                        onClick={() => profileInputRef.current?.click()}
                    >
                        {!hasPhoto && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
                        )}

                        <div className={cn(
                            "w-16 h-16 rounded-full border-4 flex items-center justify-center overflow-hidden shadow-2xl transition-transform active:scale-95",
                            hasPhoto ? "border-white/20 bg-sky-950" : "border-amber-400 bg-amber-500"
                        )}>
                            {hasPhoto ? (
                                <img src={hasPhoto} alt="Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-8 h-8 text-white animate-pulse" />
                            )}
                        </div>

                        <div className={cn(
                            "absolute -bottom-1 -right-1 rounded-full p-1.5 shadow-sm border-2 border-[#0f2441] flex items-center justify-center",
                            hasPhoto ? "bg-white text-[#0f2441]" : "bg-white text-amber-600"
                        )}>
                             {hasPhoto ? <Settings className="w-3 h-3" /> : <Plus className="w-4 h-4 font-black" />}
                        </div>

                        <input 
                            type="file" 
                            ref={profileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleProfileUpload}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sky-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{isAdmin ? "Administrador" : "Operador"}</p>
                        <h1 className="text-lg font-black text-white uppercase tracking-tight leading-none truncate">
                            {currentUser?.full_name?.split(' ')[0]}
                        </h1>
                        {!hasPhoto && (
                             <p className="text-amber-400 text-[9px] font-bold animate-pulse mt-1">Toque na foto para definir 📸</p>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 shrink-0 ml-1">
                
                <Popover>
                    <PopoverTrigger>
                        <div className="relative p-2 text-white/70 hover:text-white transition-colors cursor-pointer bg-white/5 rounded-xl hover:bg-white/10">
                            <Bell className="w-5 h-5" />
                            {notifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0f2441]"></span>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[280px] sm:w-80 p-0 bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden max-w-[calc(100vw-2rem)]">
                        <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-[#0f2441] uppercase">Notificações</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded font-black">{notifications.length}</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-xs italic">
                                    Nenhuma notificação.
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        className={cn(
                                            "p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-default",
                                            n.type === 'action' ? "cursor-pointer bg-blue-50/30" : ""
                                        )}
                                        onClick={() => {
                                            if (n.type === 'action' && n.link) {
                                                if (n.link === 'Management') {
                                                    window.location.hash = '#/Management';
                                                } else {
                                                    window.location.hash = createPageUrl(n.link);
                                                }
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {n.id === 'pending-users' ? (
                                                <div className="bg-amber-100 text-amber-600 p-1.5 rounded-full mt-0.5">
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                </div>
                                            ) : (
                                                <div className="bg-slate-100 text-slate-500 p-1.5 rounded-full mt-0.5">
                                                    <Bell className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                                                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{n.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <button 
                    onClick={handleLogout}
                    className="p-2 text-red-300 hover:text-red-100 transition-colors bg-red-500/10 hover:bg-red-500/20 rounded-xl"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

        </div>

        <div className="grid grid-cols-2 gap-3 pb-2">
            <button 
                onClick={() => window.location.hash = createPageUrl('DailyReport')}
                className="flex items-center justify-center gap-2 bg-white text-[#0f2441] px-4 py-3 rounded-xl text-xs font-black uppercase shadow-lg active:scale-95 transition-transform w-full"
            >
                <Plus className="w-4 h-4" /> Novo
            </button>
            <button 
                onClick={() => window.location.hash = createPageUrl('TeamTemplate')}
                className="flex items-center justify-center gap-2 bg-[#1e3a5f] text-white border border-white/10 px-4 py-3 rounded-xl text-xs font-bold uppercase hover:bg-[#2d4b75] active:scale-95 transition-all w-full"
            >
                <Users className="w-4 h-4 text-sky-300" /> Equipe
            </button>
            {isAdmin && (
                <>
                    <button 
                        onClick={() => window.location.hash = createPageUrl('Analysis')}
                        className="flex items-center justify-center gap-2 bg-[#1e3a5f] text-white border border-white/10 px-4 py-3 rounded-xl text-xs font-bold uppercase hover:bg-[#2d4b75] active:scale-95 transition-all w-full"
                    >
                        <BarChart3 className="w-4 h-4 text-sky-300" /> Análise
                    </button>
                    <button 
                        onClick={() => window.location.hash = createPageUrl('Management')}
                        className="flex items-center justify-center gap-2 bg-[#1e3a5f] text-white border border-white/10 px-4 py-3 rounded-xl text-xs font-bold uppercase hover:bg-[#2d4b75] active:scale-95 transition-all w-full"
                    >
                        <Shield className="w-4 h-4 text-sky-300" /> Gestão
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        
        <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2 text-[#0f2441] mb-4">
                <HistoryIcon className="w-5 h-5 text-sky-600" />
                <h2 className="text-sm font-black uppercase tracking-wide">Histórico Recente</h2>
            </div>
            
            <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                    placeholder="Buscar OM, Projeto ou Local..." 
                    className="w-full h-12 bg-slate-100 rounded-2xl pl-12 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
            
            <div className="flex justify-between items-center mt-6 mb-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="w-20">Data</span>
                <span className="flex-1 text-center">OM/Projeto</span>
                <span className="w-20 text-right">Local</span>
                <span className="w-20 text-right">Status</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-40">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <ClipboardList className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm italic">Nenhum relatório encontrado.</p>
                    <p className="text-slate-300 text-xs mt-1 text-center max-w-[200px]">Utilize o botão "Novo" acima para registrar sua primeira obra hoje.</p>
                </div>
            ) : (
                filteredReports.map((report) => (
                    <div 
                        key={report.id}
                        onClick={() => window.location.hash = createPageUrl('DailyReport', { edit: report.id })}
                        className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between hover:shadow-md hover:border-sky-100 transition-all cursor-pointer group"
                    >
                        <div className="mr-3 shrink-0">
                             <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                {report.created_by && userAvatars[report.created_by] ? (
                                    <img src={userAvatars[report.created_by]} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-4 h-4 text-slate-300" />
                                )}
                             </div>
                        </div>

                        <div className="w-16">
                            <span className="text-[10px] font-bold text-slate-700 block">{safeFormatDate(report.date).split(' de ')[0]}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{safeFormatDate(report.date).split(' de ')[1]}</span>
                        </div>

                        <div className="flex-1 text-center px-2">
                            <span className="text-xs font-black text-[#0f2441] tracking-tight truncate block">{report.om_number}</span>
                        </div>

                        <div className="w-20 text-right">
                             <span className="text-[9px] font-bold text-slate-500 truncate block max-w-full">{report.activity_location || '-'}</span>
                        </div>
                        
                        <div className="w-10 flex justify-end">
                            <span className={cn("w-2 h-2 rounded-full", 
                                report.status === 'finalizada' ? 'bg-green-500' : 
                                report.status === 'paralisada' ? 'bg-red-500' : 'bg-blue-500'
                            )}></span>
                        </div>
                    </div>
                ))
            )}
        </div>

      </div>
    </div>
  );
}

const HistoryIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" /><path d="M3 3v9h9" /><path d="M12 7v5l4 2" /></svg>
);
