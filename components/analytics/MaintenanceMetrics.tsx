
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Clock, Wrench, AlertTriangle, CheckCircle, ClipboardList, TrendingUp } from "lucide-react";

const STATUS_COLORS = {
  finalizada: '#22c55e',
  em_andamento: '#3b82f6',
  paralisada: '#ef4444'
};

const CHART_COLORS = ['#0e7490', '#0369a1', '#0284c7', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

export default function MaintenanceMetrics({ data, interventionTypes }: any) {
  const stats = useMemo(() => {
    const total = data.length;
    const oms = new Set(data.map((r: any) => r.om_number)).size;
    
    const statusData = [
      { name: "Finalizada", value: data.filter((r: any) => r.status === 'finalizada').length, color: STATUS_COLORS.finalizada },
      { name: "Andamento", value: data.filter((r: any) => r.status === 'em_andamento').length, color: STATUS_COLORS.em_andamento },
      { name: "Paralisada", value: data.filter((r: any) => r.status === 'paralisada').length, color: STATUS_COLORS.paralisada }
    ].filter(d => d.value > 0);

    const typeDist = data.reduce((acc: any, curr: any) => {
      const it = interventionTypes.find((t: any) => t.code === curr.intervention_type);
      const name = it ? it.name : curr.intervention_type;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    const typeData = Object.entries(typeDist).map(([name, value]) => ({ name, value }));

    return { total, oms, statusData, typeData };
  }, [data, interventionTypes]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Intervenções" value={stats.total} icon={<Wrench className="w-4 h-4" />} color="text-sky-400" />
        <MetricCard title="OMs Únicas" value={stats.oms} icon={<ClipboardList className="w-4 h-4" />} color="text-blue-400" />
        <MetricCard title="Finalizadas" value={data.filter((r:any)=>r.status==='finalizada').length} icon={<CheckCircle className="w-4 h-4" />} color="text-green-400" />
        <MetricCard title="Paralisadas" value={data.filter((r:any)=>r.status==='paralisada').length} icon={<AlertTriangle className="w-4 h-4" />} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/95 backdrop-blur-xl border-none shadow-2xl">
          <CardHeader><CardTitle className="text-sky-900">Status das Atividades</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {stats.statusData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-xl border-none shadow-2xl">
          <CardHeader><CardTitle className="text-sky-900">Distribuição por Intervenção</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Bar dataKey="value" fill="#0c4a6e" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const MetricCard = ({ title, value, icon, color }: any) => (
  <Card className="bg-white/95 backdrop-blur-xl border-none shadow-xl transition-all hover:scale-105">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-tighter">{title}</CardTitle>
      <div className={`${color}`}>{icon}</div>
    </CardHeader>
    <CardContent><div className="text-2xl font-bold text-sky-900">{value}</div></CardContent>
  </Card>
);
