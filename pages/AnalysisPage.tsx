
import React, { useState, useEffect } from 'react';
import { DailyReport } from '../entities/DailyReport';
import { InterventionType } from '../entities/InterventionType';
import { User } from '../entities/User';
import MaintenanceMetrics from '../components/analytics/MaintenanceMetrics';
import { Button } from '../components/ui/button';
import { ArrowLeft, BarChart3, RotateCcw } from 'lucide-react';
import { createPageUrl } from '../utils';
import DateRange from '../components/ui/date-range';

export function AnalysisPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await User.me();
    setIsAdmin(u.admin === true);
    const [r, it] = await Promise.all([
      DailyReport.list(),
      InterventionType.list()
    ]);
    setReports(r);
    setInterventionTypes(it);
  };

  const filteredReports = reports.filter(r => {
    if (!dateRange.from || !dateRange.to) return true;
    const reportDate = new Date(r.date);
    return reportDate >= dateRange.from && reportDate <= dateRange.to;
  });

  const clearFilters = () => {
    setDateRange({ from: null, to: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-950 to-blue-900 pb-12">
      <header className="p-6 text-white border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-sky-950/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button variant="ghost" onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2 uppercase tracking-wider">
              <BarChart3 className="w-6 h-6" /> Análise de Performance
            </h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            <DateRange 
              dateRange={dateRange} 
              setDateRange={setDateRange} 
              className="flex-1 md:w-64 text-white border-white/20 bg-white/5" 
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={clearFilters} 
              className="text-white border-white/20 hover:bg-white/10"
              title="Limpar filtros"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <MaintenanceMetrics data={filteredReports} interventionTypes={interventionTypes} />
      </main>
    </div>
  );
}
