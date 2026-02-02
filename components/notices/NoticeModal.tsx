
import React, { useState, useEffect } from 'react';
import { SystemNotice } from '../../entities/SystemNotice';
import { User } from '../../entities/User';
import { Button } from '../ui/button';
import { BellRing, Calendar, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { cn } from '../../utils';

export function NoticeModal() {
  const [pendingNotices, setPendingNotices] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkNotices();
    // Verifica periodicamente (a cada 30s) se tem novos avisos enquanto usa o app
    const interval = setInterval(checkNotices, 30000);
    // Ouve atualizações de storage (se um admin criar algo novo na mesma máquina ou sync)
    window.addEventListener('storage-updated', checkNotices);
    return () => {
        clearInterval(interval);
        window.removeEventListener('storage-updated', checkNotices);
    };
  }, []);

  const checkNotices = async () => {
    const user = await User.me();
    if (!user) return;
    setCurrentUser(user);

    const allNotices = await SystemNotice.list();
    const todayStr = new Date().toISOString().split('T')[0]; // Data de hoje YYYY-MM-DD
    
    const unread = allNotices.filter((notice: any) => {
        // Verifica se é para mim (Global ou Específico)
        const isForMe = notice.is_team || notice.target_user_id === user.id;
        if (!isForMe) return false;

        // Verifica registro de leitura
        const userReadRecord = notice.read_by?.find((r: any) => r.user_id === user.id);

        // CASO 1: Nunca li -> MOSTRA
        if (!userReadRecord) return true;

        // CASO 2: Já li, mas hoje é o dia do evento -> MOSTRA NOVAMENTE (se ainda não li hoje)
        if (notice.event_date) {
            const eventDay = new Date(notice.event_date).toISOString().split('T')[0];
            
            // Se hoje é o dia do evento
            if (todayStr === eventDay) {
                const lastReadDay = new Date(userReadRecord.read_at).toISOString().split('T')[0];
                
                // Se a última vez que li NÃO foi hoje (foi no passado), mostra de novo como lembrete
                if (lastReadDay !== todayStr) {
                    return true;
                }
            }
        }
        
        return false;
    });

    // Ordena: Eventos próximos primeiro
    unread.sort((a: any, b: any) => {
        if (a.event_date && b.event_date) return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        return 0;
    });

    setPendingNotices(unread);
    setIsOpen(unread.length > 0);
  };

  const handleConfirmRead = async (notice: any) => {
    if (!currentUser) return;
    await SystemNotice.markAsRead(notice.id, currentUser);
    
    // Remove da lista local instantaneamente para UX fluida
    const remaining = pendingNotices.filter(n => n.id !== notice.id);
    setPendingNotices(remaining);
    
    if (remaining.length === 0) {
        setIsOpen(false);
    }
  };

  if (!isOpen || pendingNotices.length === 0) return null;

  // Mostra apenas o primeiro da fila (foco total)
  const currentNotice = pendingNotices[0];
  
  // Verifica se é um "Re-aviso" do dia do evento para mudar o texto
  const isEventDayReminder = currentNotice.event_date && 
                             new Date(currentNotice.event_date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f2441]/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-500 relative animate-in zoom-in-95 duration-300">
        
        {/* Cabeçalho Chamativo */}
        <div className="bg-amber-500 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
                    <BellRing className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                    {isEventDayReminder ? "Lembrete de Hoje!" : "Comunicado Importante"}
                </h2>
                <p className="text-amber-100 text-xs font-bold uppercase mt-1">
                    Enviado por: {currentNotice.created_by}
                </p>
            </div>
        </div>

        {/* Corpo da Mensagem */}
        <div className="p-8 text-center space-y-6">
            
            {currentNotice.event_date && (
                <div className={cn(
                    "rounded-2xl p-4 border flex items-center justify-center gap-4",
                    isEventDayReminder 
                        ? "bg-red-50 border-red-200 animate-pulse" 
                        : "bg-amber-50 border-amber-100"
                )}>
                    <Calendar className={cn("w-8 h-8", isEventDayReminder ? "text-red-600" : "text-amber-600")} />
                    <div className="text-left">
                        <span className={cn("block text-[10px] font-bold uppercase", isEventDayReminder ? "text-red-500" : "text-amber-400")}>
                            {isEventDayReminder ? "É HOJE:" : "Data do Evento"}
                        </span>
                        <span className={cn("block text-lg font-black", isEventDayReminder ? "text-red-900" : "text-amber-900")}>
                            {format(new Date(currentNotice.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                    </div>
                </div>
            )}

            <div className="text-slate-800 text-lg font-medium leading-relaxed">
                "{currentNotice.message}"
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirmação de leitura obrigatória</span>
            </div>

            <Button 
                onClick={() => handleConfirmRead(currentNotice)}
                className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white text-lg font-black uppercase rounded-2xl shadow-xl shadow-amber-500/30 transition-all active:scale-95"
            >
                <CheckCircle2 className="w-6 h-6 mr-2" />
                {isEventDayReminder ? "Confirmar Presença/Leitura" : "Ciente, Confirmar."}
            </Button>
        </div>
      </div>
    </div>
  );
}