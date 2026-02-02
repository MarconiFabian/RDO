
import React, { useState, useEffect } from 'react';
import { SystemNotice } from '../entities/SystemNotice';
import { User } from '../entities/User';
import { Button } from '../components/ui/button';
import { ArrowLeft, Bell, CheckCircle2, Clock, Calendar, MailOpen } from 'lucide-react';
import { createPageUrl, cn } from '../utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export function NotificationsPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await User.me();
    setCurrentUser(user);
    if (!user) return;

    const all = await SystemNotice.list();
    
    // Filtra apenas notificações relevantes para este usuário
    const myNotices = all.filter((n: any) => 
        n.target_user_id === user.id || n.is_team === true
    );

    setNotices(myNotices);
    setLoading(false);
  };

  const isRead = (notice: any) => {
    return notice.read_by?.some((r: any) => r.user_id === currentUser?.id);
  };

  const getReadDate = (notice: any) => {
    const record = notice.read_by?.find((r: any) => r.user_id === currentUser?.id);
    return record ? record.read_at : null;
  };

  return (
    <div className="min-h-screen bg-[#0f2441] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] font-sans pb-10">
      
      {/* Cabeçalho */}
      <div className="pt-8 pb-6 px-6">
        <div className="flex items-center gap-4">
            <button onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-0.5">Caixa de Entrada</span>
                <h1 className="text-xl font-black text-white leading-none">Minhas Notificações</h1>
            </div>
        </div>
      </div>

      <main className="px-4 space-y-4 max-w-2xl mx-auto">
        {loading ? (
            <div className="text-center text-white/50 py-10">Carregando...</div>
        ) : notices.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Tudo Limpo</h3>
                <p className="text-slate-400 text-sm mt-1">Você não tem notificações no histórico.</p>
            </div>
        ) : (
            notices.map((notice) => {
                const read = isRead(notice);
                const readAt = getReadDate(notice);

                return (
                    <div 
                        key={notice.id} 
                        className={cn(
                            "rounded-2xl p-5 border transition-all relative overflow-hidden",
                            read 
                                ? "bg-slate-100 border-slate-200 opacity-90" 
                                : "bg-white border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                        )}
                    >
                        {/* Indicador de Status */}
                        <div className="absolute top-4 right-4">
                            {read ? (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Lida
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                                    <MailOpen className="w-3 h-3" /> Nova
                                </span>
                            )}
                        </div>

                        <div className="pr-16">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(notice.created_at), "dd/MM/yyyy HH:mm")}
                                </span>
                                <span className="text-[9px] font-bold text-slate-300">•</span>
                                <span className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 rounded">
                                    De: {notice.created_by}
                                </span>
                            </div>

                            <p className={cn("text-sm leading-relaxed mb-3", read ? "text-slate-600 font-medium" : "text-slate-900 font-bold")}>
                                {notice.message}
                            </p>

                            {notice.event_date && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 inline-flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    <div>
                                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Data do Evento</span>
                                        <span className="block text-xs font-bold text-slate-700">
                                            {format(new Date(notice.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {read && readAt && (
                                <div className="mt-3 pt-2 border-t border-slate-200/50">
                                    <p className="text-[9px] text-slate-400">
                                        Lido em: {format(new Date(readAt), "dd/MM/yyyy 'às' HH:mm")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </main>
    </div>
  );
}
