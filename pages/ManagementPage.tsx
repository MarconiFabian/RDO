
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EntityStorage } from '../entities/Storage';
import { User } from '../entities/User';
import { GlobalSettings } from '../entities/GlobalSettings';
import { SystemNotice } from '../entities/SystemNotice';
import { Button } from '../components/ui/button';
import { 
  Shield, Trash2, ArrowLeft, Users, Wrench, List, Package, FileText, 
  Upload, ImageIcon, BellRing, Send, CheckCircle2, Clock, User as UserIcon,
  Crown, ShieldCheck, ShieldAlert, BadgeCheck, Lock, Unlock, Plus, Search,
  Layers, FileInput
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
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para cadastro em lote
  const [isBatchMode, setIsBatchMode] = useState(false);

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
    let items = activeTab === 'notices' 
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
                  });
                  toast({ title: "Hierarquia Atualizada", description: `${user.name} foi ${action}.`, variant: "success" });
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
    
    // MODO LOTE
    if (isBatchMode) {
        const rawText = formData.get('batch_names') as string;
        if (!rawText) return;

        const lines = rawText.split('\n').filter(line => line.trim() !== "");
        if (lines.length === 0) return;

        setLoadingData(true);
        let count = 0;
        try {
            for (const line of lines) {
                const cleanName = line.trim();
                // Evita duplicatas simples na lista atual visual
                if (dataList.some(d => d.name?.toLowerCase() === cleanName.toLowerCase())) continue;

                const data: any = { name: cleanName, active: true };
                if (activeTab === 'interventions') {
                   data.code = cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
                }
                
                // Salva um por um
                await EntityStorage.create(entity, data);
                count++;
            }
            toast({ title: "Processamento Concluído", description: `${count} itens foram adicionados com sucesso.` });
        } catch (err) {
            toast({ title: "Erro Parcial", description: "Alguns itens podem não ter sido salvos.", variant: "warning" });
        } finally {
            setLoadingData(false);
            (e.target as HTMLFormElement).reset();
            refreshData();
            // Volta para modo simples se desejar, ou mantém
        }

    } else {
        // MODO INDIVIDUAL
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
    }
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
            try {
               await EntityStorage.create('SystemNotice', { message: formattedMessage });
               toast({ title: "Enviado", description: "Notificação enviada com sucesso!" });
               refreshData();
            } catch(retryErr) {
               toast({ title: "Erro de Banco", description: "Necessário atualizar colunas no Supabase.", variant: "destructive" });
            }
         } else {
            toast({ title: "Erro", description: "Falha ao enviar aviso.", variant: "destructive" });
         }
    }
  };

  const handleExportUsers = () => {
    const ws = XLSX.utils.json_to_sheet(dataList.map(u => ({
        Nome: u.name,
        Matrícula: u.registration,
        Email: u.email,
        Status: u.status,
        Perfil: u.admin ? 'Administrador' : 'Operador',
        CriadoEm: u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuários");
    XLSX.writeFile(wb, "RDO_Usuarios.xlsx");
  };

  const handleExportReports = () => {
    // Implementação simplificada de exportação de relatórios
    const ws = XLSX.utils.json_to_sheet(dataList.map(r => ({
        Data: r.date,
        OM: r.om_number,
        Local: r.activity_location,
        Responsavel: r.name,
        Status: r.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorios");
    XLSX.writeFile(wb, "RDO_Historico.xlsx");
  };

  // Filtragem genérica
  const filteredData = dataList.filter(item => {
     if (!searchTerm) return true;
     const term = searchTerm.toLowerCase();
     return (
         item.name?.toLowerCase().includes(term) || 
         item.om_number?.includes(term) ||
         item.message?.toLowerCase().includes(term)
     );
  });

  if (!isAuthorized) return null;
  const displayLogo = customLogo || SYSTEM_CONFIG.defaultLogo;

  return (
    <div className="min-h-screen bg-[#0f2441] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pb-10 font-sans">
      
      {/* Header */}
      <div className="pt-8 pb-6 px-6">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
               <button onClick={() => window.location.hash = '#/Reports'} className="text-white/80 hover:text-white transition-colors">
                  <ArrowLeft className="w-6 h-6" />
               </button>
               <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-0.5">Admin</span>
                  <h1 className="text-xl font-black text-white leading-none">Painel de Gestão</h1>
               </div>
            </div>
            
            <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center border border-white/10 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {savingLogo ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <ImageIcon className="w-5 h-5 text-white" />
                )}
                <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full border border-[#1e3a5f]"></div>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
            />
        </div>

        {/* Navigation Tabs (Scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'reports', label: 'Diários', icon: FileText },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'notices', label: 'Avisos', icon: BellRing },
              { id: 'interventions', label: 'Interv.', icon: Wrench },
              { id: 'materials', label: 'Materiais', icon: Package },
              { id: 'functions', label: 'Funções', icon: List },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center justify-center w-24 h-20 rounded-2xl shrink-0 transition-all border",
                    activeTab === tab.id 
                       ? "bg-white border-white text-[#0f2441] shadow-lg scale-105 z-10" 
                       : "bg-[#1e3a5f] border-white/5 text-white/60 hover:bg-[#2d4b75]"
                  )}
               >
                  <tab.icon className={cn("w-6 h-6 mb-2", activeTab === tab.id ? "text-sky-600" : "text-white/40")} />
                  <span className="text-[10px] font-bold uppercase">{tab.label}</span>
               </button>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-4">
         
         {/* IDENTIDADE GLOBAL CARD (Só mostra na aba Usuários ou Diários) */}
         {(activeTab === 'users' || activeTab === 'reports') && (
             <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl p-2 flex items-center justify-center overflow-hidden border border-slate-200">
                        <img src={displayLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-[#0f2441] uppercase">Identidade Global</h3>
                        <p className="text-[10px] text-slate-400 font-bold">
                            {customLogo ? "Personalizada" : "Padrão"}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {customLogo && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={handleResetLogo}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-slate-200" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 text-slate-600" />
                    </Button>
                </div>
             </div>
         )}
         
         {/* --- CADASTRO RÁPIDO (Individual ou Lote) --- */}
         {['interventions', 'materials', 'functions'].includes(activeTab) && (
            <div className="bg-white rounded-2xl p-4 shadow-lg animate-in slide-in-from-bottom-4 transition-all">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                        {isBatchMode ? <Layers className="w-4 h-4 text-sky-600" /> : <Plus className="w-4 h-4" />}
                        {isBatchMode ? "Cadastro em Lote" : "Adicionar Item"}
                    </h3>
                    <button 
                        onClick={() => setIsBatchMode(!isBatchMode)}
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-800 bg-sky-50 px-2 py-1 rounded-lg transition-colors uppercase"
                    >
                        {isBatchMode ? "Mudar para Individual" : "Mudar para Lote"}
                    </button>
                </div>
                
                <form onSubmit={handleSalvarNovo} className={cn("flex gap-2", isBatchMode ? "flex-col" : "flex-row")}>
                    <div className="relative flex-1">
                        {isBatchMode ? (
                            <>
                                <textarea 
                                    name="batch_names" 
                                    placeholder={`Cole aqui sua lista de ${activeTab === 'materials' ? 'materiais' : activeTab === 'functions' ? 'funções' : 'intervenções'}.\nUm item por linha.`}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 placeholder:text-slate-400 min-h-[120px] resize-y"
                                ></textarea>
                                <p className="text-[9px] text-slate-400 mt-1 pl-2 italic">Dica: Copie do Excel ou Bloco de Notas e cole acima.</p>
                            </>
                        ) : (
                            <input 
                                name="name" 
                                placeholder="Digite o nome..." 
                                className="w-full bg-slate-50 border-none h-11 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 placeholder:text-slate-300 transition-all"
                                autoComplete="off"
                            />
                        )}
                    </div>
                    
                    {isBatchMode ? (
                        <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-10 w-full shadow-md shadow-sky-200 flex items-center justify-center gap-2 uppercase text-xs font-bold">
                            <Layers className="w-4 h-4" /> Processar Lista
                        </Button>
                    ) : (
                        <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-11 w-12 shadow-md shadow-sky-200 flex items-center justify-center shrink-0">
                            <Plus className="w-6 h-6" />
                        </Button>
                    )}
                </form>
            </div>
         )}

         {/* --- AREA DE LISTAGEM --- */}
         <div className="bg-white rounded-[32px] p-6 shadow-xl min-h-[400px]">
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black text-[#0f2441] uppercase flex items-center gap-2">
                   {activeTab === 'reports' && <FileText className="w-5 h-5 text-sky-600" />}
                   {activeTab === 'users' && <Users className="w-5 h-5 text-sky-600" />}
                   {activeTab === 'notices' && <BellRing className="w-5 h-5 text-sky-600" />}
                   {['interventions', 'materials', 'functions'].includes(activeTab) && <List className="w-5 h-5 text-sky-600" />}
                   
                   Gerenciar {activeTab === 'interventions' ? 'Intervenções' : 
                              activeTab === 'materials' ? 'Materiais' : 
                              activeTab === 'functions' ? 'Funções' : 
                              activeTab === 'notices' ? 'Avisos' :
                              activeTab === 'reports' ? 'Relatórios' : 'Usuários'}
                </h2>
                
                {activeTab === 'users' && (
                    <Button size="sm" variant="outline" onClick={handleExportUsers} className="h-8 text-[10px] font-bold uppercase">
                        Exportar XLS
                    </Button>
                )}
                {activeTab === 'reports' && (
                    <Button size="sm" variant="outline" onClick={handleExportReports} className="h-8 text-[10px] font-bold uppercase">
                        Exportar XLS
                    </Button>
                )}
            </div>
            
            {/* Search Bar (exceto para avisos) */}
            {activeTab !== 'notices' && (
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Pesquisar na lista..." 
                        className="w-full h-10 bg-slate-50 rounded-xl pl-10 pr-4 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-slate-200"
                    />
                </div>
            )}

            {loadingData ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div></div>
            ) : (
               <div className="space-y-3">
                  
                  {/* --- ABA AVISOS --- */}
                  {activeTab === 'notices' && (
                      <>
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-6">
                            <h3 className="text-xs font-black text-amber-600 uppercase mb-3 flex items-center gap-2">
                                <Send className="w-4 h-4" /> Novo Comunicado
                            </h3>
                            <form onSubmit={handleSendNotice} className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <select 
                                        className="bg-white border-none text-xs rounded-xl h-9 px-2 font-bold text-slate-600"
                                        value={noticeTarget}
                                        onChange={e => setNoticeTarget(e.target.value)}
                                    >
                                        <option value="">Para Todos</option>
                                        {usersList.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="datetime-local" 
                                        className="bg-white border-none text-xs rounded-xl h-9 px-2 font-bold text-slate-600"
                                        value={noticeDate}
                                        onChange={e => setNoticeDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                    <input type="checkbox" id="team" checked={isTeamNotice} onChange={e => setIsTeamNotice(e.target.checked)} className="rounded text-amber-600 focus:ring-amber-500" />
                                    <label htmlFor="team" className="text-[10px] font-bold text-amber-700 uppercase">Incluir equipe do destinatário</label>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        placeholder="Digite a mensagem..." 
                                        className="flex-1 bg-white border-none h-10 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none"
                                        value={noticeMessage}
                                        onChange={e => setNoticeMessage(e.target.value)}
                                    />
                                    <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-10 w-12">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                        </div>
                        
                        <div className="space-y-2">
                            {filteredData.length === 0 && <p className="text-center text-xs text-slate-400 italic">Nenhum aviso enviado.</p>}
                            {filteredData.map((notice: any) => (
                                <div key={notice.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-bold uppercase bg-slate-200 text-slate-500 px-1.5 rounded">
                                                {notice.target_name || "Todos"}
                                            </span>
                                            {notice.event_date && (
                                                <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-600 px-1.5 rounded flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Evento: {format(new Date(notice.event_date), 'dd/MM HH:mm')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-slate-700">"{notice.message}"</p>
                                        {notice.read_by && notice.read_by.length > 0 && (
                                            <div className="mt-2 flex -space-x-1">
                                                {notice.read_by.map((r: any, i: number) => (
                                                     <div key={i} className="w-4 h-4 rounded-full bg-green-500 border border-white flex items-center justify-center text-[8px] text-white font-bold" title={r.user_name}>
                                                        {r.user_name[0]}
                                                     </div>
                                                ))}
                                                <span className="text-[9px] text-slate-400 pl-2 pt-0.5">Lido por {notice.read_by.length}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => handleExcluir(notice.id, 'este aviso')} className="text-slate-300 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                      </>
                  )}

                  {/* --- ABA USUARIOS --- */}
                  {activeTab === 'users' && filteredData.map((user: any) => (
                     <div key={user.id} className={cn(
                         "p-3 rounded-xl border flex items-center justify-between transition-all",
                         user.status === 'pending' ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"
                     )}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm overflow-hidden",
                                    user.admin ? "bg-sky-100 border-sky-200 text-sky-700" : "bg-slate-200 border-slate-300 text-slate-500"
                                )}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5" />
                                    )}
                                </div>
                                {user.admin && (
                                    <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-0.5 rounded-full border border-white">
                                        <Crown className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-black text-slate-700 flex items-center gap-2">
                                    {user.name}
                                    {user.name === 'Marconi Fabian' && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-100" />}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-mono text-slate-400">{user.registration || "S/ Matrícula"}</span>
                                    {user.status === 'pending' && <span className="text-[8px] font-bold uppercase bg-amber-200 text-amber-700 px-1 rounded">Pendente</span>}
                                    {user.status === 'blocked' && <span className="text-[8px] font-bold uppercase bg-red-200 text-red-700 px-1 rounded">Bloqueado</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Botão de Promover/Rebaixar */}
                            <button 
                                onClick={() => handleToggleAdmin(user)}
                                disabled={!canManageUser(user)}
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    !canManageUser(user) ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200",
                                    user.admin ? "text-sky-500" : "text-slate-300"
                                )}
                                title={user.admin ? "Rebaixar a Operador" : "Promover a Gestor"}
                            >
                                <ShieldCheck className="w-4 h-4" />
                            </button>

                            {/* Botão de Bloquear/Desbloquear */}
                            <button 
                                onClick={() => handleToggleStatus(user)}
                                disabled={!canManageUser(user)}
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    !canManageUser(user) ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200",
                                    user.status === 'blocked' ? "text-red-500" : "text-green-500"
                                )}
                                title={user.status === 'blocked' ? "Desbloquear" : "Bloquear Acesso"}
                            >
                                {user.status === 'blocked' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>

                            {/* Botão de Excluir */}
                            <button 
                                onClick={() => handleExcluir(user.id, user.name)}
                                disabled={!canManageUser(user)}
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors text-slate-300 hover:text-red-500 hover:bg-red-50",
                                    !canManageUser(user) && "opacity-30 cursor-not-allowed hover:text-slate-300 hover:bg-transparent"
                                )}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                     </div>
                  ))}

                  {/* --- ABA RELATORIOS (Modo Lista Simples) --- */}
                  {activeTab === 'reports' && filteredData.map((report: any) => (
                     <div key={report.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-slate-300 text-xs border border-slate-200">
                                {new Date(report.date).getDate()}
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-700">{report.om_number}</h4>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{report.activity_location}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                                report.status === 'finalizada' ? "bg-green-100 text-green-700" : 
                                report.status === 'paralisada' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {report.status}
                            </span>
                            <button onClick={() => handleExcluir(report.id, `Relatório ${report.om_number}`)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                     </div>
                  ))}

                  {/* --- LISTA GENÉRICA (Intervenções, Materiais, Funções) --- */}
                  {['interventions', 'materials', 'functions'].includes(activeTab) && filteredData.map((item: any) => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                          <span className="text-xs font-bold text-slate-700">{item.name}</span>
                          <button onClick={() => handleExcluir(item.id, item.name)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  ))}

               </div>
            )}
         </div>
      </div>
      
      <div className="mt-8 text-center text-[10px] text-white/30 font-bold uppercase tracking-widest">
         RDO Online © 2025
      </div>
    </div>
  );
}
