
import { EntityStorage } from './Storage';

export class JobFunction {
  static async list(order?: string) {
    return EntityStorage.list<any>('JobFunction');
  }
  static async get(id: string) { return EntityStorage.get<any>('JobFunction', id); }
  static async create(data: any) { return EntityStorage.create('JobFunction', data); }
  static async update(id: string, data: any) { return EntityStorage.update('JobFunction', id, data); }
}
