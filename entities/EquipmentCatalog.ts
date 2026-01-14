
import { EntityStorage } from './Storage';
export class EquipmentCatalog {
  static async list() { return EntityStorage.list<any>('EquipmentCatalog'); }
}
