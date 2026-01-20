
import React, { useState, useEffect, useCallback } from 'react';
import { EntityStorage } from '../entities/Storage';
import { User } from '../entities/User';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table';
import { 
  Shield, Trash2, ArrowLeft, Users, Wrench, List, Package, FileText, Power, PowerOff, AlertCircle, Wrench as ToolIcon, Download
} from 'lucide-react';
import { createPageUrl } from '../utils';
import { useToast } from '../components/ui/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export function ManagementPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [dataList, setDataList] = useState<any[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  // Mapeia a aba para o nome da tabela no banco
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

  // Função para carregar os dados da aba atual
  const refreshData = useCallback(async () => {
    const currentUser = await User.me();
    if (currentUser?.email !== 'marconifabiano@gmail.com') {
      window.location.hash = '#/';
      return;
    }
    setIsAuthorized(true);

    const entity = getEntityName(activeTab);
    const items = EntityStorage.list<any>(entity);
    setDataList(items);
  }, [activeTab]);

  useEffect(() => {
    refreshData();
    // Ouve atualizações de outras partes do app para manter a lista sincronizada
    window.addEventListener('storage-updated', refreshData);
    return () => window.removeEventListener('storage-updated', refreshData);
  }, [refreshData]);

  // Função de exclusão DIRETA
  const handleExcluir = async (id: string, nome: string) => {
    console.log(`[Management] Solicitando exclusão de ID: ${id} na aba: ${activeTab}`);

    if (!id) {
        toast({ title: "Erro Crítico", description: "Item sem ID não pode ser apagado.", variant: "destructive" });
        return;
    }

    try {
      // 1. Efeito Visual Imediato (Remove da tela antes de processar)
      setDataList(current => current.filter(item => item.id !== id));

      // 2. Remove do Banco de Dados
      const entity = getEntityName(activeTab);
      await EntityStorage.delete(entity, id);
      
      console.log(`[Management] Sucesso na exclusão do banco.`);
      toast({ title: "Removido", description: `${nome} apagado com sucesso.`, variant: "default" });
      
      // 3. Garantia extra: Recarrega os dados reais após um breve delay
      setTimeout(refreshData, 100);
    } catch (error) {
      console.error(`[Management] Falha ao excluir:`, error);
      refreshData(); // Restaura a lista em caso de erro
      toast({ title: "Erro", description: "Não foi possível apagar o item do banco de dados.", variant: "destructive" });
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

    // Cria e já atualiza a lista visualmente
    await EntityStorage.create(entity, data);
    
    (e.target as HTMLFormElement).reset();
    toast({ title: "Adicionado", description: "Novo item cadastrado com sucesso!" });
    refreshData();
  };

  const handleToggleUser = async (user: any) => {
    if (user.email === 'marconifabiano@gmail.com') return;
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    
    // Atualiza visualmente primeiro
    setDataList(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus, active: newStatus === 'active' } : u));
    
    await EntityStorage.update('AuthorizedUser', user.id, { status: newStatus, active: newStatus === 'active' });
    toast({ title: "Usuário Atualizado" });
  };

  const handleExportExcel = () => {
    if (dataList.length === 0) {
      toast({ title: "Atenção", description: "Não há dados para exportar.", variant: "warning" });
      return;
    }

    let exportData = [];

    if (activeTab === 'reports') {
      exportData = dataList.map(item => ({
        "Data": item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '',
        "OM": item.om_number,
        "Responsável": item.name,
        "Matrícula": item.registration,
        "Local": item.activity_location,
        "Tipo Serviço": item.service_type,
        "Intervenção": item.intervention_type,
        "Status": item.status,
        "Início": item.activity_start_time,
        "Fim": item.activity_end_time,
        "Trabalho Executado": item.work_executed,
        "Ocorrências": item.occurrences,
        "Vol. Andaime (m³)": item.scaffolding_volume || 0
      }));
    } else if (activeTab === 'users') {
      exportData = dataList.map(item => ({
        "Nome": item.name,
        "Email": item.email,
        "Matrícula": item.registration,
        "Status": item.status === 'active' ? 'Ativo' : (item.status === 'pending' ? 'Pendente' : 'Bloqueado'),
        "Nível Acesso": item.access_level || 'viewer',
        "Último Acesso": item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') : ''
      }));
    } else {
      // Genérico para outras abas
      exportData = dataList.map(item => ({
        "ID": item.id,
        "Nome": item.name,
        "Código": item.code || '',
        "Ativo": item.active ? "Sim" : "Não"
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    
    const fileName = `Exportacao_${activeTab}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({ title: "Exportação Concluída", description: `Arquivo ${fileName} gerado.` });
  };

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-sky-950 text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black uppercase flex items-center tracking-tight">
                <Shield className="w-6 h-6 mr-2 text-sky-400" /> Gestão Administrativa
              </h1>
              <p className="text-[10px] font-bold text-sky-300 uppercase opacity-70">Marconi Fabiano</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.hash = '#/TestDelete'} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold border border-red-400 opacity-80 hover:opacity-100"
            size="sm"
          >
            <ToolIcon className="w-4 h-4 mr-2" />
            DIAGNÓSTICO
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border w-full justify-start overflow-x-auto h-auto p-1 shadow-sm gap-1">
            <TabsTrigger value="reports" className="gap-2"><FileText className="w-4 h-4" /> Diários</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
            <TabsTrigger value="interventions" className="gap-2"><Wrench className="w-4 h-4" /> Intervenções</TabsTrigger>
            <TabsTrigger value="materials" className="gap-2"><Package className="w-4 h-4" /> Materiais</TabsTrigger>
            <TabsTrigger value="functions" className="gap-2"><List className="w-4 h-4" /> Funções</TabsTrigger>
          </TabsList>

          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-white border-b flex flex-col md:flex-row justify-between items-center gap-4 p-4">
              <CardTitle className="text-xs font-black uppercase text-sky-900">
                Lista de {activeTab} ({dataList.length})
              </CardTitle>

              <div className="flex gap-2 w-full md:w-auto">
                {['reports', 'users'].includes(activeTab) && (
                  <Button 
                    onClick={handleExportExcel} 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" /> EXCEL
                  </Button>
                )}

                {['interventions', 'materials', 'functions'].includes(activeTab) && (
                  <form onSubmit={handleSalvarNovo} className="flex gap-2 w-full md:w-auto">
                    <Input name="name" placeholder="Nome do novo item..." className="h-9 bg-slate-50 border-slate-200" required />
                    <Button type="submit" size="sm" className="bg-sky-900 text-white font-bold px-6">ADD</Button>
                  </form>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0 bg-white">
              <Table>
                <TableBody>
                  {dataList.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center py-20 text-slate-400">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        Nenhum registro encontrado nesta categoria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataList.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 transition-all">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-sky-950">
                              {activeTab === 'reports' ? `Relatório OM: ${item.om_number}` : (item.name || item.email)}
                            </span>
                            {item.email && <span className="text-[10px] text-slate-400 font-bold">{item.email}</span>}
                            {activeTab === 'reports' && <span className="text-[10px] text-slate-400 uppercase">{item.activity_location} - {format(new Date(item.date), 'dd/MM/yyyy')}</span>}
                            
                            <span className="text-[8px] text-slate-200 font-mono mt-1 select-none opacity-50">ID: {item.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 space-x-2">
                          {activeTab === 'users' && item.email !== 'marconifabiano@gmail.com' && (
                            <Button variant="ghost" size="icon" onClick={() => handleToggleUser(item)}>
                              {item.status === 'active' ? <PowerOff className="w-4 h-4 text-amber-500" /> : <Power className="w-4 h-4 text-green-500" />}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-500 transition-colors border border-red-100"
                            onClick={() => handleExcluir(item.id, item.name || item.om_number || item.email)}
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </div>
  );
}
