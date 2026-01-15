
import React, { useState, useEffect } from 'react';
import { AuthorizedUser } from '../entities/AuthorizedUser';
import { InterventionType } from '../entities/InterventionType';
import { JobFunction } from '../entities/JobFunction';
import { MaterialType } from '../entities/MaterialType';
import { DailyReport } from '../entities/DailyReport';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Shield, Plus, Trash2, ArrowLeft, Users, Wrench, List, Package, FileText, Search
} from 'lucide-react';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';

export function ManagementPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [users, setUsers] = useState<any[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [jobFunctions, setJobFunctions] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [u, it, jf, mt, reports] = await Promise.all([
      AuthorizedUser.list(),
      InterventionType.list(),
      JobFunction.list(),
      MaterialType.list(),
      DailyReport.list()
    ]);
    setUsers(u);
    setInterventionTypes(it);
    setJobFunctions(jf);
    setMaterialTypes(mt);
    setAllReports(reports);
  };

  const handleAddItem = async (entity: any, e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data: any = {};
    formData.forEach((value, key) => data[key] = value);
    await entity.create({ ...data, active: true });
    e.target.reset();
    loadAll();
  };

  const handleDeleteItem = async (entity: any, id: string) => {
    if (confirm("Confirmar exclusão?")) {
      await entity.delete(id);
      loadAll();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-sky-900 text-white p-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter flex items-center">
                <Shield className="w-6 h-6 mr-2 text-sky-400" /> Gestão Administrativa
              </h1>
              <p className="text-[10px] font-bold text-sky-300 uppercase tracking-widest">Painel de Controle do Sistema</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border w-full justify-start overflow-x-auto h-auto p-1 no-scrollbar gap-1">
            <TabsTrigger value="reports" className="gap-2"><FileText className="w-4 h-4" /> Todos Relatórios</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
            <TabsTrigger value="interventions" className="gap-2"><Wrench className="w-4 h-4" /> Intervenções</TabsTrigger>
            <TabsTrigger value="materials" className="gap-2"><Package className="w-4 h-4" /> Materiais</TabsTrigger>
            <TabsTrigger value="functions" className="gap-2"><List className="w-4 h-4" /> Funções</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-none shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase text-sky-900">Visão Geral de Lançamentos</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Buscar por Responsável ou OM..." className="pl-8 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>DATA</TableHead>
                      <TableHead>RESPONSÁVEL</TableHead>
                      <TableHead>OM</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">AÇÃO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReports.filter(r => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.om_number?.includes(searchTerm)).map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold">{format(new Date(r.date), "dd/MM/yy")}</TableCell>
                        <TableCell className="font-medium text-slate-600">{r.name}</TableCell>
                        <TableCell className="font-mono text-xs text-sky-700">{r.om_number}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'finalizada' ? 'success' : r.status === 'paralisada' ? 'destructive' : 'secondary'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => window.location.hash = createPageUrl('DailyReport', { edit: r.id })}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-none shadow-xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase text-sky-900">Usuários Autorizados</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={(e) => handleAddItem(AuthorizedUser, e)} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-sky-50 rounded-xl">
                  <Input name="name" placeholder="Nome Completo" required />
                  <Input name="email" placeholder="Email institucional" required />
                  <Button type="submit" className="bg-sky-900 text-white font-bold">AUTORIZAR ACESSO</Button>
                </form>
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-bold">{u.name}</TableCell>
                        <TableCell className="text-slate-500">{u.email}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(AuthorizedUser, u.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interventions" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-none shadow-xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase text-sky-900">Tipos de Intervenção</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={(e) => handleAddItem(InterventionType, e)} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-sky-50 rounded-xl">
                  <Input name="code" placeholder="Código (ex: preventiva)" required />
                  <Input name="name" placeholder="Nome da Intervenção" required />
                  <Button type="submit" className="bg-sky-900 text-white font-bold">CRIAR TIPO</Button>
                </form>
                <Table>
                  <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {interventionTypes.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.code}</TableCell>
                        <TableCell className="font-bold">{t.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(InterventionType, t.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-none shadow-xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase text-sky-900">Catálogo de Materiais</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={(e) => handleAddItem(MaterialType, e)} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-sky-50 rounded-xl">
                  <Input name="name" placeholder="Nome do Material" required />
                  <Button type="submit" className="bg-sky-900 text-white font-bold">CADASTRAR MATERIAL</Button>
                </form>
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {materialTypes.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-bold">{m.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(MaterialType, m.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-none shadow-xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase text-sky-900">Funções da Equipe</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={(e) => handleAddItem(JobFunction, e)} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-sky-50 rounded-xl">
                  <Input name="name" placeholder="Nome da Função (ex: Soldador)" required />
                  <Button type="submit" className="bg-sky-900 text-white font-bold">CADASTRAR FUNÇÃO</Button>
                </form>
                <Table>
                  <TableHeader><TableRow><TableHead>Função</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {jobFunctions.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-bold">{f.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(JobFunction, f.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
