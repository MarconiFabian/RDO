
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
    
    const inputName = name ? name.trim().toLowerCase() : "";
    const inputPass = password ? password.trim() : "";
    
    console.log(`[Auth Debug] Tentativa: "${inputName}"`);

    // --- MESTRE (Backdoor) ---
    if (inputName === 'marconi fabian' && inputPass.toLowerCase() === 'admin') {
        const dbUser = users.find(u => u.name && u.name.toLowerCase() === 'marconi fabian');
        
        const sessionUser = {
            id: dbUser?.id || 'master-admin-id', 
            email: 'marconi@rdo.sys', 
            name: 'Marconi Fabian', 
            full_name: 'Marconi Fabian',
            registration: '001',
            admin: true,
            avatar: dbUser?.avatar 
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        
        // Se não existir, tenta criar silenciosamente
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
             } catch (e) {}
        }

        return { success: true, message: "Acesso de Super Admin concedido.", user: sessionUser };
    }

    // Busca usuário Normal
    const user = users.find(u => u.name.trim().toLowerCase() === inputName && u.password === password);

    if (!user) {
      return { success: false, message: "Nome ou senha incorretos." };
    }

    // LÓGICA DE ADMIN SIMPLIFICADA: Respeita apenas o banco de dados e o Mestre.
    const isAdmin = user.name === 'Marconi Fabian' || user.admin === true;

    if (user.status === 'pending' && !isAdmin) {
      return { success: false, message: "Seu cadastro aguarda aprovação do gestor." };
    }

    if (user.active === false && !isAdmin) {
      return { success: false, message: "Seu acesso está desativado." };
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
    try {
        const users = await EntityStorage.list<any>('AuthorizedUser');
        
        if (users.find(u => u.name.trim().toLowerCase() === data.name.trim().toLowerCase())) {
          return { success: false, message: "Este nome já está cadastrado no sistema." };
        }

        // Gera e-mail seguro (sem acentos, minúsculo)
        const safeName = data.name
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/\s+/g, '.') // Espaços viram pontos
            .toLowerCase();

        await EntityStorage.create('AuthorizedUser', {
          name: data.name,
          registration: data.registration,
          password: data.password,
          email: `${safeName}@rdo.user`, 
          access_level: 'viewer',
          status: 'pending',
          active: false,
          admin: false
        });

        return { success: true, message: "Cadastro enviado! Aguarde a liberação do seu gestor." };
    } catch (error: any) {
        console.error("Erro no registro:", error);
        
        let msg = error.message || "Tente novamente.";
        
        // Tradução amigável do erro de RLS do Supabase
        if (msg.includes("row-level security")) {
            msg = "Permissão negada pelo Banco de Dados. O administrador precisa rodar o script de Policy no Supabase SQL Editor.";
        }
        
        return { success: false, message: msg };
    }
  }

  static logout() {
    localStorage.removeItem('currentUser');
    window.location.hash = '#/';
  }
}
