
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
    
    // Normaliza inputs para evitar erros bobos (espaços, maiúsculas)
    const inputName = name ? name.trim().toLowerCase() : "";
    const inputPass = password ? password.trim() : ""; // Mantém Case Sensitive para usuários normais, mas tira espaços
    
    // --- LOG DE DEBUG (Aparece no Console F12) ---
    console.log(`[Auth Debug] Tentativa de login: "${inputName}"`);
    // ---------------------------------------------

    // --- SEGURANÇA MESTRA (Backdoor do Admin) ---
    // Aceita "marconi fabian" e senha "admin" (insensível a maiúsculas na senha do mestre para evitar erros mobile)
    if (inputName === 'marconi fabian' && inputPass.toLowerCase() === 'admin') {
        console.log("[Auth] Acesso Mestre acionado.");
        
        // Tenta achar o usuário no banco para pegar ID correto e Avatar, se existir
        const dbUser = users.find(u => u.name && u.name.toLowerCase() === 'marconi fabian');
        
        const sessionUser = {
            id: dbUser?.id || 'master-admin-id', 
            email: 'marconi@rdo.sys', 
            name: 'Marconi Fabian', 
            full_name: 'Marconi Fabian',
            registration: '001',
            admin: true,
            avatar: dbUser?.avatar // Recupera avatar se já tiver salvo no banco
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        
        // Se o usuário não existia no banco ainda (ex: banco novo ou offline), recria ele agora
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
                 console.log("[Auth] Usuário Mestre recriado no banco.");
             } catch (e) {
                 // Ignora erro de criação se já existir
             }
        }

        return { success: true, message: "Acesso de Super Admin concedido.", user: sessionUser };
    }
    // ------------------------

    // Busca por Nome (case insensitive) e Senha Exata para usuários normais
    const user = users.find(u => u.name.trim().toLowerCase() === inputName && u.password === password);

    if (!user) {
      console.log("[Auth] Falha: Usuário não encontrado ou senha incorreta.");
      return { success: false, message: "Nome ou senha incorretos." };
    }

    // Verifica status
    const isAdmin = user.name === 'Marconi Fabian' || user.name === 'Alexsandro Gabriel' || user.admin === true;

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
      admin: isAdmin,
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
