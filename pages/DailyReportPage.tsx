
import React, { useState, useEffect } from 'react';
import { DailyReport } from '../entities/DailyReport';
import { InterventionType } from '../entities/InterventionType';
import { JobFunction } from '../entities/JobFunction';
import { MaterialType } from '../entities/MaterialType';
import { User } from '../entities/User';
import { EntityStorage } from '../entities/Storage';
import { TeamTemplate } from '../entities/TeamTemplate';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { CustomSelect as Select, SelectItem } from '../components/ui/select';
import { 
  ArrowLeft, Plus, Trash2, Users, FileText, Calendar, MapPin, 
  CloudSun, Package, UserCircle, Clock, User as UserIcon
} from 'lucide-react';
import { getQueryParams, createPageUrl, cn } from '../utils';
import { useToast } from '../components/ui/use-toast';
import WhatsAppReport from '../components/reports/WhatsAppReport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export function DailyReportPage() {
  const [loading, setLoading] = useState(false);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [jobFunctions, setJobFunctions] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const query = getQueryParams();
  const editId = query.get('edit');
  const copyId = query.get('copy');

  // Controle de adição de material
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialQty, setMaterialQty] = useState("");

  const [report, setReport] = useState<any>({
    name: "", 
    registration: "", 
    om_type: "om", // 'om' ou 'projeto'
    om_number: "", 
    intervention_type: "outros",
    service_type: "eletromecânica", 
    scaffolding_height: 0, scaffolding_width: 0, scaffolding_length: 0, scaffolding_volume: 0, 
    pts_required: true,
    pts_request_time: "", pts_opening_time: "", 
    activity_start_time: "", activity_end_time: "", 
    status: "em_andamento", 
    team_members: [],
    replaced_materials: [], // Lista de materiais { name, quantity }
    // Fix: Usa formatação local para evitar problemas de UTC
    date: format(new Date(), 'yyyy-MM-dd'),
    work_executed: "", 
    weather_morning: "Sol", weather_afternoon: "Sol", weather_night: "Limpo", 
    occurrences: "", 
    activity_location: "",
    pause_reason: "", pending_activities: ""
  });

  const [newMember, setNewMember] = useState({ name: "", function: "" });

  useEffect(() => {
    async function init() {
      const u = await User.me();
      
      const users = await EntityStorage.list<any>('AuthorizedUser');
      const dbUser = users.find((dbU: any) => dbU.email === u?.email);
      const userWithAvatar = dbUser ? { ...u, avatar: dbUser.avatar } : u;
      
      setCurrentUser(userWithAvatar);

      // Criar mapa de avatares para equipe
      const map: Record<string, string> = {};
      users.forEach((user: any) => {
        if (user.avatar && user.name) {
            map[user.name.trim().toLowerCase()] = user.avatar;
        }
      });
      setAvatarMap(map);
      
      const [it, jf, mt] = await Promise.all([
        InterventionType.list(),
        JobFunction.list(),
        MaterialType.list()
      ]);
      setInterventionTypes(it);
      setJobFunctions(jf);
      setMaterialTypes(mt);

      if (editId) {
        const existing = await DailyReport.get(editId);
        if (existing) setReport({ ...existing, om_type: existing.om_type || 'om', replaced_materials: existing.replaced_materials || [] });
      } else if (copyId) {
        const original = await DailyReport.get(copyId);
        if (original) {
          const { id, created_at, updated_at, ...copyData } = original;
          // Ao copiar, também garantimos a data de hoje
          setReport({ ...copyData, date: format(new Date(), 'yyyy-MM-dd'), om_type: copyData.om_type || 'om', replaced_materials: copyData.replaced_materials || [] });
        }
      } else {
        setReport(prev => ({ ...prev, name: u.full_name, registration: u.registration }));
      }
    }
    init();
  }, [editId, copyId]);

  const handleInputChange = (field: string, value: any) => {
    setReport(prev => {
      const updated = { ...prev, [field]: value };
      if (field.startsWith('scaffolding_')) {
        const h = updated.scaffolding_height || 0;
        const w = updated.scaffolding_width || 0;
        const l = updated.scaffolding_length || 0;
        updated.scaffolding_volume = Number((h * w * l).toFixed(2));
      }
      return updated;
    });
  };

  const handleAddMaterial = () => {
    if (!selectedMaterial || !materialQty) return;
    const currentList = report.replaced_materials || [];
    const newItem = { name: selectedMaterial, quantity: materialQty };
    handleInputChange('replaced_materials', [...currentList, newItem]);
    setSelectedMaterial("");
    setMaterialQty("");
  };

  const handleRemoveMaterial = (index: number) => {
    const currentList = [...(report.replaced_materials || [])];
    currentList.splice(index, 1);
    handleInputChange('replaced_materials', currentList);
  };

  const handleSave = async () => {
    // Validação condicional
    if (report.om_type === 'om') {
        if (!report.om_number || report.om_number.length !== 12) {
            toast({ title: "Validação", description: "OM deve ter 12 dígitos.", variant: "destructive" });
            return;
        }
    } else {
        if (!report.om_number || report.om_number.length < 3) {
            toast({ title: "Validação", description: "Identificação do projeto inválida.", variant: "destructive" });
            return;
        }
    }

    setLoading(true);
    try {
      if (editId) await DailyReport.update(editId, report);
      else await DailyReport.create(report);
      toast({ title: "Salvo", description: "Relatório registrado." });
      window.location.hash = createPageUrl('Reports');
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getAvatar = (name: string) => {
    if (!name) return null;
    const normalized = name.trim().toLowerCase();
    return avatarMap[normalized] || null;
  };

  const weatherOptions = ["Sol", "Nublado", "Chuva Leve", "Chuva Forte", "Vento Forte", "Limpo"];
  const todayStr = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-[#0f2441] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pb-24 font-sans">
      
      {/* Header */}
      <div className="pt-8 pb-6 px-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white/80 hover:text-white transition-colors">
                  <ArrowLeft className="w-6 h-6" />
               </button>
               <div>
                  <h1 className="text-xl font-black text-white uppercase tracking-tight">{editId ? "Editar" : "Novo"} Relatório</h1>
                  <p className="text-sky-400 text-[10px] font-bold uppercase">Preencha os dados abaixo</p>
               </div>
            </div>
            <button 
                onClick={handleSave} 
                disabled={loading} 
                className="bg-white text-[#0f2441] font-black h-9 text-xs px-5 rounded-xl shadow-lg hover:bg-slate-50 transition-colors uppercase tracking-wide"
            >
               {loading ? "..." : "Salvar"}
            </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-4">

        {/* Card 0: Responsável (Novo) */}
        <div className="bg-white rounded-[24px] p-5 shadow-xl relative overflow-hidden">
           <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
              <UserCircle className="w-5 h-5 text-[#0f2441]" />
              <h2 className="text-sm font-black text-[#0f2441] uppercase">Responsável Técnico</h2>
           </div>
           
           <div className="flex items-center gap-4">
               {/* Foto do Usuário */}
               <div className="shrink-0">
                   <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-100 shadow-inner flex items-center justify-center overflow-hidden">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-6 h-6 text-slate-300" />
                        )}
                   </div>
               </div>

               <div className="grid grid-cols-1 gap-2 flex-1">
                   <div className="space-y-1">
                       <Label className="text-[10px] uppercase font-bold text-slate-400">Nome</Label>
                       <Input value={report.name} onChange={e => handleInputChange('name', e.target.value)} className="bg-slate-50 border-none h-9 text-xs font-bold rounded-xl" />
                   </div>
                   <div className="space-y-1">
                       <Label className="text-[10px] uppercase font-bold text-slate-400">Matrícula</Label>
                       <Input value={report.registration} onChange={e => handleInputChange('registration', e.target.value)} className="bg-slate-50 border-none h-9 text-xs font-bold rounded-xl" />
                   </div>
               </div>
           </div>
        </div>
        
        {/* Card 1: Dados da Obra (Modificado) */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <FileText className="w-5 h-5 text-[#0f2441]" />
              <h2 className="text-sm font-black text-[#0f2441] uppercase">Dados da Obra</h2>
           </div>
           
           <div className="space-y-4">
              {/* Seletor OM/Projeto */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => handleInputChange('om_type', 'om')}
                    className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
                        report.om_type === 'om' ? "bg-white text-[#0f2441] shadow-sm" : "text-slate-400"
                    )}
                  >
                    Número da OM
                  </button>
                  <button 
                    onClick={() => handleInputChange('om_type', 'projeto')}
                    className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
                        report.om_type === 'projeto' ? "bg-white text-[#0f2441] shadow-sm" : "text-slate-400"
                    )}
                  >
                    Nº do Projeto
                  </button>
              </div>

              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400">
                    {report.om_type === 'om' ? 'Número da OM (12 Dígitos)' : 'Identificação do Projeto'}
                </Label>
                <input 
                    value={report.om_number} 
                    maxLength={report.om_type === 'om' ? 12 : 50} 
                    onChange={e => handleInputChange('om_number', report.om_type === 'om' ? e.target.value.replace(/\D/g, '') : e.target.value)} 
                    placeholder={report.om_type === 'om' ? "000000000000" : "Digite o nome ou número"}
                    className="w-full text-xl font-black text-[#0f2441] border-b-2 border-slate-100 focus:border-sky-500 outline-none py-1 bg-transparent tracking-widest placeholder:text-slate-200"
                />
              </div>

              {/* Data Fixa e Data de Execução */}
              <div className="grid grid-cols-5 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                 <div className="col-span-2 space-y-1 border-r border-slate-200 pr-2">
                    <Label className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Hoje (Fixo)
                    </Label>
                    <div className="h-8 flex items-center text-xs font-bold text-slate-500">
                        {todayStr}
                    </div>
                 </div>
                 <div className="col-span-3 space-y-1 pl-1">
                    <Label className="text-[9px] uppercase font-bold text-blue-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Data Execução
                    </Label>
                    <input 
                        type="date" 
                        value={report.date} 
                        onChange={e => handleInputChange('date', e.target.value)} 
                        className="w-full bg-white text-xs font-black text-[#0f2441] h-8 rounded-lg border border-slate-200 focus:border-blue-500 px-2 shadow-sm" 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Status Atual</Label>
                    <Select value={report.status} onValueChange={v => handleInputChange('status', v)} className="h-9 text-xs bg-slate-50 border-none rounded-xl">
                      <SelectItem value="em_andamento">Andamento</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="paralisada">Paralisada</SelectItem>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Local de Execução</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input value={report.activity_location} onChange={e => handleInputChange('activity_location', e.target.value)} placeholder="Ex: Berço 102" className="pl-9 h-9 bg-slate-50 border-none rounded-xl" />
                    </div>
                 </div>
              </div>

           </div>
        </div>

        {/* Card 2: Clima (Novo) */}
        <div className="bg-white rounded-[24px] p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
              <CloudSun className="w-5 h-5 text-[#0f2441]" />
              <h2 className="text-sm font-black text-[#0f2441] uppercase">Condições Climáticas</h2>
           </div>
           <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 block text-center">Manhã</Label>
                  <Select value={report.weather_morning} onValueChange={v => handleInputChange('weather_morning', v)} className="h-8 text-[10px] bg-slate-50 border-none rounded-lg text-center">
                    {weatherOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </Select>
              </div>
              <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 block text-center">Tarde</Label>
                  <Select value={report.weather_afternoon} onValueChange={v => handleInputChange('weather_afternoon', v)} className="h-8 text-[10px] bg-slate-50 border-none rounded-lg text-center">
                    {weatherOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </Select>
              </div>
              <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 block text-center">Noite</Label>
                  <Select value={report.weather_night} onValueChange={v => handleInputChange('weather_night', v)} className="h-8 text-[10px] bg-slate-50 border-none rounded-lg text-center">
                    {weatherOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </Select>
              </div>
           </div>
        </div>

        {/* Card 3: Detalhes Técnicos */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl">
           <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Tipo de Serviço</Label>
                 <Select value={report.service_type} onValueChange={v => handleInputChange('service_type', v)} className="h-9 text-xs bg-slate-50 border-none rounded-xl">
                    <SelectItem value="eletromecânica">Eletromecânica</SelectItem>
                    <SelectItem value="andaime">Andaime</SelectItem>
                 </Select>
              </div>
              <div className="space-y-1">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Intervenção</Label>
                 <Select value={report.intervention_type} onValueChange={v => handleInputChange('intervention_type', v)} className="h-9 text-xs bg-slate-50 border-none rounded-xl">
                    {interventionTypes.map(t => <SelectItem key={t.id} value={t.code}>{t.name}</SelectItem>)}
                 </Select>
              </div>
           </div>

           {report.service_type === 'andaime' && (
             <div className="bg-[#1e293b] rounded-2xl p-4 text-white shadow-inner mb-4">
                <div className="grid grid-cols-3 gap-3 text-center mb-2">
                   <div><span className="text-[9px] opacity-70 block mb-1">Alt.</span><input type="number" className="w-full bg-white/10 rounded text-center text-xs p-1.5" value={report.scaffolding_height} onChange={e => handleInputChange('scaffolding_height', parseFloat(e.target.value))} /></div>
                   <div><span className="text-[9px] opacity-70 block mb-1">Larg.</span><input type="number" className="w-full bg-white/10 rounded text-center text-xs p-1.5" value={report.scaffolding_width} onChange={e => handleInputChange('scaffolding_width', parseFloat(e.target.value))} /></div>
                   <div><span className="text-[9px] opacity-70 block mb-1">Comp.</span><input type="number" className="w-full bg-white/10 rounded text-center text-xs p-1.5" value={report.scaffolding_length} onChange={e => handleInputChange('scaffolding_length', parseFloat(e.target.value))} /></div>
                </div>
                <div className="text-center pt-2 border-t border-white/10 text-xs font-bold text-green-400">
                   Volume Total: {report.scaffolding_volume} m³
                </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Início Atividade</Label>
                  <Input type="time" value={report.activity_start_time} onChange={e => handleInputChange('activity_start_time', e.target.value)} className="h-9 bg-slate-50 border-none rounded-xl text-center font-bold" />
               </div>
               <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Término Atividade</Label>
                  <Input type="time" value={report.activity_end_time} onChange={e => handleInputChange('activity_end_time', e.target.value)} className="h-9 bg-slate-50 border-none rounded-xl text-center font-bold" />
               </div>
           </div>
        </div>

        {/* Card 4: Materiais (Novo) */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl">
             <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <Package className="w-5 h-5 text-[#0f2441]" />
                <h2 className="text-sm font-black text-[#0f2441] uppercase">Materiais Aplicados</h2>
             </div>

             <div className="flex gap-2 mb-4">
                <div className="flex-1">
                    <Select 
                        value={selectedMaterial} 
                        onValueChange={setSelectedMaterial}
                        placeholder="Selecione o material..."
                        className="h-9 text-xs bg-slate-50 border-none rounded-xl"
                    >
                        {materialTypes.length === 0 && <SelectItem value="none">Nenhum material cadastrado</SelectItem>}
                        {materialTypes.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                    </Select>
                </div>
                <input 
                    placeholder="Qtd" 
                    value={materialQty} 
                    onChange={e => setMaterialQty(e.target.value)} 
                    className="w-14 bg-slate-50 border-none rounded-xl text-center text-xs font-bold outline-none"
                />
                <button 
                    onClick={handleAddMaterial}
                    className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
             </div>

             <div className="space-y-2">
                 {(!report.replaced_materials || report.replaced_materials.length === 0) ? (
                     <div className="text-center py-4 text-slate-300 text-xs italic">Nenhum material adicionado.</div>
                 ) : (
                     report.replaced_materials.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                             <span className="text-xs font-bold text-slate-700">{item.name}</span>
                             <div className="flex items-center gap-3">
                                 <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{item.quantity}</span>
                                 <button onClick={() => handleRemoveMaterial(idx)} className="text-slate-300 hover:text-red-500">
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                         </div>
                     ))
                 )}
             </div>
        </div>

        {/* Card 5: Equipe */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl">
           <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h2 className="text-sm font-black text-[#0f2441] uppercase flex items-center gap-2"><Users className="w-5 h-5" /> Equipe</h2>
              <button 
                 className="text-[10px] text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors uppercase" 
                 onClick={async () => {
                    const template = await TeamTemplate.list();
                    handleInputChange('team_members', template.map(t => ({ ...t, present: true, absence_reason: "" })));
                 }}
              >
                 Carregar Padrão
              </button>
           </div>

           <div className="space-y-2">
              {report.team_members.map((m: any, i: number) => {
                 const avatar = getAvatar(m.name);
                 return (
                     <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                {avatar ? (
                                    <img src={avatar} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-4 h-4 text-slate-400" />
                                )}
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-xs font-bold text-slate-700">{m.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{m.function}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                           <Checkbox checked={m.present} onCheckedChange={(v: boolean) => {
                              const updated = [...report.team_members];
                              updated[i].present = v;
                              handleInputChange('team_members', updated);
                           }} className="h-5 w-5 border-2 border-slate-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 mr-2" />
                           <button className="text-slate-300 hover:text-red-500 transition-colors p-1" onClick={() => handleInputChange('team_members', report.team_members.filter((_:any, idx:number)=>idx!==i))}>
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                 );
              })}
           </div>
           
           <div className="mt-4 flex gap-2">
              <input placeholder="Nome..." className="flex-1 bg-slate-50 text-xs rounded-xl px-3 outline-none border border-transparent focus:border-sky-300 transition-colors" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
              <select className="bg-slate-50 text-[10px] w-24 rounded-xl outline-none px-1" value={newMember.function} onChange={e => setNewMember({...newMember, function: e.target.value})}>
                 <option value="">Função</option>
                 {jobFunctions.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <button onClick={() => { if(newMember.name) { handleInputChange('team_members', [...report.team_members, { ...newMember, present: true }]); setNewMember({name:"", function:""}); } }} className="h-9 w-9 bg-[#0f3460] hover:bg-[#0f2441] rounded-xl text-white flex items-center justify-center shadow-md">
                 <Plus className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Card 6: Execução */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl">
           <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Trabalhos Executados</Label>
                <Textarea rows={3} value={report.work_executed} onChange={e => handleInputChange('work_executed', e.target.value)} className="bg-slate-50 border-none resize-none rounded-xl text-xs p-3" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-orange-400">Ocorrências</Label>
                <Textarea rows={2} value={report.occurrences} onChange={e => handleInputChange('occurrences', e.target.value)} className="bg-orange-50/50 border-none resize-none rounded-xl text-xs text-orange-900 placeholder:text-orange-300 p-3" />
              </div>
           </div>
        </div>

        {/* Botão WhatsApp */}
        <WhatsAppReport report={report} />

      </div>
    </div>
  );
}
