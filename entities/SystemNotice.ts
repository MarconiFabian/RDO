
import { EntityStorage } from './Storage';

export interface ReadConfirmation {
  user_id: string;
  user_name: string;
  read_at: string;
}

export class SystemNotice {
  static async list() {
    let list = await EntityStorage.list<any>('SystemNotice');
    // Ordenar por data de criação (mais novos primeiro)
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async create(data: any) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Formata a mensagem conforme solicitado
    let finalMessage = data.message;
    // O prefixo será tratado no frontend para dar flexibilidade, mas salvamos aqui o autor
    
    return EntityStorage.create('SystemNotice', {
      ...data,
      read_by: [], // Array de ReadConfirmation
      created_by: user.name || 'Admin',
      created_at: new Date().toISOString()
    });
  }

  static async markAsRead(noticeId: string, user: any) {
    const notices = await this.list();
    const notice = notices.find(n => n.id === noticeId);
    
    if (notice) {
      // Remove registro de leitura anterior deste usuário (se houver) para atualizar o timestamp
      const otherReads = (notice.read_by || []).filter((r: any) => r.user_id !== user.id);
      
      const newRead: ReadConfirmation = {
        user_id: user.id,
        user_name: user.name,
        read_at: new Date().toISOString()
      };
      
      const updatedReads = [...otherReads, newRead];
      await EntityStorage.update('SystemNotice', noticeId, { read_by: updatedReads });
    }
  }

  static async delete(id: string) {
    return EntityStorage.delete('SystemNotice', id);
  }
}
