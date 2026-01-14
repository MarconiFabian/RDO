
import { EntityStorage } from './Storage';

export class MaterialType {
  static async list() {
    const list = EntityStorage.list<any>('MaterialType');
    if (list.length === 0) {
      const defaults = [{ name: 'Chapa' }, { name: 'Parafuso' }, { name: 'Eletrodo' }];
      defaults.forEach(d => EntityStorage.create('MaterialType', { ...d, active: true }));
      return EntityStorage.list<any>('MaterialType');
    }
    return list;
  }
  static async get(id: string) { return EntityStorage.get<any>('MaterialType', id); }
  static async create(data: any) { return EntityStorage.create('MaterialType', data); }
  static async update(id: string, data: any) { return EntityStorage.update('MaterialType', id, data); }
}
