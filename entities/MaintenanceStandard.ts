
import { EntityStorage } from './Storage';
export class MaintenanceStandard {
  static async list() { return EntityStorage.list<any>('MaintenanceStandard'); }
}
