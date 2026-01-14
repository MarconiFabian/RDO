
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Clock, Wrench, AlertTriangle, CheckCircle, ClipboardList } from "lucide-react";

const COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#f97316', '#8b5cf6'];

export default function MaintenanceMetrics({ data, interventionTypes }: any) {
  const metrics = useMemo(() => {
    const total = data.length;
    const statusCount = data.reduce((acc: any, curr: any) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});
    
    const typeCount = data.reduce((acc: any, curr: any) => {
      const typeObj = interventionTypes?.find((it: any) => it.code === curr.intervention_type);
      const name = typeObj ? typeObj.name : curr.intervention_type;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      statusCount,
      typeCount: Object.entries(typeCount).map(([name, value]) => ({ name, value }))
    };
  }, [data, interventionTypes]);

  const statusData = [
    { name: "Finalizada", value: metrics.statusCount.finalizada || 0, color: '#22c55e' },
    { name: "Andamento", value: metrics.statusCount.em_andamento || 0, color: '#3b82f6' },
    { name: "Paralisada", value: metrics.statusCount.paralisada || 0, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total" value={metrics.total} icon={<Wrench className="w-4 h-4" />} />
        <MetricCard title="Finalizadas" value={metrics.statusCount.finalizada || 0} icon={<CheckCircle className="w-4 h-4 text-green-500" />} />
        <MetricCard title="Em Andamento" value={metrics.statusCount.em_andamento || 0} icon={<Clock className="w-4 h-4 text-blue-500" />} />
        <MetricCard title="Paralisadas" value={metrics.statusCount.paralisada || 0} icon={<AlertTriangle className="w-4 h-4 text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Status das Atividades</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tipos de Intervenção</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.typeCount}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const MetricCard = ({ title, value, icon }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
  </Card>
);
