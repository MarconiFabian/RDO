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
  : (() => {
      console.error('[Storage] ERRO CRÍTICO: Chaves do Supabase não encontradas. Verifique as Variáveis de Ambiente no Vercel (VITE_SUPABASE_URL e VITE_SUPABASE_KEY).');
      return null;
    })();

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
    let supabaseData: T[] = [];
    let localData: T[] = [];

    // 1. Tenta buscar da Nuvem
    if (supabase) {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (!error && data) {
          supabaseData = data as T[];
        }
      } catch (err) {
        console.warn(`[Storage] Erro ao conectar com Nuvem para ${entityName}.`);
      }
    }

    // 2. Sempre busca do Navegador (LocalStorage)
    try {
      const raw = localStorage.getItem(entityName);
      if (raw) localData = JSON.parse(raw);
    } catch (e) {
      localData = [];
    }

    // 3. Mesclagem Inteligente (Deduplicação por ID)
    const combined = [...supabaseData];
    const supabaseIds = new Set(supabaseData.map((item: any) => String(item.id)));
    
    for (const item of localData) {
      if (!supabaseIds.has(String((item as any).id))) {
        combined.push(item);
      }
    }

    return combined;
  }

  static async get<T>(entityName: string, id: string): Promise<T | null> {
    const all = await this.list<any>(entityName);
    return (all.find(i => String(i.id) === String(id)) as T) || null;
  }

  static async create<T>(entityName: string, data: any): Promise<T> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();
    
    const localId = Math.random().toString(36).substr(2, 9);
    const payload = { 
      ...data, 
      id: data.id || localId,
      created_at: data.created_at || new Date().toISOString() 
    };

    // 1. Tenta salvar na Nuvem primeiro
    if (supabase) {
      try {
        const { data: created, error } = await supabase.from(tableName).insert([payload]).select().single();
        if (!error && created) {
          console.log(`[Storage] Gravado com sucesso na Nuvem (${entityName})`);
          window.dispatchEvent(new Event('storage-updated'));
          return created as T;
        }
        console.error(`[Storage] Erro ao gravar no Supabase (${entityName}):`, error?.message || 'Erro desconhecido');
        console.warn(`[Storage] Usando fallback local para ${entityName}.`);
      } catch (err) {
        console.error(`[Storage] Exceção na gravação em ${entityName}:`, err);
      }
    }

    // 2. Fallback: Salva no LocalStorage se a nuvem falhar
    const items = [];
    try {
      const raw = localStorage.getItem(entityName);
      if (raw) items.push(...JSON.parse(raw));
    } catch(e) {}
    
    items.push(payload);
    localStorage.setItem(entityName, JSON.stringify(items));
    window.dispatchEvent(new Event('storage-updated'));
    return payload as T;
  }

  static async update<T>(entityName: string, id: string, changes: any): Promise<T> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();

    // Tenta Nuvem
    if (supabase) {
      try {
        const { data: updated, error } = await supabase.from(tableName).update(changes).eq('id', id).select().single();
        if (!error && updated) {
          window.dispatchEvent(new Event('storage-updated'));
          return updated as T;
        }
      } catch (err) {}
    }

    // Atualiza Local (Redundância)
    const items = [];
    try {
      const raw = localStorage.getItem(entityName);
      if (raw) items.push(...JSON.parse(raw));
    } catch(e) {}

    const index = items.findIndex((i: any) => String(i.id) === String(id));
    if (index !== -1) {
      items[index] = { ...items[index], ...changes };
      localStorage.setItem(entityName, JSON.stringify(items));
      window.dispatchEvent(new Event('storage-updated'));
      return items[index] as T;
    }
    
    // Se não achou local mas o update falhou na nuvem, retorna o que temos
    return changes as T;
  }

  static async delete(entityName: string, id: string): Promise<void> {
    const tableName = TABLE_MAP[entityName] || entityName.toLowerCase();

    if (supabase) {
      try {
        await supabase.from(tableName).delete().eq('id', id);
      } catch (e) {}
    }

    const items = [];
    try {
      const raw = localStorage.getItem(entityName);
      if (raw) items.push(...JSON.parse(raw));
    } catch(e) {}

    const filtered = items.filter((i: any) => String(i.id) !== String(id));
    localStorage.setItem(entityName, JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage-updated'));
  }
}
