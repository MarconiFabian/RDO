
import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Check, Copy, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { InterventionType } from "../../entities/InterventionType";

export default function WhatsAppReport({ report, compact = false }: any) {
  const [copied, setCopied] = useState(false);
  const [interventionTypeName, setInterventionTypeName] = useState("Outros");

  useEffect(() => {
    async function loadType() {
      if (report?.intervention_type) {
        const types = await InterventionType.list();
        const found = types.find(t => t.code === report.intervention_type);
        setInterventionTypeName(found ? found.name : report.intervention_type);
      }
    }
    loadType();
  }, [report]);

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "finalizada": return "✅";
      case "em_andamento": return "🔄";
      case "paralisada": return "⚠️";
      default: return "ℹ️";
    }
  };

  const getSafeDate = (dateStr: any) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date();
      return d;
    } catch {
      return new Date();
    }
  };

  const formatMessage = () => {
    if (!report) return "";
    const reportDate = getSafeDate(report.date || new Date());
    const serviceType = report.service_type === "andaime" ? "🏗️ Andaime" : "⚙️ Eletromecânica";
    const scaffoldingInfo = report.service_type === "andaime" ? `\n📏 *Volume:* ${report.scaffolding_volume || 0} m³` : "";
    
    // Identificador OM ou Projeto
    const idLabel = report.om_type === 'projeto' ? '🏗️ *Projeto:*' : '📝 *OM:*';
    
    let teamInfo = "";
    if (report.team_members && report.team_members.length > 0) {
      const present = report.team_members.filter((m: any) => m.present !== false);
      const absent = report.team_members.filter((m: any) => m.present === false);
      teamInfo += `\n\n👥 *EQUIPE:*`;
      if (present.length > 0) {
        teamInfo += `\n✅ *Presentes:* ${present.length}`;
        present.forEach((m: any) => teamInfo += `\n • ${m.name} (${m.function})`);
      }
      if (absent.length > 0) {
        teamInfo += `\n❌ *Ausentes:* ${absent.length}`;
        absent.forEach((m: any) => teamInfo += `\n • ${m.name}${m.absence_reason ? ` (${m.absence_reason})` : ''}`);
      }
    }

    let materialsInfo = "";
    if (report.replaced_materials && report.replaced_materials.length > 0) {
        materialsInfo += `\n\n📦 *MATERIAIS APLICADOS:*`;
        report.replaced_materials.forEach((m: any) => {
            materialsInfo += `\n • ${m.name}: ${m.quantity}`;
        });
    }

    return `*📋 RDO ONLINE - RELATÓRIO DIÁRIO*\n` +
           `------------------------------------------\n` +
           `📅 *Data de Execução:* ${format(reportDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })}\n` +
           `👤 *Responsável:* ${report.name || ""}\n` +
           `🔢 *Matrícula:* ${report.registration || ""}\n` +
           `${idLabel} ${report.om_number || ""}\n` +
           `📍 *Local:* ${report.activity_location || ""}\n\n` +
           `🔧 *Serviço:* ${serviceType}\n` +
           `🔧 *Intervenção:* ${interventionTypeName}\n` +
           `${getStatusEmoji(report.status)} *Status:* ${report.status?.toUpperCase()}\n` +
           scaffoldingInfo + 
           `\n\n⏰ *Horários:* ${report.activity_start_time || "N/A"} às ${report.activity_end_time || "N/A"}` +
           teamInfo + 
           materialsInfo +
           (report.work_executed ? `\n\n📝 *TRABALHOS EXECUTADOS:*\n${report.work_executed}` : "") +
           `\n\n🌡️ *CLIMA:* M: ${report.weather_morning || "N/A"} | T: ${report.weather_afternoon || "N/A"} | N: ${report.weather_night || "N/A"}` +
           (report.occurrences ? `\n\n⚠️ *OCORRÊNCIAS:*\n${report.occurrences}` : "");
  };

  const handleCopy = async (e: any) => {
    if (e) e.stopPropagation();
    try {
      const msg = formatMessage();
      
      // 1. Copia para a área de transferência
      await navigator.clipboard.writeText(msg);
      
      // 2. Feedback visual
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
      
      // Removida a abertura automática do WhatsApp conforme solicitado.
      // O usuário irá colar manualmente.

    } catch (err) {
      alert('Erro ao copiar mensagem');
    }
  };

  return (
    <Button
      variant={compact ? "outline" : "primary"}
      size={compact ? "sm" : "md"}
      onClick={handleCopy}
      className={compact 
        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
        : "bg-green-600 hover:bg-green-700 text-white font-bold w-full transition-all active:scale-95"}
    >
      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
      {copied ? "Copiado! Cole no WhatsApp" : (compact ? "Copiar" : "Copiar Relatório")}
    </Button>
  );
}
