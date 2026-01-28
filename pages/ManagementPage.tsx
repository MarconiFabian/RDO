
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EntityStorage } from '../entities/Storage';
import { User } from '../entities/User';
import { GlobalSettings } from '../entities/GlobalSettings';
import { Button } from '../components/ui/button';
import { 
  Shield, Trash2, ArrowLeft, Users, Wrench, List, Package, FileText, 
  Power, PowerOff, Download, Plus,
  Database, ImageIcon, Upload, RefreshCcw, User as UserIcon, ShieldAlert, Cloud
} from 'lucide-react';
import { createPageUrl, cn, SYSTEM_CONFIG } from '../utils';
import { useToast } from '../components/ui/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export function ManagementPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [dataList, setDataList] = useState<any[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('custom_logo'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const getEntityName = (tab: string) => {
    const map: Record<string, string> = {
      'reports': 'DailyReport',
      'users': 'AuthorizedUser',
      'interventions': 'InterventionType',
      'materials': 'MaterialType',
      'functions': 'JobFunction'
    };
    return map[tab] || '';
  };

  const getTabLabel = (tab: string) => {
    const map: Record<string, string> = {
      'reports': 'Diários',
      'users': 'Usuários',
      'interventions': 'Intervenções',
      'materials': 'Materiais',
      'functions': 'Funções'
    };
    return map[tab] || '';
  };

  const refreshData = useCallback(async () => {
    setLoadingData(true);
    const currentUser = await User.me();
    
    if (currentUser?.name !== 'Marconi Fabian' && currentUser?.admin !== true) {
      window.location.hash = '#/';
      return;
    }
    setIsAuthorized(true);

    const entity = getEntityName(activeTab);
    const items = await EntityStorage.list<any>(entity);
    setDataList(items);
    setLoadingData(false);
    
    // Sync da Logo Global
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
            toast({ title: "Erro", description: "Falha ao salvar logo na nuvem. Verifique o banco de dados.", variant: "destructive" });
        } finally {
            setSavingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = async () => {
    if (window.confirm("Isso removerá a logo personalizada para TODOS os usuários. O sistema voltará a usar o link padrão. Continuar?")) {
        setSavingLogo(true);
        try {
            await GlobalSettings.removeLogo();
            setCustomLogo(null);
            toast({ title: "Logo Restaurada", description: "Usando padrão global." });
            window.dispatchEvent(new Event('storage-updated'));
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao remover logo.", variant: "destructive" });
        } finally {
            setSavingLogo(false);
        }
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (!id) return;
    try {
      setDataList(current => current.filter(item => item.id !== id));
      const entity = getEntityName(activeTab);
      await EntityStorage.delete(entity, id);
      toast({ title: "Removido", description: `${nome} apagado.`, variant: "default" });
    } catch (error) {
      refreshData();
      toast({ title: "Erro", description: "Falha ao apagar.", variant: "destructive" });
    }
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

  const handleToggleUser = async (user: any) => {
    if (user.name === 'Marconi Fabian') return; 
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    setDataList(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus, active: newStatus === 'active' } : u));
    await EntityStorage.update('AuthorizedUser', user.id, { status: newStatus, active: newStatus === 'active' });
    toast({ title: "Status Atualizado", description: `Usuário ${newStatus === 'active' ? 'ativado' : 'bloqueado'}.` });
  };

  const handleToggleAdmin = async (user: any) => {
    if (user.name === 'Marconi Fabian') return;
    const newAdminStatus = !user.admin;
    setDataList(prev => prev.map(u => u.id === user.id ? { ...u, admin: newAdminStatus } : u));
    await EntityStorage.update('AuthorizedUser', user.id, { admin: newAdminStatus });
    toast({ 
        title: newAdminStatus ? "Novo Administrador" : "Administrador Removido", 
        description: `O usuário ${user.name} ${newAdminStatus ? 'agora é admin' : 'agora é usuário comum'}.`
    });
  };

  const safeFormatDate = (dateString: any) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return format(date, 'dd/MM/yyyy');
    } catch (e) {
      return '';
    }
  };

  const handleExportExcel = () => {
    if (dataList.length === 0) {
      toast({ title: "Vazio", description: "Sem dados para exportar.", variant: "warning" });
      return;
    }
    
    let exportData = [];
    if (activeTab === 'reports') {
      exportData = dataList.map(item => ({
        "Data": safeFormatDate(item.date),
        "OM": item.om_number,
        "Responsável": item.name,
        "Local": item.activity_location,
        "Status": item.status
      }));
    } else if (activeTab === 'users') {
      exportData = dataList.map(item => ({
        "Nome": item.name,
        "Matrícula": item.registration,
        "Status": item.status,
        "Admin": item.admin ? "Sim" : "Não"
      }));
    } else {
      exportData = dataList.map(item => ({ "ID": item.id, "Nome": item.name }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `Gestao_${activeTab}.xlsx`);
    toast({ title: "Sucesso", description: "Download iniciado." });
  };

  if (!isAuthorized) return null;

  const displayLogo = customLogo || SYSTEM_CONFIG.defaultLogo;

  return (
    <div className="min-h-screen bg-[#0f2441] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pb-10 font-sans">
      
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

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pb-2">
            {[
                { id: 'reports', icon: FileText, label: 'Diários' },
                { id: 'users', icon: Users, label: 'Usuários' },
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
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3 w-full">
                 <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100 shrink-0">
                     <ImageIcon className="w-6 h-6 text-sky-600" />
                 </div>
                 <div>
                     <h3 className="text-xs font-black text-[#0f2441] uppercase flex items-center gap-1">
                        Identidade Global
                        <Cloud className="w-3 h-3 text-sky-400" />
                     </h3>
                     <p className="text-[10px] text-slate-400 font-medium leading-tight">
                        {customLogo ? "Logo definida via Nuvem." : "Logo padrão do sistema."}
                     </p>
                 </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="h-12 w-28 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden relative shrink-0">
                     <img src={displayLogo} alt="Logo Atual" className="h-full w-full object-contain p-1" />
                     {savingLogo && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                     )}
                 </div>

                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                 />

                 <div className="flex gap-2">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={savingLogo}
                        className="bg-[#0f3460] hover:bg-[#0f2441] text-white rounded-xl px-3 py-2 flex items-center justify-center transition-colors shadow-lg shadow-blue-900/10 disabled:opacity-50"
                        title="Substituir para TODOS"
                     >
                        <Upload className="w-4 h-4" />
                     </button>
                     
                     {customLogo && (
                         <button 
                            onClick={handleResetLogo}
                            disabled={savingLogo}
                            className="bg-red-50 hover:bg-red-100 text-red-500 rounded-xl px-3 py-2 flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Restaurar Padrão Global"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                     )}
                 </div>
            </div>
        </div>

        <div className="flex justify-between items-center px-2 pt-2">
            <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">
                {loadingData ? "Carregando..." : `${dataList.length} Registros encontrados`}
            </span>
            {['reports', 'users'].includes(activeTab) && (
                <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase shadow-lg transition-colors"
                >
                    <Download className="w-3 h-3" /> Excel
                </button>
            )}
        </div>

        {['interventions', 'materials', 'functions'].includes(activeTab) && (
            <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex gap-2 items-center">
                <div className="w-10 h-10 bg-[#0f3460] rounded-xl flex items-center justify-center text-white shrink-0">
                    <Plus className="w-5 h-5" />
                </div>
                <form onSubmit={handleSalvarNovo} className="flex-1 flex gap-2">
                    <input 
                        name="name" 
                        className="w-full bg-slate-50 rounded-xl px-4 text-sm font-medium outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
                        placeholder={`Adicionar novo em ${getTabLabel(activeTab)}...`}
                        required
                    />
                    <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black uppercase px-4 rounded-xl transition-colors">
                        Salvar
                    </button>
                </form>
            </div>
        )}

        <div className="space-y-3 pb-24">
            {loadingData ? (
                 <div className="text-center py-20 text-white/50 animate-pulse">Carregando dados...</div>
            ) : dataList.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center opacity-30">
                    <Database className="w-16 h-16 text-white mb-4" />
                    <p className="text-white font-medium">Nenhum dado encontrado</p>
                </div>
            ) : (
                dataList.map((item) => (
                    <div 
                        key={item.id} 
                        className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex justify-between items-center group relative overflow-hidden"
                    >
                        {activeTab === 'users' && (
                            <div className="mr-3 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {item.avatar ? (
                                        <img src={item.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-[#0f2441] truncate text-sm">
                                    {activeTab === 'reports' ? `OM: ${item.om_number}` : (item.name || item.email)}
                                </h3>
                                {activeTab === 'users' && (item.admin || item.name === 'Marconi Fabian') && (
                                    <Shield className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                                )}
                            </div>
                            
                            <div className="flex flex-col text-[10px] text-slate-400 font-medium">
                                {activeTab === 'users' && <span className="truncate">Matrícula: {item.registration}</span>}
                                {activeTab === 'reports' && (
                                    <span>{safeFormatDate(item.date)} • {item.activity_location}</span>
                                )}
                                {activeTab === 'users' && (
                                    <span className={item.status === 'active' ? 'text-green-600' : 'text-amber-500'}>
                                        {item.status === 'active' ? '● Ativo' : '● Pendente/Bloqueado'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Botões de Ação para Usuários */}
                            {activeTab === 'users' && item.name !== 'Marconi Fabian' && (
                                <>
                                    {/* Botão Tornar Admin */}
                                    <button
                                        onClick={() => handleToggleAdmin(item)}
                                        className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                            item.admin
                                                ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                        )}
                                        title={item.admin ? "Remover Admin" : "Tornar Admin"}
                                    >
                                        <Shield className="w-4 h-4" />
                                    </button>

                                    {/* Botão Ativar/Bloquear */}
                                    <button 
                                        onClick={() => handleToggleUser(item)}
                                        className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                            item.status === 'active' 
                                                ? "bg-green-100 text-green-600 hover:bg-green-200" 
                                                : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                        )}
                                        title={item.status === 'active' ? "Bloquear" : "Ativar"}
                                    >
                                        {item.status === 'active' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                    </button>
                                </>
                            )}
                            
                            <button 
                                onClick={() => handleExcluir(item.id, item.name || item.om_number)}
                                className="w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

      </main>
    </div>
  );
}
