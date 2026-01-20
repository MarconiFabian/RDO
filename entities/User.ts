
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

  static async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: any }> {
    const users = EntityStorage.list<any>('AuthorizedUser');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
      return { success: false, message: "E-mail ou senha incorretos." };
    }

    if (user.status === 'pending' && user.email !== 'marconifabiano@gmail.com') {
      return { success: false, message: "Seu acesso ainda está aguardando liberação pelo gestor." };
    }

    if (user.active === false && user.email !== 'marconifabiano@gmail.com') {
      return { success: false, message: "Seu acesso foi desativado." };
    }

    const sessionUser = {
      email: user.email.toLowerCase(),
      full_name: user.name,
      registration: user.registration,
      admin: user.email.toLowerCase() === 'marconifabiano@gmail.com'
    };

    localStorage.setItem('currentUser', JSON.stringify(sessionUser));
    return { success: true, message: "Login realizado com sucesso!", user: sessionUser };
  }

  static async register(data: any): Promise<{ success: boolean; message: string }> {
    const users = EntityStorage.list<any>('AuthorizedUser');
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, message: "Este e-mail já está cadastrado." };
    }

    EntityStorage.create('AuthorizedUser', {
      ...data,
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
