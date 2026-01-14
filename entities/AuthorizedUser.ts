
import { EntityStorage } from './Storage';

export class AuthorizedUser {
  static async list() {
    const list = EntityStorage.list<any>('AuthorizedUser');
    if (list.length === 0) {
      // Default authorized users
      const defaults = [
        { email: "marconifabiano@gmail.com", name: "Marconi Fabian", active: true, access_level: 'admin' },
        { email: "alexsandro.gabriel.ag@gmail.com", name: "Alexsandro Gabriel", active: true, access_level: 'viewer' }
      ];
      defaults.forEach(d => EntityStorage.create('AuthorizedUser', d));
      return EntityStorage.list<any>('AuthorizedUser');
    }
    return list;
  }

  static async get(id: string) { return EntityStorage.get<any>('AuthorizedUser', id); }
  static async create(data: any) { return EntityStorage.create('AuthorizedUser', data); }
  static async update(id: string, data: any) { return EntityStorage.update('AuthorizedUser', id, data); }
  static async delete(id: string) { return EntityStorage.delete('AuthorizedUser', id); }
}
