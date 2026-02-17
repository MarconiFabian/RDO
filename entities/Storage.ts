
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

    if (supabase) {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (!error && data) return data as T[];
        console.warn(`[Storage] Supabase list error (${entityName}):`, error?.message);
      } catch (err) {
        console.error(`[Storage] Supabase connection failed for ${entityName}`);
      }
    }

    try {
      const raw = localStorage.getItem(entityName);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  static async get<T>(entityName: string, id: string): Promise<T | null> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();

    if (supabase) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
        if (!error && data) return data as T;
      } catch (err) {}
    }

    const items = await this.list<any>(entityName);
    return (items.find(i => String(i.id) === String(id)) as T) || null;
  }

  static async create<T>(entityName: string, data: any): Promise<T> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
    
    // Preparamos o objeto completo com ID local e Data
    const localId = Math.random().toString(36).substr(2, 9);
    const payload = { 
      ...data, 
      id: data.id || localId,
      created_at: data.created_at || new Date().toISOString() 
    };

    // 1. Tenta Supabase (se configurado)
    if (supabase) {
      try {
        // No Supabase, enviamos sem o ID se for UUID (para o banco gerar) 
        // ou com o ID se o banco aceitar string. 
        // Aqui tentamos enviar o objeto completo.
        const { data: created, error } = await supabase.from(tableName).insert([payload]).select().single();
        
        if (!error && created) {
          console.log(`[Storage] Sucesso no Supabase (${entityName})`);
          window.dispatchEvent(new Event('storage-updated'));
          return created as T;
        }
        
        // Se der erro de "Tabela não encontrada" ou "RLS", avisamos e seguimos para o LocalStorage
        console.error(`[Storage] Erro Supabase (${entityName}):`, error?.message);
      } catch (err) {
        console.error(`[Storage] Falha crítica de rede com Supabase.`);
      }
    }

    // 2. Fallback Local (Garante funcionamento na Vercel mesmo sem banco configurado)
    console.log(`[Storage] Salvando localmente (${entityName})`);
    const items = await this.list<any>(entityName);
    items.push(payload);
    localStorage.setItem(entityName, JSON.stringify(items));
    window.dispatchEvent(new Event('storage-updated'));
    return payload as T;
  }

  static async update<T>(entityName: string, id: string, changes: any): Promise<T> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();

    if (supabase) {
      try {
        const { data: updated, error } = await supabase.from(tableName).update(changes).eq('id', id).select().single();
        if (!error && updated) {
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
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();

    if (supabase) {
      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (!error) {
           window.dispatchEvent(new Event('storage-updated'));
           // Se deletou no supabase, não retornamos para que também delete no local caso haja redundância
        }
      } catch (e) {}
    }

    const items = await this.list<any>(entityName);
    const filtered = items.filter(i => String(i.id) !== String(id));
    localStorage.setItem(entityName, JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage-updated'));
  }
}
