
import React, { useState, useEffect } from 'react';
import { DailyReport } from '../entities/DailyReport';
import { InterventionType } from '../entities/InterventionType';
import { JobFunction } from '../entities/JobFunction';
import { MaterialType } from '../entities/MaterialType';
import { User } from '../entities/User';
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
  FileText, Save, Users, Plus, Hammer, Cloud, ArrowLeft, Trash2, Package, Clock
} from 'lucide-react';
import { getQueryParams, createPageUrl } from '../utils';
import { useToast } from '../components/ui/use-toast';
import WhatsAppReport from '../components/reports/WhatsAppReport';

export function DailyReportPage() {
  const [activeTab, setActiveTab] = useState("report");
  const [loading, setLoading] = useState(false);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [jobFunctions, setJobFunctions] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  
  const { toast } = useToast();
  const query = getQueryParams();
  const editId = query.get('edit');

  const [report, setReport] = useState<any>({
    name: "",
    registration: "",
    om_number: "",
    intervention_type: "outros",
    service_type: "eletromecânica",
    scaffolding_height: 0,
    scaffolding_width: 0,
    scaffolding_length: 0,
    scaffolding_volume: 0,
    pts_required: true,
    pts_request_time: "",
    pts_opening_time: "",
    activity_start_time: "",
    activity_end_time: "",
    status: "em_andamento",
    team_members: [],
    replaced_materials: [],
    date: new Date().toISOString().split('T')[0],
    work_executed: "",
    weather_morning: "Sol",
    weather_afternoon: "Sol",
    weather_night: "Limpo",
    occurrences: "",
    activity_location: "",
    pause_reason: "",
    pending_activities: ""
  });

  const [newMember, setNewMember] = useState({ name: "", function: "" });
  const [newMaterial, setNewMaterial] = useState({ type: "", quantity: 0 });

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
      } else {
        setReport(prev => ({ ...prev, name: u.full_name }));
      }
    }
    init();
  }, [editId]);

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
      toast({ title: "Erro", description: "OM deve ter 12 dígitos.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (editId) await DailyReport.update(editId, report);
      else await DailyReport.create(report);
      toast({ title: "Sucesso", description: "Relatório salvo no banco local." });
      window.location.hash = createPageUrl('Reports');
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-sky-900 text-white p-6 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold uppercase tracking-tight">{editId ? "Editar Diário" : "Novo Diário"}</h1>
          </div>
          <Button onClick={handleSave} disabled={loading} className="bg-white text-sky-900 hover:bg-sky-50 font-bold">
            <Save className="w-4 h-4 mr-2" /> {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border grid grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="report" className="gap-2"><FileText className="w-4 h-4" /> Geral</TabsTrigger>
            <TabsTrigger value="team" className="gap-2"><Users className="w-4 h-4" /> Equipe</TabsTrigger>
            <TabsTrigger value="materials" className="gap-2"><Package className="w-4 h-4" /> Materiais</TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-sm">Dados da OM</CardTitle></CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>OM (12 dígitos)</Label><Input value={report.om_number} maxLength={12} onChange={e => handleInputChange('om_number', e.target.value.replace(/\D/g, ''))} /></div>
                    <div className="space-y-1"><Label>Local da Obra</Label><Input value={report.activity_location} onChange={e => handleInputChange('activity_location', e.target.value)} /></div>
                    <div className="space-y-1">
                      <Label>Intervenção</Label>
                      <Select value={report.intervention_type} onValueChange={v => handleInputChange('intervention_type', v)}>
                        {interventionTypes.map(t => <SelectItem key={t.id} value={t.code}>{t.name}</SelectItem>)}
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Data</Label><Input type="date" value={report.date} onChange={e => handleInputChange('date', e.target.value)} /></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-sm">Execução e Status</CardTitle></CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1"><Label>Serviço</Label><Select value={report.service_type} onValueChange={v => handleInputChange('service_type', v)}><SelectItem value="eletromecânica">Eletromecânica</SelectItem><SelectItem value="andaime">Andaime</SelectItem></Select></div>
                      <div className="space-y-1"><Label>Status</Label><Select value={report.status} onValueChange={v => handleInputChange('status', v)}><SelectItem value="em_andamento">Em Andamento</SelectItem><SelectItem value="finalizada">Finalizada</SelectItem><SelectItem value="paralisada">Paralisada</SelectItem></Select></div>
                    </div>
                    {report.service_type === 'andaime' && (
                      <div className="p-4 bg-sky-50 rounded-lg border border-sky-100 grid grid-cols-4 gap-2 items-end">
                        <div className="space-y-1"><Label className="text-[10px]">Alt (m)</Label><Input type="number" value={report.scaffolding_height} onChange={e => handleInputChange('scaffolding_height', parseFloat(e.target.value))} /></div>
                        <div className="space-y-1"><Label className="text-[10px]">Lar (m)</Label><Input type="number" value={report.scaffolding_width} onChange={e => handleInputChange('scaffolding_width', parseFloat(e.target.value))} /></div>
                        <div className="space-y-1"><Label className="text-[10px]">Comp (m)</Label><Input type="number" value={report.scaffolding_length} onChange={e => handleInputChange('scaffolding_length', parseFloat(e.target.value))} /></div>
                        <div className="bg-sky-900 text-white rounded font-bold h-9 flex items-center justify-center text-xs">{report.scaffolding_volume}m³</div>
                      </div>
                    )}
                    <div className="space-y-1"><Label>Trabalhos Executados</Label><Textarea rows={4} value={report.work_executed} onChange={e => handleInputChange('work_executed', e.target.value)} /></div>
                    <div className="space-y-1"><Label>Atividades Pendentes</Label><Textarea rows={2} value={report.pending_activities} onChange={e => handleInputChange('pending_activities', e.target.value)} /></div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-sm">Horários</CardTitle></CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label className="text-xs">PTS Solic.</Label><Input type="time" value={report.pts_request_time} onChange={e => handleInputChange('pts_request_time', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">PTS Abert.</Label><Input type="time" value={report.pts_opening_time} onChange={e => handleInputChange('pts_opening_time', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Ativ. Início</Label><Input type="time" value={report.activity_start_time} onChange={e => handleInputChange('activity_start_time', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Ativ. Fim</Label><Input type="time" value={report.activity_end_time} onChange={e => handleInputChange('activity_end_time', e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-sm">Clima</CardTitle></CardHeader>
                  <CardContent className="pt-4 grid grid-cols-3 gap-2">
                    <div className="space-y-1"><Label className="text-[10px]">Manhã</Label><Input value={report.weather_morning} onChange={e => handleInputChange('weather_morning', e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-[10px]">Tarde</Label><Input value={report.weather_afternoon} onChange={e => handleInputChange('weather_afternoon', e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-[10px]">Noite</Label><Input value={report.weather_night} onChange={e => handleInputChange('weather_night', e.target.value)} /></div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-100">
                  <CardHeader><CardTitle className="text-amber-800 text-sm">Ocorrências</CardTitle></CardHeader>
                  <CardContent><Textarea className="bg-white" value={report.occurrences} onChange={e => handleInputChange('occurrences', e.target.value)} /></CardContent>
                </Card>
                
                <WhatsAppReport report={report} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6 animate-in fade-in">
            <Card>
              <CardHeader><CardTitle className="text-lg">Controle de Efetivo</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Input placeholder="Nome Completo" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                  <Select value={newMember.function} onValueChange={v => setNewMember({...newMember, function: v})}>
                    {jobFunctions.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                  </Select>
                  <Button onClick={() => {
                    if (!newMember.name) return;
                    handleInputChange('team_members', [...report.team_members, { ...newMember, present: true, absence_reason: "" }]);
                    setNewMember({ name: "", function: "" });
                  }} className="bg-sky-900 text-white"><Plus className="w-4 h-4 mr-2" /> Add</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Motivo Falta</TableHead>
                      <TableHead className="text-right">Remover</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.team_members.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Nenhum membro adicionado.</TableCell></TableRow>
                    ) : (
                      report.team_members.map((m: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="text-slate-500 text-xs">{m.function}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={m.present} onCheckedChange={(v) => {
                                const updated = [...report.team_members];
                                updated[i].present = v;
                                handleInputChange('team_members', updated);
                              }} />
                              <span className={m.present ? "text-green-600 font-bold" : "text-red-500"}>{m.present ? "Presente" : "Ausente"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {!m.present && (
                              <Input 
                                placeholder="Por que faltou?" 
                                value={m.absence_reason} 
                                onChange={e => {
                                  const updated = [...report.team_members];
                                  updated[i].absence_reason = e.target.value;
                                  handleInputChange('team_members', updated);
                                }}
                                className="h-8 text-xs"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleInputChange('team_members', report.team_members.filter((_:any, idx:number) => idx !== i))}>
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
          </TabsContent>

          <TabsContent value="materials" className="space-y-6 animate-in fade-in">
            <Card>
              <CardHeader><CardTitle className="text-lg">Materiais Trocados / Utilizados</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Select value={newMaterial.type} onValueChange={v => setNewMaterial({...newMaterial, type: v})}>
                    {materialTypes.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </Select>
                  <Input type="number" placeholder="Qtd" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: parseInt(e.target.value)})} />
                  <Button onClick={() => {
                    if (!newMaterial.type) return;
                    handleInputChange('replaced_materials', [...report.replaced_materials, { ...newMaterial }]);
                    setNewMaterial({ type: "", quantity: 0 });
                  }} className="bg-sky-900 text-white"><Hammer className="w-4 h-4 mr-2" /> Lançar</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.replaced_materials.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">Nenhum material lançado.</TableCell></TableRow>
                    ) : (
                      report.replaced_materials.map((m: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{m.type}</TableCell>
                          <TableCell>{m.quantity} unidades</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleInputChange('replaced_materials', report.replaced_materials.filter((_:any, idx:number) => idx !== i))}>
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
