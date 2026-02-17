
import { createClient } from '@supabase/supabase-js';

// Helper seguro para ler variáveis de ambiente
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    const env = import.meta.env;
    return env ? env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_KEY');

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const TABLE_MAP: Record<string, string> = {
  'AuthorizedUser': 'authorized_users',
  'DailyReport': 'daily_reports',
  'MaterialType': 'material_types',
  'InterventionType': 'intervention_types',
  'JobFunction': 'job_functions',
  'TeamTemplate': 'team_templates',
  'GlobalSettings': 'global_settings',
  'SystemNotice': 'system_notices'
};

export class EntityStorage {
  static isOnline(): boolean {
    return !!supabase;
  }
  
  static async list<T>(entityName: string): Promise<T[]> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();

    // 1. Tenta Supabase se configurado
    if (supabase) {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (!error) return data as T[];
        console.warn(`Erro no Supabase (${entityName}):`, error.message, "Usando LocalStorage como backup.");
      } catch (err) {
        console.error("Falha de conexão com Supabase.");
      }
    }

    // 2. Fallback para LocalStorage (Segurança para Vercel)
    try {
      const raw = localStorage.getItem(entityName);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Fix: Added missing 'get' method used by entity classes
  static async get<T>(entityName: string, id: string): Promise<T | null> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();

    // 1. Tenta Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
        if (!error && data) return data as T;
      } catch (err) {}
    }

    // 2. Fallback Local
    const items = await this.list<any>(entityName);
    return (items.find(i => String(i.id) === String(id)) as T) || null;
  }

  static async create<T>(entityName: string, data: any): Promise<T> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
    const payload = { 
      ...data, 
      id: data.id || Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString() 
    };

    // 1. Tenta Supabase
    if (supabase) {
      try {
        const { data: created, error } = await supabase.from(tableName).insert([data]).select().single();
        if (!error) {
          window.dispatchEvent(new Event('storage-updated'));
          return created as T;
        }
        console.error("Supabase falhou ao criar. Tabela existe? Erro:", error.message);
      } catch (err) {
        console.error("Erro catastrófico no Supabase.");
      }
    }

    // 2. Fallback Local (Garante que o botão "+" funcione mesmo com erro no banco)
    const items = await this.list<any>(entityName);
    items.push(payload);
    localStorage.setItem(entityName, JSON.stringify(items));
    window.dispatchEvent(new Event('storage-updated'));
    return payload as T;
  }

  static async update<T>(entityName: string, id: string, changes: any): Promise<T> {
    if (supabase) {
      const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
      try {
        const { data: updated, error } = await supabase.from(tableName).update(changes).eq('id', id).select().single();
        if (!error) {
          window.dispatchEvent(new Event('storage-updated'));
          return updated as T;
        }
      } catch (err) {}
    }

    const items = await this.list<any>(entityName);
    const index = items.findIndex(i => String(i.id) === String(id));
    if (index !== -1) {
      items[index] = { ...items[index], ...changes };
      localStorage.setItem(entityName, JSON.stringify(items));
      window.dispatchEvent(new Event('storage-updated'));
      return items[index] as T;
    }
    throw new Error("Item não encontrado");
  }

  static async delete(entityName: string, id: string): Promise<void> {
    if (supabase) {
      const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (!error) {
          window.dispatchEvent(new Event('storage-updated'));
          return;
        }
      } catch (e) {}
    }

    const items = await this.list<any>(entityName);
    const filtered = items.filter(i => String(i.id) !== String(id));
    localStorage.setItem(entityName, JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage-updated'));
  }
}
