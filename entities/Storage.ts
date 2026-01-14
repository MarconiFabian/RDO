
export class EntityStorage {
  static list<T>(entityName: string): T[] {
    const data = localStorage.getItem(entityName);
    return data ? JSON.parse(data) : [];
  }

  static get<T>(entityName: string, id: string): T | null {
    const list = this.list<any>(entityName);
    return list.find(item => item.id === id) || null;
  }

  static create<T>(entityName: string, data: T): T {
    const list = this.list<any>(entityName);
    const newItem = { 
      ...data, 
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(entityName, JSON.stringify([...list, newItem]));
    return newItem;
  }

  static update<T>(entityName: string, id: string, data: T): T {
    const list = this.list<any>(entityName);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`${entityName} não encontrado`);
    
    const updatedItem = { ...list[index], ...data, id, updated_at: new Date().toISOString() };
    list[index] = updatedItem;
    localStorage.setItem(entityName, JSON.stringify(list));
    return updatedItem;
  }

  static delete(entityName: string, id: string): void {
    const list = this.list<any>(entityName);
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(entityName, JSON.stringify(filtered));
  }

  static seed(entityName: string, defaults: any[]) {
    if (this.list(entityName).length === 0) {
      localStorage.setItem(entityName, JSON.stringify(defaults.map(d => ({
        ...d,
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      }))));
    }
  }
}
