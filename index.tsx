
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { EntityStorage } from './entities/Storage';

// Função para garantir que o Admin sempre tenha acesso
const ensureAdminAccess = () => {
  const users = EntityStorage.list<any>('AuthorizedUser');
  const adminName = "Marconi Fabian";
  
  // Procura pelo nome exato
  const adminUser = users.find(u => u.name === adminName);
  
  if (!adminUser) {
    // Se não existir, cria
    EntityStorage.create('AuthorizedUser', { 
      email: "admin@rdo.sys", // Placeholder interno
      name: adminName, 
      password: "admin", 
      registration: "001",
      active: true, 
      status: 'active',
      access_level: 'admin',
      admin: true
    });
    console.log("[System] Admin user restored.");
  } else {
    // Se existir, garante que está ativo e com status de admin
    let modified = false;
    const updates: any = {};

    if (!adminUser.active || adminUser.status !== 'active') {
      updates.active = true;
      updates.status = 'active';
      modified = true;
    }
    if (!adminUser.admin) {
        updates.admin = true;
        modified = true;
    }

    if (modified) {
        EntityStorage.update('AuthorizedUser', adminUser.id, updates);
        console.log("[System] Admin user properties updated.");
    }
  }
};

// Executa verificação ao iniciar
ensureAdminAccess();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
