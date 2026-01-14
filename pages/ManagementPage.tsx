
import React, { useState, useEffect } from 'react';
import { AuthorizedUser } from '../entities/AuthorizedUser';
import { InterventionType } from '../entities/InterventionType';
import { JobFunction } from '../entities/JobFunction';
import { MaterialType } from '../entities/MaterialType';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Shield, Plus, Trash2, ArrowLeft, Users, Wrench, List } from 'lucide-react';
import { createPageUrl } from '../utils';

export function ManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [jobFunctions, setJobFunctions] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [u, it, jf, mt] = await Promise.all([
      AuthorizedUser.list(),
      InterventionType.list(),
      JobFunction.list(),
      MaterialType.list()
    ]);
    setUsers(u);
    setInterventionTypes(it);
    setJobFunctions(jf);
    setMaterialTypes(mt);
  };

  const handleAddUser = async (e: any) => {
    e.preventDefault();
    const data = new FormData(e.target);
    await AuthorizedUser.create({
      email: data.get('email'),
      name: data.get('name'),
      access_level: 'viewer',
      active: true
    });
    e.target.reset();
    loadAll();
  };

  const handleAddIntervention = async (e: any) => {
    e.preventDefault();
    const data = new FormData(e.target);
    await InterventionType.create({
      code: data.get('code'),
      name: data.get('name'),
      active: true
    });
    e.target.reset();
    loadAll();
  };

  return (
    <div className="min-h-screen">
      <header className="bg-sky-900 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <Shield className="w-6 h-6 mr-2" /> Gestão Administrativa
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white border w-full justify-start overflow-x-auto h-auto p-1 no-scrollbar">
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" /> Usuários</TabsTrigger>
            <TabsTrigger value="interventions"><Wrench className="w-4 h-4 mr-2" /> Intervenções</TabsTrigger>
            <TabsTrigger value="functions"><List className="w-4 h-4 mr-2" /> Funções</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>Usuários Autorizados</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input name="name" placeholder="Nome" required />
                  <Input name="email" placeholder="Email" required />
                  <Button type="submit" className="bg-sky-900 text-white"><Plus className="w-4 h-4 mr-2" /> Autorizar</Button>
                </form>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-slate-500">{u.email}</TableCell>
                        <TableCell><Badge variant={u.active ? "success" : "outline"}>{u.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={async () => { await AuthorizedUser.delete(u.id); loadAll(); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interventions">
            <Card>
              <CardHeader><CardTitle>Tipos de Intervenção</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleAddIntervention} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input name="code" placeholder="Código (ex: briquetagem)" required />
                  <Input name="name" placeholder="Nome Exibição" required />
                  <Button type="submit" className="bg-sky-900 text-white"><Plus className="w-4 h-4 mr-2" /> Criar</Button>
                </form>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interventionTypes.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.code}</TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={async () => { await InterventionType.delete(t.id); loadAll(); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
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
