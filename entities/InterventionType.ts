
import { EntityStorage } from './Storage';

export class InterventionType {
  static async list() {
    return EntityStorage.list<any>('InterventionType');
  }
  static async get(id: string) { return EntityStorage.get<any>('InterventionType', id); }
  static async create(data: any) { return EntityStorage.create('InterventionType', data); }
  static async update(id: string, data: any) { return EntityStorage.update('InterventionType', id, data); }
  static async delete(id: string) { return EntityStorage.delete('InterventionType', id); }
}
