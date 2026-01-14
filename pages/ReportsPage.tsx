
import React, { useState, useEffect, useCallback } from 'react';
import { DailyReport } from '../entities/DailyReport';
import { AuthorizedUser } from '../entities/AuthorizedUser';
import { User } from '../entities/User';
import { format, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";
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
import { Label } from "../components/ui/label";
import DateRange from "../components/ui/date-range";
import { CustomSelect as Select, SelectItem } from "../components/ui/select";
import {
  FileText, Search, Plus, History, Settings, BookOpen, AlertCircle
} from "lucide-react";
import { createPageUrl } from '../utils';
import { useToast } from "../components/ui/use-toast";
import WhatsAppReport from '../components/reports/WhatsAppReport';

export function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);
      setIsAdmin(userData.admin === true);

      const allReports = await DailyReport.list();
      const users = await AuthorizedUser.list();
      setAuthorizedUsers(users.filter(u => u.active !== false));

      let visibleReports = (userData.admin === true) 
        ? allReports 
        : allReports.filter(r => r.created_by === userData.email);

      setReports(visibleReports);
      setFilteredReports(visibleReports);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterReports(term, userFilter);
  };

  const handleUserFilter = (value: string) => {
    setUserFilter(value);
    filterReports(searchTerm, value);
  };

  const filterReports = (search: string, user: string) => {
    let filtered = [...reports];
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r =>
        (r.name && r.name.toLowerCase().includes(searchLower)) ||
        (r.om_number && r.om_number.includes(search)) ||
        (r.activity_location && r.activity_location.toLowerCase().includes(searchLower))
      );
    }
    if (user && user !== "all") {
      filtered = filtered.filter(r => r.created_by === user);
    }
    setFilteredReports(filtered);
  };

  const handleCheckMissingReports = () => {
    if (!dateRange.from || !dateRange.to) {
      toast({ title: "Atenção", description: "Selecione um período para verificar.", variant: "warning" });
      return;
    }

    const interval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const missingData: any[] = [];

    authorizedUsers.forEach(authUser => {
      const userReports = reports.filter(r => r.created_by === authUser.email);
      const missingDays = interval.filter(day => 
        !userReports.some(r => isSameDay(new Date(r.date), day))
      );
      
      if (missingDays.length > 0) {
        missingData.push({ 
          user: authUser.name || authUser.email, 
          days: missingDays.map(d => format(d, 'dd/MM')) 
        });
      }
    });

    if (missingData.length > 0) {
      const detail = missingData.map(m => `${m.user}: ${m.days.join(', ')}`).join(' | ');
      toast({ title: "Datas Sem Relatório", description: detail });
    } else {
      toast({ title: "Tudo em dia!", description: "Todos os usuários enviaram relatórios no período." });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finalizada": return "bg-green-100 text-green-800 border-green-200";
      case "em_andamento": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-sky-900 text-white p-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Painel Diário de Obras</h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <Button onClick={() => window.location.hash = createPageUrl('DailyReport')} className="bg-white text-sky-900 hover:bg-sky-50 whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> Novo Relatório
            </Button>
            <Button variant="outline" onClick={() => window.location.hash = createPageUrl('Resources')} className="text-white border-white/20 hover:bg-white/10 whitespace-nowrap">
              <BookOpen className="w-4 h-4 mr-2" /> Recursos
            </Button>
            {isAdmin && (
              <Button variant="outline" onClick={() => window.location.hash = createPageUrl('Management')} className="text-white border-white/20 hover:bg-white/10 whitespace-nowrap">
                <Settings className="w-4 h-4 mr-2" /> Gestão
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CardTitle className="text-slate-700 flex items-center">
                <History className="w-5 h-5 mr-2" /> Histórico de Lançamentos
              </CardTitle>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar OM, Local ou Nome..." 
                    className="pl-9 w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                {isAdmin && (
                  <Select value={userFilter} onValueChange={handleUserFilter}>
                    <SelectItem value="all">Todos os Usuários</SelectItem>
                    {authorizedUsers.map(u => (
                      <SelectItem key={u.email} value={u.email}>{u.name || u.email}</SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>OM</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                        Nenhum relatório encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium whitespace-nowrap">{format(new Date(r.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-mono text-xs">{r.om_number}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{r.activity_location}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(r.status)}>
                            {r.status === 'finalizada' ? 'Finalizada' : r.status === 'em_andamento' ? 'Andamento' : 'Paralisada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <WhatsAppReport report={r} compact={true} />
                            <Button variant="ghost" size="icon" onClick={() => window.location.hash = createPageUrl('DailyReport', { edit: r.id })}>
                              <Plus className="w-4 h-4 text-sky-700" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="bg-orange-50 border-orange-100 overflow-hidden">
            <div className="bg-orange-100/50 p-4 border-b border-orange-100">
              <h3 className="text-orange-900 font-bold flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" /> AUDITORIA: DATAS SEM RELATÓRIO
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                  <Label className="text-orange-800 mb-2 block">Selecione o Período para Cruzamento</Label>
                  <DateRange dateRange={dateRange} setDateRange={setDateRange} />
                </div>
                <Button onClick={handleCheckMissingReports} className="bg-orange-600 hover:bg-orange-700 text-white w-full md:w-auto shadow-sm">
                  Verificar Pendências
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
