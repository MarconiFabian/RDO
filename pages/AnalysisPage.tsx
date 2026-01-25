
import React, { useState, useEffect } from 'react';
import { DailyReport } from '../entities/DailyReport';
import { InterventionType } from '../entities/InterventionType';
import { Button } from '../components/ui/button';
import { ArrowLeft, RefreshCw, BarChart2, Share2, Download } from 'lucide-react';
import { createPageUrl } from '../utils';
import MaintenanceMetrics from '../components/analytics/MaintenanceMetrics';
import DateRange from '../components/ui/date-range';
import { Card } from '../components/ui/card';

export function AnalysisPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [r, it] = await Promise.all([DailyReport.list(), InterventionType.list()]);
    setReports(r);
    setInterventionTypes(it);
  };

  const filteredReports = reports.filter(r => {
    if (!dateRange.from || !dateRange.to) return true;
    const reportDate = new Date(r.date);
    return reportDate >= dateRange.from && reportDate <= dateRange.to;
  });

  return (
    <div className="min-h-screen bg-[#0f2441] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] font-sans pb-10">
      
      {/* Header */}
      <div className="pt-8 pb-6 px-6">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white/80 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-0.5">Métricas</span>
                    <h1 className="text-xl font-black text-white leading-none">Análise de Performance</h1>
                </div>
            </div>
            <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center border border-white/10">
                <BarChart2 className="w-5 h-5 text-white" />
            </div>
        </div>

        {/* Filters Row */}
        <div className="flex gap-2 mb-2">
            <div className="flex-1 bg-[#1e3a5f] rounded-xl border border-white/10 flex items-center px-4 h-12">
               <DateRange 
                 dateRange={dateRange} 
                 setDateRange={setDateRange} 
                 className="text-white w-full border-none p-0 hover:bg-transparent" 
               />
            </div>
            <button 
                onClick={() => setDateRange({ from: null, to: null })}
                className="w-12 h-12 bg-[#1e3a5f] rounded-xl border border-white/10 flex items-center justify-center text-white/80 hover:bg-[#2d4b75] hover:text-white"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="px-4 space-y-6">
         {/* Metrics & Charts */}
         <MaintenanceMetrics data={filteredReports} interventionTypes={interventionTypes} />

         {/* Quick Actions */}
         <div className="space-y-3">
            <h3 className="text-sm font-bold text-white ml-2">Ações Rápidas</h3>
            
            <div className="bg-white rounded-2xl p-1 shadow-lg">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                            <Download className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Exportar Relatório PDF</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180" />
                </button>
                <div className="h-px bg-slate-100 mx-4"></div>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Compartilhar Dados</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180" />
                </button>
            </div>
         </div>
      </main>

      <div className="mt-10 text-center">
         <p className="text-[10px] text-white/40">RDO Online © 2025</p>
      </div>
    </div>
  );
}
