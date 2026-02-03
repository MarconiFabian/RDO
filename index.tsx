
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { EntityStorage } from './entities/Storage';

// Função para garantir que os administradores sempre tenham acesso (Self-Healing)
const ensureSystemAccess = async () => {
  try {
    // Verifica conexão primeiro
    const isOnline = EntityStorage.isOnline();
    if (isOnline) {
       console.log("[System] Iniciando em modo ONLINE (Supabase).");
    } else {
       console.log("[System] Iniciando em modo OFFLINE (Local Storage). Verifique as Vercel Env Vars se isso não era esperado.");
    }

    const users = await EntityStorage.list<any>('AuthorizedUser');
    
    // Lista de usuários que o sistema OBRIGA a existir.
    // Removemos o Alexsandro daqui para que ele possa ser excluído permanentemente.
    const systemUsers = [
      {
        name: "Marconi Fabian",
        registration: "001",
        password: "29052008", // Senha Atualizada
        isAdmin: true
      }
    ];

    for (const sysUser of systemUsers) {
      const existingUser = users.find(u => u.name && u.name.toLowerCase() === sysUser.name.toLowerCase());
      
      if (!existingUser) {
        await EntityStorage.create('AuthorizedUser', { 
          email: `${sysUser.name.split(' ')[0].toLowerCase()}@rdo.sys`,
          name: sysUser.name, 
          password: sysUser.password, 
          registration: sysUser.registration,
          active: true, 
          status: 'active',
          access_level: 'admin',
          admin: sysUser.isAdmin
        });
        console.log(`[System] Usuário ${sysUser.name} criado automaticamente.`);
      }
    }
  } catch (err) {
    console.warn("[System] Inicialização pulada ou falhou.", err);
  }
};

// Executa e renderiza
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");
const root = ReactDOM.createRoot(rootElement);

// Tenta garantir acesso, mas não bloqueia a UI totalmente
ensureSystemAccess().then(() => {
    // Done
}).catch(e => console.error(e));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
