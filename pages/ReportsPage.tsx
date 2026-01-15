
import React, { useState, useEffect, useCallback } from 'react';
import { DailyReport } from '../entities/DailyReport';
import { AuthorizedUser } from '../entities/AuthorizedUser';
import { User } from '../entities/User';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  FileText, Search, Plus, History, Settings, BarChart3, Copy, Trash2, Edit2, Shield, Users
} from "lucide-react";
import { createPageUrl } from '../utils';
import { useToast } from "../components/ui/use-toast";
import WhatsAppReport from '../components/reports/WhatsAppReport';

export function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const userData = await User.me();
    setCurrentUser(userData);
    setIsAdmin(userData.admin === true);

    const allReports = await DailyReport.list();
    const visible = userData.admin === true ? allReports : allReports.filter(r => r.created_by === userData.email);
    setReports(visible.slice(0, 30));
    setFilteredReports(visible.slice(0, 30));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const searchLower = term.toLowerCase();
    const filtered = reports.filter(r =>
      r.om_number?.includes(term) ||
      r.activity_location?.toLowerCase().includes(searchLower) ||
      r.work_executed?.toLowerCase().includes(searchLower)
    );
    setFilteredReports(filtered);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este relatório?')) {
      await DailyReport.delete(id);
      toast({ title: "Excluído", description: "Relatório removido com sucesso." });
      loadData();
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "finalizada": return "bg-green-100 text-green-700 border-green-200";
      case "em_andamento": return "bg-blue-100 text-blue-700 border-blue-200";
      case "paralisada": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-blue-900 to-sky-950 pb-20">
      <header className="p-6 backdrop-blur-xl bg-sky-950/40 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Diário de Obras</h1>
              <p className="text-sky-300 text-xs font-bold uppercase tracking-widest">Painel de Lançamentos</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button onClick={() => window.location.hash = createPageUrl('DailyReport')} className="bg-white text-sky-950 hover:bg-sky-50 shadow-2xl font-bold">
              <Plus className="w-4 h-4 mr-2" /> NOVO
            </Button>
            <Button variant="outline" onClick={() => window.location.hash = createPageUrl('TeamTemplate')} className="border-white/20 text-white hover:bg-white/10">
              <Users className="w-4 h-4 mr-2" /> EQUIPE
            </Button>
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => window.location.hash = createPageUrl('Analysis')} className="border-white/20 text-white hover:bg-white/10">
                  <BarChart3 className="w-4 h-4 mr-2" /> ANÁLISE
                </Button>
                <Button variant="outline" onClick={() => window.location.hash = createPageUrl('Management')} className="border-white/20 text-white hover:bg-white/10">
                  <Shield className="w-4 h-4 mr-2" /> GESTÃO
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="bg-white/95 backdrop-blur-xl border-none shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between gap-4 bg-slate-50/50">
            <CardTitle className="text-sky-900 flex items-center gap-2 text-sm font-black uppercase">
              <History className="w-5 h-5" /> Histórico Recente
            </CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar OM ou Local..." 
                className="pl-9 bg-white border-none shadow-inner"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-sky-900">DATA</TableHead>
                    <TableHead className="font-bold text-sky-900">OM</TableHead>
                    <TableHead className="font-bold text-sky-900">LOCAL</TableHead>
                    <TableHead className="font-bold text-sky-900">STATUS</TableHead>
                    <TableHead className="text-right font-bold text-sky-900">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-slate-600">{format(new Date(r.date), "dd/MM/yy")}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-sky-700">{r.om_number}</TableCell>
                      <TableCell className="max-w-[120px] truncate font-medium">{r.activity_location}</TableCell>
                      <TableCell>
                        <Badge className={getStatusStyle(r.status)}>
                          {r.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <WhatsAppReport report={r} compact={true} />
                          <Button variant="ghost" size="icon" onClick={() => window.location.hash = createPageUrl('DailyReport', { edit: r.id })}>
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => window.location.hash = createPageUrl('DailyReport', { copy: r.id })}>
                            <Copy className="w-4 h-4 text-purple-600" />
                          </Button>
                          {(isAdmin || currentUser?.email === 'alexsandro.gabriel.ag@gmail.com') && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-0 w-full p-4 text-center text-sky-400 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md bg-sky-950/20">
        Desenvolvido por Marconi Fabian © 2025 | Beta 1.0
      </footer>
    </div>
  );
}
