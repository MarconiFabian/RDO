
import React, { useState, useEffect } from 'react';
import { TeamTemplate } from '../entities/TeamTemplate';
import { JobFunction } from '../entities/JobFunction';
import { User } from '../entities/User';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { CustomSelect as Select, SelectItem } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Users, Plus, Trash2, ArrowLeft, UserPlus, Star
} from 'lucide-react';
import { createPageUrl } from '../utils';

export function TeamTemplatePage() {
  const [members, setMembers] = useState<any[]>([]);
  const [jobFunctions, setJobFunctions] = useState<any[]>([]);
  const [newMember, setNewMember] = useState({ name: "", function: "" });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await User.me();
    setCurrentUser(u);
    const [m, jf] = await Promise.all([
      TeamTemplate.list(),
      JobFunction.list()
    ]);
    // Filtrar apenas os membros do usuário atual
    setMembers(m.filter(member => member.user_email === u.email));
    setJobFunctions(jf);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.function) return;
    
    await TeamTemplate.create({
      ...newMember,
      user_email: currentUser.email,
      active: true
    });
    
    setNewMember({ name: "", function: "" });
    loadData();
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm("Remover da sua equipe padrão?")) {
      await TeamTemplate.update(id, { user_email: "removed" }); // Mock delete by changing owner
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-sky-900 text-white p-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter flex items-center">
                <Users className="w-6 h-6 mr-2 text-sky-400" /> Equipe Padrão
              </h1>
              <p className="text-[10px] font-bold text-sky-300 uppercase tracking-widest">Seus ajudantes habituais</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="border-none shadow-xl bg-white/95">
          <CardHeader className="bg-sky-50/50 border-b">
            <CardTitle className="text-sm font-black uppercase text-sky-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Adicionar Novo Membro
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Input 
                  placeholder="Nome Completo" 
                  value={newMember.name} 
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <Select 
                  value={newMember.function} 
                  onValueChange={v => setNewMember({...newMember, function: v})}
                  placeholder="Selecione a Função"
                >
                  {jobFunctions.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                </Select>
              </div>
              <Button type="submit" className="bg-sky-900 text-white font-bold">
                <Plus className="w-4 h-4 mr-2" /> ADICIONAR
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl overflow-hidden bg-white/95">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase text-sky-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Sua Lista Salva
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>NOME</TableHead>
                  <TableHead>FUNÇÃO</TableHead>
                  <TableHead className="text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-slate-400 italic">
                      Sua equipe padrão está vazia. Adicione os membros que você mais trabalha.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-bold text-sky-900">{m.name}</TableCell>
                      <TableCell className="font-medium text-slate-500 uppercase text-[10px]">{m.function}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteMember(m.id)}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
