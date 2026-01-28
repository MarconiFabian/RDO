
import { createClient } from '@supabase/supabase-js';

// Helper seguro para ler variáveis de ambiente sem quebrar se import.meta.env não existir
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    const env = import.meta.env;
    return env ? env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Configuração do Cliente Supabase
// Se as variáveis não existirem (ex: rodando local sem setup), ele fica nulo e usamos LocalStorage
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_KEY');

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Mapeamento de Nomes das Entidades para Tabelas do Banco de Dados
const TABLE_MAP: Record<string, string> = {
  'AuthorizedUser': 'authorized_users',
  'DailyReport': 'daily_reports',
  'MaterialType': 'material_types',
  'InterventionType': 'intervention_types',
  'JobFunction': 'job_functions',
  'TeamTemplate': 'team_templates',
  'MaintenanceStandard': 'maintenance_standards',
  'EquipmentCatalog': 'equipment_catalog'
};

export class EntityStorage {

  // Método auxiliar para saber se estamos rodando na nuvem ou local
  static isOnline(): boolean {
    return !!supabase;
  }
  
  // Lista todos os itens (Agora é 100% Async)
  static async list<T>(entityName: string): Promise<T[]> {
    // Modo Online (Supabase)
    if (supabase) {
      const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
          // Se der erro (ex: tabela não existe), retornamos array vazio mas logamos o erro
          console.warn(`Supabase Warning (${entityName}): Verifique se a tabela '${tableName}' foi criada no banco.`, error.message);
          return [];
        }
        return data as T[];
      } catch (err) {
        console.error("Erro conexão Supabase:", err);
        return [];
      }
    }

    // Modo Offline (LocalStorage)
    try {
      const raw = localStorage.getItem(entityName);
      if (!raw) return [];
      let data: any[] = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      
      // Garante IDs no localstorage
      let modified = false;
      data = data.map(item => {
        if (!item.id) {
          item.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
          modified = true;
        }
        return item;
      });
      if (modified) localStorage.setItem(entityName, JSON.stringify(data));
      
      return data as T[];
    } catch (error) {
      return [];
    }
  }

  static async get<T>(entityName: string, id: string): Promise<T | null> {
    if (supabase) {
      const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
      const { data } = await supabase.from(tableName).select('*').eq('id', id).single();
      return data as T;
    }

    const items = await this.list<any>(entityName);
    return items.find(i => String(i.id) === String(id)) || null;
  }

  static async create<T>(entityName: string, data: any): Promise<T> {
    const newItem = {
      ...data,
      // Se for Supabase, deixamos ele gerar o ID (ou geramos UUID se necessário), 
      // mas para compatibilidade mantemos geração de string ID se não vier
      id: data.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
      const { data: created, error } = await supabase.from(tableName).insert([newItem]).select().single();
      
      if (error) {
        console.error("Erro ao criar no Supabase:", error);
        throw error;
      }
      
      window.dispatchEvent(new Event('storage-updated'));
      return created as T;
    }

    // LocalStorage Logic
    const items = await this.list<any>(entityName);
    items.push(newItem);
    localStorage.setItem(entityName, JSON.stringify(items));
    window.dispatchEvent(new Event('storage-updated'));
    return newItem as T;
  }

  static async update<T>(entityName: string, id: string, changes: any): Promise<T> {
    if (supabase) {
      const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
      const { data: updated, error } = await supabase.from(tableName).update(changes).eq('id', id).select().single();
      
      if (error) {
         console.error("Erro update Supabase:", error);
         throw error;
      }
      
      window.dispatchEvent(new Event('storage-updated'));
      return updated as T;
    }

    const items = await this.list<any>(entityName);
    const index = items.findIndex(i => String(i.id) === String(id));
    if (index === -1) throw new Error("Item não encontrado");

    items[index] = { ...items[index], ...changes };
    localStorage.setItem(entityName, JSON.stringify(items));
    window.dispatchEvent(new Event('storage-updated'));
    return items[index] as T;
  }

  static async delete(entityName: string, id: string): Promise<void> {
    if (supabase) {
      const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) console.error("Erro delete Supabase:", error);
      
      window.dispatchEvent(new Event('storage-updated'));
      return;
    }

    const items = await this.list<any>(entityName);
    const index = items.findIndex(i => String(i.id) === String(id));

    if (index !== -1) {
      items.splice(index, 1);
      localStorage.setItem(entityName, JSON.stringify(items));
      window.dispatchEvent(new Event('storage-updated'));
    }
  }
}
