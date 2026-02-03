
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EntityStorage } from '../entities/Storage';
import { User } from '../entities/User';
import { GlobalSettings } from '../entities/GlobalSettings';
import { SystemNotice } from '../entities/SystemNotice';
import { Button } from '../components/ui/button';
import { 
  Shield, Trash2, ArrowLeft, Users, Wrench, List, Package, FileText, 
  Upload, ImageIcon, BellRing, Send, CheckCircle2, Clock, User as UserIcon,
  Crown, ShieldCheck, ShieldAlert, BadgeCheck, Lock, Unlock
} from 'lucide-react';
import { createPageUrl, cn, SYSTEM_CONFIG } from '../utils';
import { useToast } from '../components/ui/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export function ManagementPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [dataList, setDataList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]); 
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Estado para novo Aviso
  const [noticeTarget, setNoticeTarget] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeDate, setNoticeDate] = useState("");
  const [isTeamNotice, setIsTeamNotice] = useState(false);
  
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('custom_logo'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const getEntityName = (tab: string) => {
    const map: Record<string, string> = {
      'reports': 'DailyReport',
      'users': 'AuthorizedUser',
      'interventions': 'InterventionType',
      'materials': 'MaterialType',
      'functions': 'JobFunction',
      'notices': 'SystemNotice'
    };
    return map[tab] || '';
  };

  const refreshData = useCallback(async () => {
    setLoadingData(true);
    const userSession = await User.me();
    setCurrentUser(userSession);
    
    if (userSession?.name !== 'Marconi Fabian' && userSession?.admin !== true) {
      window.location.hash = '#/';
      return;
    }
    setIsAuthorized(true);

    const users = await EntityStorage.list<any>('AuthorizedUser');
    setUsersList(users.sort((a,b) => a.name.localeCompare(b.name)));

    const entity = getEntityName(activeTab);
    const items = activeTab === 'notices' 
        ? await SystemNotice.list() 
        : await EntityStorage.list<any>(entity);
    
    // Ordenação hierárquica para Usuários
    if (activeTab === 'users') {
        items.sort((a: any, b: any) => {
            // 1. Marconi sempre no topo
            if (a.name === 'Marconi Fabian') return -1;
            if (b.name === 'Marconi Fabian') return 1;
            
            // 2. Admins acima de Operadores
            if (a.admin && !b.admin) return -1;
            if (!a.admin && b.admin) return 1;
            
            // 3. Ordem alfabética
            return a.name.localeCompare(b.name);
        });
    }

    setDataList(items);
    setLoadingData(false);
    
    const globalLogo = await GlobalSettings.getLogo();
    if (globalLogo) {
        localStorage.setItem('custom_logo', globalLogo);
        setCustomLogo(globalLogo);
    }

  }, [activeTab]);

  useEffect(() => {
    refreshData();
    const handleStorage = () => {
        refreshData();
        setCustomLogo(localStorage.getItem('custom_logo'));
    };
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, [refreshData]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
         toast({ title: "Arquivo muito grande", description: "Use uma imagem menor que 2MB.", variant: "destructive" });
         return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setSavingLogo(true);
        try {
            await GlobalSettings.setLogo(base64);
            setCustomLogo(base64);
            toast({ title: "Logo Atualizada", description: "A nova logo está disponível para todos os usuários." });
            window.dispatchEvent(new Event('storage-updated'));
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao salvar logo.", variant: "destructive" });
        } finally {
            setSavingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = async () => {
    if (window.confirm("Restaurar logo padrão?")) {
        setSavingLogo(true);
        try {
            await GlobalSettings.removeLogo();
            setCustomLogo(null);
            window.dispatchEvent(new Event('storage-updated'));
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao remover logo.", variant: "destructive" });
        } finally {
            setSavingLogo(false);
        }
    }
  };

  // --- LÓGICA DE HIERARQUIA ---
  const canManageUser = (target: any) => {
    if (!currentUser) return false;
    
    // Ninguém mexe no Dono
    if (target.name === 'Marconi Fabian') return false;
    
    // Dono mexe em tudo
    if (currentUser.name === 'Marconi Fabian') return true;
    
    // Admin não pode mexer em outro Admin, a menos que ele mesmo tenha promovido (hierarquia de criação)
    if (target.admin) {
        // Se eu sou admin e fui eu que promovi este usuário, posso rebaixá-lo
        if (target.promoted_by && String(target.promoted_by) === String(currentUser.id)) return true;
        return false;
    }
    
    // Admin pode mexer em qualquer Operador
    if (currentUser.admin) return true;

    return false;
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (!id) return;
    if (activeTab === 'users') {
        const targetUser = dataList.find(i => i.id === id);
        if (targetUser && !canManageUser(targetUser)) {
            toast({ title: "Acesso Negado", description: "Você não tem patente para excluir este usuário.", variant: "destructive" });
            return;
        }
    }

    if(window.confirm(`Tem certeza que deseja excluir ${nome}?`)) {
        try {
            const entity = getEntityName(activeTab);
            await EntityStorage.delete(entity, id);
            setDataList(current => current.filter(item => item.id !== id));
            toast({ title: "Removido", description: "Item apagado com sucesso.", variant: "default" });
        } catch (error) {
            refreshData();
            toast({ title: "Erro", description: "Falha ao apagar.", variant: "destructive" });
        }
    }
  };

  const handleToggleAdmin = async (user: any) => {
      if (!canManageUser(user)) { 
          toast({ title: "Acesso Negado", description: "Apenas Super Admins podem alterar patentes de outros Admins.", variant: "destructive" }); 
          return; 
      }
      
      const isPromoting = !user.admin;
      const action = isPromoting ? "promovido a Gestor" : "rebaixado a Operador";
      
      let safePromoterId = currentUser.id;
      
      // Validação de segurança para ID do Marconi
      if (safePromoterId === 'master-admin-id' || currentUser.name === 'Marconi Fabian') {
          const realAdmin = usersList.find(u => u.name === 'Marconi Fabian' || u.name === currentUser.name);
          if (realAdmin && realAdmin.id && realAdmin.id !== 'master-admin-id') {
              safePromoterId = realAdmin.id;
          } else {
              safePromoterId = null;
          }
      }

      try {
          // Tenta atualizar com rastreamento (promoted_by)
          await EntityStorage.update('AuthorizedUser', user.id, { 
              admin: isPromoting, 
              promoted_by: isPromoting ? safePromoterId : null,
              access_level: isPromoting ? 'admin' : 'viewer'
          });
          toast({ title: "Hierarquia Atualizada", description: `${user.name} foi ${action}.`, variant: "success" });
          refreshData();
      } catch (e: any) {
          // SE O BANCO RECLAMAR QUE A COLUNA NÃO EXISTE, TENTA O PLANO B
          if (e.message && e.message.includes("Could not find the 'promoted_by' column")) {
              try {
                  await EntityStorage.update('AuthorizedUser', user.id, { 
                    admin: isPromoting, 
                    access_level: isPromoting ? 'admin' : 'viewer'
                    // Removemos promoted_by daqui
                  });
                  toast({ title: "Sucesso Parcial", description: `${user.name} foi alterado, mas o registro de quem alterou não foi salvo no banco.`, variant: "warning" });
                  refreshData();
                  return;
              } catch (retryError) {
                  // Se falhar de novo, é outro problema
              }
          }
          
          console.error("Erro detalhado ao atualizar permissões:", e);
          const errorMsg = e.message || "Erro desconhecido";
          toast({ title: "Erro", description: `Falha ao atualizar: ${errorMsg}`, variant: "destructive" });
      }
  };
  
  const handleToggleStatus = async (user: any) => {
      if (!canManageUser(user)) { 
          toast({ title: "Permissão Negada", variant: "destructive" }); 
          return; 
      }
      const newStatus = user.status === 'active' ? 'blocked' : 'active';
      const isActive = newStatus === 'active';
      await EntityStorage.update('AuthorizedUser', user.id, { status: newStatus, active: isActive });
      refreshData();
      toast({ title: "Status Atualizado", description: `Usuário ${isActive ? 'desbloqueado' : 'bloqueado'}.` });
  };

  const handleSalvarNovo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const entity = getEntityName(activeTab);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    if (!name) return;

    const data: any = { name, active: true };
    if (activeTab === 'interventions') {
      data.code = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    }

    await EntityStorage.create(entity, data);
    (e.target as HTMLFormElement).reset();
    toast({ title: "Adicionado", description: "Item criado com sucesso!" });
    refreshData();
  };

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeMessage) return;
    
    let prefix = "";
    let targetName = "";
    if (isTeamNotice) {
        if (noticeTarget) {
            const u = usersList.find(u => u.id === noticeTarget);
            prefix = `${u?.name.split(' ')[0]} e Equipe`;
            targetName = u?.name;
        } else {
            prefix = "Equipe";
            targetName = "Todos";
        }
    } else {
        const u = usersList.find(u => u.id === noticeTarget);
        prefix = u?.name.split(' ')[0] || "Colaborador";
        targetName = u?.name;
    }

    const formattedMessage = `${prefix}, ${noticeMessage}`;

    try {
        await SystemNotice.create({
            message: formattedMessage,
            target_user_id: noticeTarget,
            is_team: isTeamNotice,
            event_date: noticeDate,
            target_name: targetName
        });

        setNoticeMessage("");
        setNoticeDate("");
        setNoticeTarget("");
        setIsTeamNotice(false);
        toast({ title: "Enviado", description: "Notificação enviada com sucesso!" });
        refreshData();
    } catch (e: any) {
         if (e.message && (e.message.includes("column") || e.message.includes("schema"))) {
            toast({ title: "Erro de Banco", description: "O Supabase precisa de colunas novas (target_user_id, event_date). Rode o SQL de atualização.", variant: "destructive" });
         } else {
            toast({ title: "Erro", description: "Falha ao enviar aviso.", variant: "destructive" });
         }
    }
  };

  if (!isAuthorized) return null;
  const displayLogo = customLogo || SYSTEM_CONFIG.defaultLogo;

  return (
    <div className="min-h-screen bg-[#0f2441] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pb-10 font-sans">
      
      {/* Header */}
      <div className="pt-8 pb-6 px-6">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => window.location.hash = createPageUrl('Reports')} 
                    className="text-white/80 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-0.5">Admin</span>
                    <h1 className="text-xl font-black text-white leading-none">Painel de Gestão</h1>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pb-2">
            {[
                { id: 'reports', icon: FileText, label: 'Diários' },
                { id: 'users', icon: Users, label: 'Usuários' },
                { id: 'notices', icon: BellRing, label: 'Avisos' },
                { id: 'interventions', icon: Wrench, label: 'Interv.' },
                { id: 'materials', icon: Package, label: 'Materiais' },
                { id: 'functions', icon: List, label: 'Funções' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-[72px] rounded-xl transition-all border",
                        activeTab === tab.id 
                            ? "bg-white border-white shadow-lg scale-105 z-10" 
                            : "bg-[#1e3a5f] border-white/5 text-slate-400 hover:bg-[#2d4b75]"
                    )}
                >
                    <tab.icon className={cn("w-6 h-6 mb-1.5", activeTab === tab.id ? "text-[#0f2441]" : "text-slate-400")} />
                    <span className={cn("text-[10px] font-bold uppercase", activeTab === tab.id ? "text-[#0f2441]" : "text-slate-400")}>{tab.label}</span>
                </button>
            ))}
        </div>
      </div>

      <main className="px-4 space-y-4">
        
        {/* Componente de Logo Global */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
             <div className="flex items-center gap-3 w-full">
                 <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100 shrink-0">
                     <ImageIcon className="w-6 h-6 text-sky-600" />
                 </div>
                 <div>
                     <h3 className="text-xs font-black text-[#0f2441] uppercase flex items-center gap-1">Identidade Global</h3>
                     <p className="text-[10px] text-slate-400 font-medium leading-tight">{customLogo ? "Personalizada" : "Padrão"}</p>
                 </div>
            </div>
            <div className="flex items-center gap-3">
                 <div className="h-10 w-20 border border-slate-200 bg-slate-50 rounded flex items-center justify-center p-1"><img src={displayLogo} className="h-full object-contain"/></div>
                 <button onClick={() => fileInputRef.current?.click()} className="bg-[#0f3460] text-white rounded p-2"><Upload className="w-4 h-4"/></button>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                 {customLogo && <button onClick={handleResetLogo} className="bg-red-50 text-red-500 rounded p-2"><Trash2 className="w-4 h-4"/></button>}
            </div>
        </div>

        {/* --- ÁREA DE AVISOS (NOTICES) --- */}
        {activeTab === 'notices' && (
            <div className="bg-amber-50 rounded-2xl p-4 shadow-lg border-2 border-amber-200 space-y-4">
                <div className="flex items-center gap-2 text-amber-800 border-b border-amber-200 pb-2">
                    <BellRing className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase">Novo Comunicado</h3>
                </div>

                <form onSubmit={handleSendNotice} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-amber-700 uppercase">Para quem?</label>
                            <select 
                                className="w-full h-10 rounded-xl border-amber-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400"
                                value={noticeTarget}
                                onChange={e => setNoticeTarget(e.target.value)}
                            >
                                <option value="">Selecione um Colaborador...</option>
                                {usersList.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-amber-700 uppercase">Quando? (Opcional)</label>
                            <input 
                                type="datetime-local"
                                className="w-full h-10 rounded-xl border-amber-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400"
                                value={noticeDate}
                                onChange={e => setNoticeDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="isTeam" 
                            checked={isTeamNotice} 
                            onChange={e => setIsTeamNotice(e.target.checked)}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="isTeam" className="text-xs font-bold text-amber-800 cursor-pointer select-none">
                            Enviar para TODA A EQUIPE (Começa com "Fulano e Equipe...")
                        </label>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-700 uppercase">Mensagem</label>
                        <textarea 
                            className="w-full rounded-xl border-amber-200 bg-white p-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 resize-none h-20"
                            placeholder="Ex: vocês têm treinamento de segurança amanhã às 08:00."
                            value={noticeMessage}
                            onChange={e => setNoticeMessage(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black uppercase rounded-xl h-10 shadow-lg shadow-amber-500/20">
                        <Send className="w-4 h-4 mr-2" /> Enviar Notificação
                    </Button>
                </form>
            </div>
        )}

        {/* --- LISTAS DE DADOS --- */}
        <div className="space-y-3 pb-24">
            
            {/* Lista Especial de USUÁRIOS COM HIERARQUIA */}
            {activeTab === 'users' ? (
                dataList.length === 0 ? <div className="text-center text-white/50">Nenhum usuário.</div> :
                dataList.map((user) => {
                    const isSuper = user.name === 'Marconi Fabian';
                    const isAdmin = user.admin === true;
                    const canEdit = canManageUser(user);
                    const isBlocked = user.status === 'blocked' || user.status === 'pending';

                    return (
                        <div key={user.id} className={cn(
                            "rounded-2xl p-4 shadow-md flex justify-between items-center transition-all border-l-4",
                            isSuper ? "bg-amber-50 border-amber-500" :
                            isAdmin ? "bg-blue-50 border-blue-500" :
                            "bg-white border-slate-200"
                        )}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    isSuper ? "bg-amber-500 text-white" :
                                    isAdmin ? "bg-blue-600 text-white" :
                                    "bg-slate-200 text-slate-500"
                                )}>
                                    {isSuper ? <Crown className="w-5 h-5" /> : 
                                     isAdmin ? <ShieldCheck className="w-5 h-5" /> : 
                                     <UserIcon className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                                        {user.name}
                                        {isBlocked && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">Bloqueado</span>}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                                        {isSuper ? "Super Admin (Dono)" : isAdmin ? "Gestor" : "Operador"} 
                                        {user.registration && ` • Mat: ${user.registration}`}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                {canEdit && !isSuper && (
                                    <>
                                        {/* Botão Promover/Rebaixar */}
                                        <button 
                                            onClick={() => handleToggleAdmin(user)}
                                            className={cn(
                                                "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                                isAdmin ? "bg-slate-200 text-slate-500 hover:bg-slate-300" : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                            )}
                                            title={isAdmin ? "Rebaixar para Operador" : "Promover a Gestor"}
                                        >
                                            {isAdmin ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                        </button>

                                        {/* Botão Bloquear/Desbloquear */}
                                        <button 
                                            onClick={() => handleToggleStatus(user)}
                                            className={cn(
                                                "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                                !isBlocked ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                                            )}
                                            title={isBlocked ? "Desbloquear Acesso" : "Bloquear Acesso"}
                                        >
                                           {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                        </button>

                                        {/* Botão Excluir */}
                                        <button onClick={() => handleExcluir(user.id, user.name)} className="bg-red-50 text-red-500 hover:bg-red-100 w-8 h-8 rounded-xl flex items-center justify-center transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                {!canEdit && (
                                    <span className="text-[9px] text-slate-300 font-bold uppercase px-2">Protegido</span>
                                )}
                            </div>
                        </div>
                    );
                })
            ) : activeTab === 'notices' ? (
                // Lista de Avisos (Simplificada pois já temos Notices acima)
                dataList.length === 0 ? <div className="text-center text-white/50">Nenhum aviso no histórico.</div> :
                dataList.map((notice) => (
                    <div key={notice.id} className="bg-white rounded-2xl p-4 shadow-md border-l-4 border-amber-500 relative">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <h4 className="text-xs font-bold text-amber-600 uppercase mb-1">
                                    Para: {notice.target_name || 'Todos'} {notice.is_team && '(Equipe)'}
                                </h4>
                                <p className="text-sm font-medium text-slate-800">"{notice.message}"</p>
                            </div>
                            <button onClick={() => handleExcluir(notice.id, 'Aviso')} className="text-slate-300 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="mt-2 text-[9px] text-slate-400 font-bold uppercase flex gap-2">
                             <span>De: {notice.created_by}</span>
                             <span>•</span>
                             <span>Lido por: {notice.read_by?.length || 0}</span>
                        </div>
                    </div>
                ))
            ) : (
                // Lista Genérica (Materiais, Intervenções, etc)
                dataList.map((item) => (
                     <div key={item.id} className="bg-white rounded-2xl p-4 shadow-md flex justify-between items-center">
                        <div className="flex-1">
                            <h3 className="font-bold text-[#0f2441] text-sm">{item.name || item.om_number}</h3>
                            <p className="text-[10px] text-slate-400">
                                {activeTab === 'reports' && item.activity_location}
                            </p>
                        </div>
                        <button onClick={() => handleExcluir(item.id, item.name)} className="bg-red-50 text-red-500 w-8 h-8 rounded-xl flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                ))
            )}
        </div>

      </main>
    </div>
  );
}