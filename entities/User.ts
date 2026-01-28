
import { EntityStorage } from './Storage';

export class User {
  static async me() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  }

  static async login(name: string, password: string): Promise<{ success: boolean; message: string; user?: any }> {
    // Busca usuários do banco (Online ou Local)
    const users = await EntityStorage.list<any>('AuthorizedUser');
    
    // --- SEGURANÇA MESTRA ---
    // Garante acesso ao Super Admin mesmo se o banco estiver vazio ou com erro de conexão
    if (name === 'Marconi Fabian' && password === 'admin') {
        const dbUser = users.find(u => u.name === name);
        
        const sessionUser = {
            id: dbUser?.id || 'master-admin-id', // Usa o ID do banco se existir, senão usa um fixo
            email: 'marconi@rdo.sys', 
            name: 'Marconi Fabian', 
            full_name: 'Marconi Fabian',
            registration: '001',
            admin: true,
            avatar: dbUser?.avatar // Recupera avatar se já tiver salvo no banco
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        
        // Se o usuário não existia no banco ainda, vamos forçar a criação agora para garantir persistência futura
        if (!dbUser) {
             try {
                 await EntityStorage.create('AuthorizedUser', { 
                    email: 'marconi@rdo.sys',
                    name: 'Marconi Fabian', 
                    password: 'admin', 
                    registration: '001',
                    active: true, 
                    status: 'active',
                    access_level: 'admin',
                    admin: true
                 });
             } catch (e) {
                 console.error("Tentativa de criar admin no background falhou, mas login foi permitido.", e);
             }
        }

        return { success: true, message: "Acesso de Super Admin concedido (Modo de Segurança).", user: sessionUser };
    }
    // ------------------------

    // Busca por Nome (case insensitive) e Senha para usuários normais
    const user = users.find(u => u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.password === password);

    if (!user) {
      return { success: false, message: "Nome ou senha incorretos." };
    }

    // Verifica status
    const isAdmin = user.name === 'Marconi Fabian' || user.name === 'Alexsandro Gabriel';

    if (user.status === 'pending' && !isAdmin) {
      return { success: false, message: "Seu acesso ainda está aguardando liberação pelo gestor." };
    }

    if (user.active === false && !isAdmin) {
      return { success: false, message: "Seu acesso foi desativado." };
    }

    const sessionUser = {
      id: user.id,
      email: user.email || 'no-email', 
      name: user.name, 
      full_name: user.name,
      registration: user.registration,
      admin: isAdmin || user.admin === true,
      avatar: user.avatar
    };

    localStorage.setItem('currentUser', JSON.stringify(sessionUser));
    return { success: true, message: "Login realizado com sucesso!", user: sessionUser };
  }

  static async register(data: any): Promise<{ success: boolean; message: string }> {
    const users = await EntityStorage.list<any>('AuthorizedUser');
    
    if (users.find(u => u.name.trim().toLowerCase() === data.name.trim().toLowerCase())) {
      return { success: false, message: "Este nome já está cadastrado." };
    }

    await EntityStorage.create('AuthorizedUser', {
      ...data,
      email: `${data.name.replace(/\s+/g, '.').toLowerCase()}@rdo.user`, 
      access_level: 'viewer',
      status: 'pending',
      active: false
    });

    return { success: true, message: "Cadastro realizado! Solicite ao seu gestor para liberar seu acesso." };
  }

  static logout() {
    localStorage.removeItem('currentUser');
    window.location.hash = '#/';
  }
}
