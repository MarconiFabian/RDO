
export class EntityStorage {
  // Retorna a lista e garante que todos tenham ID
  static list<T>(entityName: string): T[] {
    try {
      const raw = localStorage.getItem(entityName);
      if (!raw) return [];

      let data: any[] = JSON.parse(raw);
      if (!Array.isArray(data)) return [];

      let modified = false;
      // Garante que todo item tenha um ID string
      data = data.map(item => {
        if (!item.id || item.id === "undefined") {
          item.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
          modified = true;
        }
        return item;
      });

      // Se gerou IDs novos, salva imediatamente para persistir
      if (modified) {
        localStorage.setItem(entityName, JSON.stringify(data));
      }

      return data as T[];
    } catch (error) {
      console.error(`Erro ao ler ${entityName}:`, error);
      return [];
    }
  }

  static async get<T>(entityName: string, id: string): Promise<T | null> {
    const items = this.list<any>(entityName);
    return items.find(i => String(i.id) === String(id)) || null;
  }

  static async create<T>(entityName: string, data: any): Promise<T> {
    const items = this.list<any>(entityName);
    const newItem = {
      ...data,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      created_at: new Date().toISOString()
    };
    
    items.push(newItem);
    localStorage.setItem(entityName, JSON.stringify(items));
    
    // Dispara evento para atualizar a tela
    window.dispatchEvent(new Event('storage-updated'));
    return newItem as T;
  }

  static async update<T>(entityName: string, id: string, changes: any): Promise<T> {
    const items = this.list<any>(entityName);
    const index = items.findIndex(i => String(i.id) === String(id));

    if (index === -1) throw new Error("Item não encontrado");

    items[index] = { ...items[index], ...changes };
    localStorage.setItem(entityName, JSON.stringify(items));
    
    window.dispatchEvent(new Event('storage-updated'));
    return items[index] as T;
  }

  static async delete(entityName: string, id: string): Promise<void> {
    const items = this.list<any>(entityName);
    const originalLength = items.length;

    // Encontra o index exato
    const index = items.findIndex(i => String(i.id) === String(id));

    if (index !== -1) {
      // Remove 1 item na posição encontrada
      items.splice(index, 1);
      
      // Salva a nova lista
      localStorage.setItem(entityName, JSON.stringify(items));
      console.log(`[Storage] Deletado item index ${index} de ${entityName}. Novo tamanho: ${items.length}`);
      
      // Atualiza interface
      window.dispatchEvent(new Event('storage-updated'));
    } else {
      console.warn(`[Storage] Tentativa de deletar ID ${id} em ${entityName} falhou: ID não encontrado.`);
    }
    
    return Promise.resolve();
  }

  static seed(entityName: string, defaults: any[]) {
    // Apenas seed se não existir nada no localStorage para essa chave
    if (!localStorage.getItem(entityName)) {
       // Cria com IDs
       const withIds = defaults.map(d => ({
         ...d,
         id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
         created_at: new Date().toISOString()
       }));
       localStorage.setItem(entityName, JSON.stringify(withIds));
    }
  }
}
