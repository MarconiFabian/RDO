
import { EntityStorage } from './Storage';

export class InterventionType {
  static async list() {
    const list = EntityStorage.list<any>('InterventionType');
    if (list.length === 0) {
      const defaults = [
        { code: 'grandes_intervencoes', name: 'Grandes Intervenções' },
        { code: 'parada_eventual', name: 'Parada Eventual' },
        { code: 'gpa', name: 'GPA' },
        { code: 'briquetagem', name: 'Briquetagem' },
        { code: 'portoes_vvs', name: 'Portões VV\'s' }
      ];
      defaults.forEach(d => EntityStorage.create('InterventionType', { ...d, active: true }));
      return EntityStorage.list<any>('InterventionType');
    }
    return list;
  }
  static async get(id: string) { return EntityStorage.get<any>('InterventionType', id); }
  static async create(data: any) { return EntityStorage.create('InterventionType', data); }
  static async update(id: string, data: any) { return EntityStorage.update('InterventionType', id, data); }
  // Adicionado método delete para permitir a exclusão via interface administrativa
  static async delete(id: string) { return EntityStorage.delete('InterventionType', id); }
}
