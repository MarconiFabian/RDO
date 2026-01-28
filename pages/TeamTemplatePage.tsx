
import React, { useState, useEffect } from 'react';
import { TeamTemplate } from '../entities/TeamTemplate';
import { JobFunction } from '../entities/JobFunction';
import { User } from '../entities/User';
import { EntityStorage } from '../entities/Storage';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CustomSelect as Select, SelectItem } from '../components/ui/select';
import { 
  Users, Plus, Trash2, ArrowLeft, UserPlus, Star, Briefcase, User as UserIcon, UserX
} from 'lucide-react';
import { createPageUrl } from '../utils';
import { useToast } from '../components/ui/use-toast';

export function TeamTemplatePage() {
  const [members, setMembers] = useState<any[]>([]);
  const [jobFunctions, setJobFunctions] = useState<any[]>([]);
  const [newMember, setNewMember] = useState({ name: "", function: "" });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});

  const { toast } = useToast();

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
    
    // Agora Async
    const allUsers = await EntityStorage.list<any>('AuthorizedUser');
    const map: Record<string, string> = {};
    
    allUsers.forEach(user => {
        if (user.avatar && user.name) {
            map[user.name.trim().toLowerCase()] = user.avatar;
        }
    });
    setAvatarMap(map);

    setMembers(m.filter(member => member.user_email === u.name));
    setJobFunctions(jf);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.function) return;
    
    await TeamTemplate.create({
      ...newMember,
      user_email: currentUser.name, 
      active: true
    });
    
    setNewMember({ name: "", function: "" });
    toast({ title: "Membro Adicionado", description: "O colaborador foi salvo." });
    loadData();
  };

  const handleDeleteMember = async (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    try {
      await TeamTemplate.delete(id);
    } catch (e) {
      loadData();
    }
  };

  const getAvatar = (name: string) => {
      const normalized = name.trim().toLowerCase();
      return avatarMap[normalized] || null;
  };

  return (
    <div className="min-h-screen bg-[#0f2441] pb-10">
      
      <div className="pt-8 pb-8 px-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="flex items-center gap-4">
            <button onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Users className="w-6 h-6 text-sky-400" /> Equipe Padrão
                </h1>
                <p className="text-sky-200/60 text-[10px] font-bold uppercase tracking-widest pl-8">Seus ajudantes habituais</p>
            </div>
        </div>
      </div>

      <main className="px-4 space-y-6 max-w-lg mx-auto">
        
        <div className="bg-white rounded-[24px] p-6 shadow-xl">
           <div className="flex items-center gap-2 mb-6">
              <UserPlus className="w-5 h-5 text-[#0f2441]" />
              <h2 className="text-sm font-black text-[#0f2441] uppercase">Adicionar Novo Membro</h2>
           </div>
           
           <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</label>
                 <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-300" />
                    <Input 
                        placeholder="Ex: João da Silva" 
                        value={newMember.name} 
                        onChange={e => setNewMember({...newMember, name: e.target.value})}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                    />
                 </div>
              </div>
              
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Função</label>
                 <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-5 w-5 text-slate-300" />
                    <Select 
                        value={newMember.function} 
                        onValueChange={(v: string) => setNewMember({...newMember, function: v})}
                        placeholder="Selecione a Função"
                        className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl appearance-none"
                    >
                        {jobFunctions.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                    </Select>
                 </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-[#0f3460] text-white font-bold rounded-xl text-xs uppercase shadow-lg shadow-blue-900/20 mt-2">
                 <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
           </form>
        </div>

        <div className="bg-white rounded-[24px] overflow-hidden shadow-xl min-h-[300px]">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                 <h2 className="text-sm font-black text-[#0f2441] uppercase">Sua Lista Salva</h2>
              </div>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {members.length} membros
              </span>
           </div>

           <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-12 px-6 py-2 bg-slate-50/50 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                 <div className="col-span-8">Identificação</div>
                 <div className="col-span-4 text-right">Ações</div>
              </div>
              
              {members.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 opacity-50">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <UserX className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Nenhum membro encontrado</p>
                    <p className="text-xs text-slate-300 text-center px-8 mt-1">
                        Sua equipe padrão está vazia. Adicione os membros com quem você trabalha habitualmente para agilizar seus relatórios.
                    </p>
                 </div>
              ) : (
                 members.map(m => {
                    const avatar = getAvatar(m.name);
                    return (
                        <div key={m.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-slate-50 transition-colors group">
                           <div className="col-span-10 flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                    {avatar ? (
                                        <img src={avatar} alt={m.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-700 text-sm truncate">{m.name}</div>
                                    <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase block w-fit mt-0.5">
                                        {m.function}
                                    </span>
                                </div>
                           </div>
                           <div className="col-span-2 text-right">
                              <button onClick={() => handleDeleteMember(m.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 bg-slate-50 hover:bg-red-50 rounded-xl">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                    );
                 })
              )}
           </div>
        </div>

      </main>

      <div className="mt-8 text-center">
         <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">RDO Online © 2025</p>
         <p className="text-[9px] text-white/20">Gestão Industrial</p>
      </div>
    </div>
  );
}
