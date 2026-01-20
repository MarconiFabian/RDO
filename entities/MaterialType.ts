
import { EntityStorage } from './Storage';

export class MaterialType {
  static async list() {
    return EntityStorage.list<any>('MaterialType');
  }
  static async get(id: string) { return EntityStorage.get<any>('MaterialType', id); }
  static async create(data: any) { return EntityStorage.create('MaterialType', data); }
  static async update(id: string, data: any) { return EntityStorage.update('MaterialType', id, data); }
  static async delete(id: string) { return EntityStorage.delete('MaterialType', id); }
}
