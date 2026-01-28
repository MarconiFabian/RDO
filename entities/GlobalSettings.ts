
import { EntityStorage } from './Storage';

export class GlobalSettings {
  
  static async getLogo(): Promise<string | null> {
    try {
        const settings = await EntityStorage.list<any>('GlobalSettings');
        const logoSetting = settings.find(s => s.key === 'company_logo');
        return logoSetting ? logoSetting.value : null;
    } catch (e) {
        return null;
    }
  }

  static async setLogo(base64Image: string): Promise<void> {
    try {
        const settings = await EntityStorage.list<any>('GlobalSettings');
        const existing = settings.find(s => s.key === 'company_logo');

        if (existing) {
            await EntityStorage.update('GlobalSettings', existing.id, { value: base64Image });
        } else {
            await EntityStorage.create('GlobalSettings', { key: 'company_logo', value: base64Image });
        }
        
        // Atualiza cache local para performance instantânea
        localStorage.setItem('custom_logo', base64Image);
    } catch (e) {
        console.error("Erro ao salvar logo global:", e);
        throw e;
    }
  }

  static async removeLogo(): Promise<void> {
    try {
        const settings = await EntityStorage.list<any>('GlobalSettings');
        const existing = settings.find(s => s.key === 'company_logo');
        
        if (existing) {
            await EntityStorage.delete('GlobalSettings', existing.id);
        }
        localStorage.removeItem('custom_logo');
    } catch (e) {
        console.error("Erro ao remover logo:", e);
    }
  }
}
