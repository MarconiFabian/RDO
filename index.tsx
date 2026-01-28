
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { EntityStorage } from './entities/Storage';

// Função para garantir que os administradores sempre tenham acesso (Async)
const ensureSystemAccess = async () => {
  // Agora usamos await
  const users = await EntityStorage.list<any>('AuthorizedUser');
  
  const systemUsers = [
    {
      name: "Marconi Fabian",
      registration: "001",
      password: "admin",
      isAdmin: true
    },
    {
      name: "Alexsandro Gabriel",
      registration: "002",
      password: "admin",
      isAdmin: true
    }
  ];

  for (const sysUser of systemUsers) {
    const existingUser = users.find(u => u.name === sysUser.name);
    
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
      console.log(`[System] User ${sysUser.name} created automatically.`);
    } else {
      let modified = false;
      const updates: any = {};

      if (!existingUser.active || existingUser.status !== 'active') {
        updates.active = true;
        updates.status = 'active';
        modified = true;
      }
      if (sysUser.isAdmin && !existingUser.admin) {
          updates.admin = true;
          modified = true;
      }

      if (modified) {
          await EntityStorage.update('AuthorizedUser', existingUser.id, updates);
          console.log(`[System] User ${sysUser.name} permissions updated.`);
      }
    }
  }
};

// Executa verificação ao iniciar (sem bloquear renderização inicial, roda em background)
ensureSystemAccess();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
