
import { EntityStorage } from './Storage';

export class TeamTemplate {
  static async list(order?: string) {
    return EntityStorage.list<any>('TeamTemplate');
  }
  static async get(id: string) { return EntityStorage.get<any>('TeamTemplate', id); }
  static async create(data: any) { return EntityStorage.create('TeamTemplate', data); }
  static async update(id: string, data: any) { return EntityStorage.update('TeamTemplate', id, data); }
}
