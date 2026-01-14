
import { EntityStorage } from './Storage';

export class DailyReport {
  static async list(order: string = '-date') {
    let list = EntityStorage.list<any>('DailyReport');
    if (order.startsWith('-')) {
      const field = order.substring(1);
      list.sort((a, b) => new Date(b[field]).getTime() - new Date(a[field]).getTime());
    }
    return list;
  }

  static async get(id: string) {
    return EntityStorage.get<any>('DailyReport', id);
  }

  static async create(data: any) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return EntityStorage.create('DailyReport', { 
      ...data, 
      created_by: user.email,
      created_at: new Date().toISOString() 
    });
  }

  static async update(id: string, data: any) {
    return EntityStorage.update('DailyReport', id, data);
  }

  static async delete(id: string) {
    return EntityStorage.delete('DailyReport', id);
  }
}
