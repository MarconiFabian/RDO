
import { EntityStorage } from './Storage';

export class AuthorizedUser {
  static async list() {
    return EntityStorage.list<any>('AuthorizedUser');
  }
  static async get(id: string) { return EntityStorage.get<any>('AuthorizedUser', id); }
  static async create(data: any) { return EntityStorage.create('AuthorizedUser', data); }
  static async update(id: string, data: any) { return EntityStorage.update('AuthorizedUser', id, data); }
  static async delete(id: string) { return EntityStorage.delete('AuthorizedUser', id); }
}
