
import React, { useMemo } from 'react';
import { Card, CardContent } from "../ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Wrench, ClipboardList, CheckCircle2, AlertTriangle } from "lucide-react";

const STATUS_COLORS = {
  finalizada: '#10b981', // Emerald 500
  em_andamento: '#3b82f6', // Blue 500
  paralisada: '#ef4444' // Red 500
};

export default function MaintenanceMetrics({ data, interventionTypes }: any) {
  const stats = useMemo(() => {
    const total = data.length;
    const oms = new Set(data.map((r: any) => r.om_number)).size;
    const finished = data.filter((r: any) => r.status === 'finalizada').length;
    const paused = data.filter((r: any) => r.status === 'paralisada').length;

    const statusData = [
      { name: "Concluídas", value: finished, color: STATUS_COLORS.finalizada },
      { name: "Pendentes", value: data.filter((r: any) => r.status === 'em_andamento').length, color: STATUS_COLORS.em_andamento },
      { name: "Paradas", value: paused, color: STATUS_COLORS.paralisada }
    ];

    // GERAÇÃO DE DADOS REAIS - ÚLTIMOS 7 DIAS
    const dailyData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Filtra relatórios deste dia específico
        const dayReports = data.filter((r: any) => r.date && r.date.startsWith(dateKey));
        
        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        const nameFormatted = dayName.charAt(0).toUpperCase() + dayName.slice(1); // Ex: "Seg"

        dailyData.push({
            name: nameFormatted,
            concluidas: dayReports.filter((r: any) => r.status === 'finalizada').length,
            pendentes: dayReports.filter((r: any) => r.status === 'em_andamento').length,
            paradas: dayReports.filter((r: any) => r.status === 'paralisada').length
        });
    }

    return { total, oms, finished, paused, statusData, dailyData };
  }, [data, interventionTypes]);

  return (
    <div className="space-y-6">
      
      {/* 2x2 Grid for Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
            title="Intervenções" 
            value={stats.total} 
            icon={<Wrench className="w-5 h-5 text-blue-600" />} 
            bgIcon="bg-blue-50"
            badge={stats.total > 0 ? "Total" : null}
            badgeColor="bg-blue-100 text-blue-700"
        />
        <MetricCard 
            title="OMs Únicas" 
            value={stats.oms} 
            icon={<ClipboardList className="w-5 h-5 text-purple-600" />} 
            bgIcon="bg-purple-50"
        />
        <MetricCard 
            title="Finalizadas" 
            value={stats.finished} 
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} 
            bgIcon="bg-green-50"
            badge={stats.total > 0 ? `${Math.round((stats.finished / stats.total) * 100)}%` : "0%"}
            badgeColor="bg-green-100 text-green-700"
        />
        <MetricCard 
            title="Paralisadas" 
            value={stats.paused} 
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />} 
            bgIcon="bg-red-50"
            badge={stats.total > 0 ? `${Math.round((stats.paused / stats.total) * 100)}%` : "0%"}
            badgeColor="bg-red-100 text-red-700"
        />
      </div>

      {/* Main Chart Card */}
      <div className="bg-white rounded-[24px] p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
             <div className="border-l-4 border-[#0f2441] pl-3">
                <h3 className="text-sm font-bold text-[#0f2441]">Atividades (Últimos 7 dias)</h3>
             </div>
             {/* <button className="text-[10px] font-bold text-blue-600 uppercase">Ver Detalhes</button> */}
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="concluidas" name="Concluídas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={6} />
                <Bar dataKey="pendentes" name="Pendentes" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={6} />
                <Bar dataKey="paradas" name="Paradas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 mt-4">
              {stats.statusData.map((s:any, i:number) => (
                  <div key={i} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}}></div>
                      <span className="text-[10px] text-slate-500 font-medium">{s.name}</span>
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
}

const MetricCard = ({ title, value, icon, bgIcon, badge, badgeColor }: any) => (
  <div className="bg-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-36 relative overflow-hidden group">
    <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl ${bgIcon} flex items-center justify-center transition-transform group-hover:scale-110`}>
            {icon}
        </div>
        {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                {badge}
            </span>
        )}
    </div>
    
    <div>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{title}</h3>
        <span className="text-3xl font-black text-[#0f2441]">{value}</span>
    </div>
  </div>
);
