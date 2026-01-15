
import React, { useState, useEffect } from 'react';
import { DailyReport } from '../entities/DailyReport';
import { InterventionType } from '../entities/InterventionType';
import { JobFunction } from '../entities/JobFunction';
import { MaterialType } from '../entities/MaterialType';
import { User } from '../entities/User';
import { TeamTemplate } from '../entities/TeamTemplate';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { CustomSelect as Select, SelectItem } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  FileText, Save, Users, Plus, Hammer, Cloud, ArrowLeft, Trash2, Package, Clock, AlertTriangle
} from 'lucide-react';
import { getQueryParams, createPageUrl } from '../utils';
import { useToast } from '../components/ui/use-toast';
import WhatsAppReport from '../components/reports/WhatsAppReport';

export function DailyReportPage() {
  const [loading, setLoading] = useState(false);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [jobFunctions, setJobFunctions] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  
  const { toast } = useToast();
  const query = getQueryParams();
  const editId = query.get('edit');
  const copyId = query.get('copy');

  const [report, setReport] = useState<any>({
    name: "", registration: "", om_number: "", intervention_type: "outros",
    service_type: "eletromecânica", scaffolding_height: 0, scaffolding_width: 0,
    scaffolding_length: 0, scaffolding_volume: 0, pts_required: true,
    pts_request_time: "", pts_opening_time: "", activity_start_time: "",
    activity_end_time: "", status: "em_andamento", team_members: [],
    replaced_materials: [], date: new Date().toISOString().split('T')[0],
    work_executed: "", weather_morning: "Sol", weather_afternoon: "Sol",
    weather_night: "Limpo", occurrences: "", activity_location: "",
    pause_reason: "", pending_activities: ""
  });

  const [newMember, setNewMember] = useState({ name: "", function: "" });

  useEffect(() => {
    async function init() {
      const u = await User.me();
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
        if (existing) setReport(existing);
      } else if (copyId) {
        const original = await DailyReport.get(copyId);
        if (original) {
          const { id, created_at, updated_at, ...copyData } = original;
          setReport({ ...copyData, date: new Date().toISOString().split('T')[0] });
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

  const handleSave = async () => {
    if (!report.om_number || report.om_number.length !== 12) {
      toast({ title: "Erro de Validação", description: "A OM deve conter exatamente 12 dígitos.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (editId) await DailyReport.update(editId, report);
      else await DailyReport.create(report);
      toast({ title: "Relatório Salvo", description: "Os dados foram armazenados com sucesso." });
      window.location.hash = createPageUrl('Reports');
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar relatório.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-blue-900 to-sky-950 pb-24">
      <header className="p-6 backdrop-blur-xl bg-sky-950/40 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-white font-black uppercase tracking-tighter">
              {editId ? "Editar Relatório" : copyId ? "Copiar Relatório" : "Novo Relatório"}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={loading} className="bg-white text-sky-950 hover:bg-sky-100 font-bold shadow-2xl">
            <Save className="w-4 h-4 mr-2" /> {loading ? "SALVANDO..." : "SALVAR"}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-4 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seção 1: Identificação */}
          <Card className="bg-white/95 border-none shadow-xl">
            <CardHeader className="bg-sky-50/50 border-b border-slate-100">
              <CardTitle className="text-xs font-black text-sky-900 uppercase">1. Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Responsável</Label>
                  <Input value={report.name} readOnly className="bg-slate-50 font-bold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Matrícula</Label>
                  <Input value={report.registration} readOnly className="bg-slate-50 font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">OM (12 dígitos)</Label>
                  <Input 
                    value={report.om_number} 
                    maxLength={12} 
                    onChange={e => handleInputChange('om_number', e.target.value.replace(/\D/g, ''))} 
                    placeholder="000000000000"
                    className="font-mono text-sky-700"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Data Execução</Label>
                  <Input type="date" value={report.date} onChange={e => handleInputChange('date', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Local da Atividade</Label>
                <Input value={report.activity_location} onChange={e => handleInputChange('activity_location', e.target.value)} placeholder="Ex: Berço 102 - Torre B" />
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Serviço e Intervenção */}
          <Card className="bg-white/95 border-none shadow-xl">
            <CardHeader className="bg-sky-50/50 border-b border-slate-100">
              <CardTitle className="text-xs font-black text-sky-900 uppercase">2. Classificação</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Tipo de Serviço</Label>
                <Select value={report.service_type} onValueChange={v => handleInputChange('service_type', v)}>
                  <SelectItem value="eletromecânica">Eletromecânica</SelectItem>
                  <SelectItem value="andaime">Andaime</SelectItem>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Tipo de Intervenção</Label>
                <Select value={report.intervention_type} onValueChange={v => handleInputChange('intervention_type', v)}>
                  {interventionTypes.map(t => <SelectItem key={t.id} value={t.code}>{t.name}</SelectItem>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Status Atual</Label>
                <Select value={report.status} onValueChange={v => handleInputChange('status', v)}>
                  <SelectItem value="em_andamento">🔄 Em Andamento</SelectItem>
                  <SelectItem value="finalizada">✅ Finalizada</SelectItem>
                  <SelectItem value="paralisada">⚠️ Paralisada</SelectItem>
                </Select>
              </div>
            </CardContent>
          </Card>
        </section>

        {report.service_type === 'andaime' && (
          <Card className="bg-sky-900 text-white border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-white/10"><CardTitle className="text-xs font-black uppercase tracking-widest">Cálculo de Volume de Andaime</CardTitle></CardHeader>
            <CardContent className="pt-6 grid grid-cols-4 gap-4 items-end">
               <div className="space-y-1"><Label className="text-[10px] opacity-70">Altura (m)</Label><Input type="number" step="0.1" value={report.scaffolding_height} onChange={e => handleInputChange('scaffolding_height', parseFloat(e.target.value))} className="bg-white/10 text-white border-white/20" /></div>
               <div className="space-y-1"><Label className="text-[10px] opacity-70">Largura (m)</Label><Input type="number" step="0.1" value={report.scaffolding_width} onChange={e => handleInputChange('scaffolding_width', parseFloat(e.target.value))} className="bg-white/10 text-white border-white/20" /></div>
               <div className="space-y-1"><Label className="text-[10px] opacity-70">Comp. (m)</Label><Input type="number" step="0.1" value={report.scaffolding_length} onChange={e => handleInputChange('scaffolding_length', parseFloat(e.target.value))} className="bg-white/10 text-white border-white/20" /></div>
               <div className="bg-white text-sky-900 rounded-lg p-2 text-center font-black">
                <span className="text-[10px] block opacity-60">TOTAL</span>
                {report.scaffolding_volume} m³
               </div>
            </CardContent>
          </Card>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/95 border-none shadow-xl">
             <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-xs font-black text-sky-900 uppercase">Horários & Liberação</CardTitle></CardHeader>
             <CardContent className="pt-6 grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-bold">Solicitação PTS</Label><Input type="time" value={report.pts_request_time} onChange={e => handleInputChange('pts_request_time', e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-bold">Abertura PTS</Label><Input type="time" value={report.pts_opening_time} onChange={e => handleInputChange('pts_opening_time', e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-bold">Início Atividade</Label><Input type="time" value={report.activity_start_time} onChange={e => handleInputChange('activity_start_time', e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-bold">Término</Label><Input type="time" value={report.activity_end_time} onChange={e => handleInputChange('activity_end_time', e.target.value)} /></div>
             </CardContent>
          </Card>

          <Card className="bg-white/95 border-none shadow-xl">
             <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-xs font-black text-sky-900 uppercase">Clima no Período</CardTitle></CardHeader>
             <CardContent className="pt-6 grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Manhã</Label>
                  <Select value={report.weather_morning} onValueChange={v => handleInputChange('weather_morning', v)}>
                    <SelectItem value="Sol">☀️ Sol</SelectItem><SelectItem value="Nublado">☁️ Nublado</SelectItem><SelectItem value="Chuva">🌧️ Chuva</SelectItem>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Tarde</Label>
                  <Select value={report.weather_afternoon} onValueChange={v => handleInputChange('weather_afternoon', v)}>
                    <SelectItem value="Sol">☀️ Sol</SelectItem><SelectItem value="Nublado">☁️ Nublado</SelectItem><SelectItem value="Chuva">🌧️ Chuva</SelectItem>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Noite</Label>
                  <Select value={report.weather_night} onValueChange={v => handleInputChange('weather_night', v)}>
                    <SelectItem value="Limpo">🌌 Limpo</SelectItem><SelectItem value="Nublado">☁️ Nublado</SelectItem><SelectItem value="Chuva">🌧️ Chuva</SelectItem>
                  </Select>
                </div>
             </CardContent>
          </Card>
        </section>

        <Card className="bg-white/95 border-none shadow-xl">
          <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row justify-between items-center">
            <CardTitle className="text-xs font-black text-sky-900 uppercase">Equipe & Efetivo</CardTitle>
            <Button size="sm" variant="outline" className="text-sky-900 border-sky-200" onClick={async () => {
              const template = await TeamTemplate.list();
              handleInputChange('team_members', template.map(t => ({ ...t, present: true, absence_reason: "" })));
            }}>Carregar Padrão</Button>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.team_members.map((m: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-bold">{m.name}</TableCell>
                      <TableCell className="text-[10px] opacity-60 uppercase font-black">{m.function}</TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                           <Checkbox checked={m.present} onCheckedChange={(v: boolean) => {
                             const updated = [...report.team_members];
                             updated[i].present = v;
                             handleInputChange('team_members', updated);
                           }} />
                           <span className={m.present ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{m.present ? "Sim" : "Não"}</span>
                           {!m.present && <Input placeholder="Motivo" value={m.absence_reason} onChange={e => {
                             const updated = [...report.team_members];
                             updated[i].absence_reason = e.target.value;
                             handleInputChange('team_members', updated);
                           }} className="h-7 text-[10px] w-24" />}
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleInputChange('team_members', report.team_members.filter((_:any, idx:number)=>idx!==i))}>
                          <Trash2 className="w-4 h-4 text-red-300" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
             <div className="p-4 bg-slate-50 flex gap-2">
               <Input placeholder="Nome" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
               <Select value={newMember.function} onValueChange={v => setNewMember({...newMember, function: v})}>
                 {jobFunctions.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
               </Select>
               <Button onClick={() => {
                 if (!newMember.name) return;
                 handleInputChange('team_members', [...report.team_members, { ...newMember, present: true }]);
                 setNewMember({ name: "", function: "" });
               }}><Plus className="w-4 h-4" /></Button>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 border-none shadow-xl">
          <CardHeader className="bg-slate-50 border-b border-slate-100"><CardTitle className="text-xs font-black text-sky-900 uppercase">Execução & Observações</CardTitle></CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1"><Label className="text-[10px] font-bold">Trabalhos Executados</Label><Textarea rows={4} value={report.work_executed} onChange={e => handleInputChange('work_executed', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold">Atividades Pendentes</Label><Textarea rows={2} value={report.pending_activities} onChange={e => handleInputChange('pending_activities', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold text-orange-600">Ocorrências / Impedimentos</Label><Textarea rows={2} value={report.occurrences} onChange={e => handleInputChange('occurrences', e.target.value)} className="border-orange-100" /></div>
          </CardContent>
        </Card>

        <div className="pb-8">
           <WhatsAppReport report={report} />
        </div>
      </main>
    </div>
  );
}
