
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { EntityStorage } from './entities/Storage';

// LIMPEZA TOTAL: Removido qualquer dado pré-fixado de intervenções, materiais ou funções.
// O administrador Marconi agora tem controle total para inserir seus próprios dados.
EntityStorage.seed('AuthorizedUser', [
  { 
    email: "marconifabiano@gmail.com", 
    name: "Marconi Fabian", 
    password: "admin", 
    registration: "001",
    active: true, 
    status: 'active',
    access_level: 'admin' 
  }
]);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
