
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { EntityStorage } from './entities/Storage';

// Inicializa dados básicos se o banco estiver vazio
EntityStorage.seed('InterventionType', [
  { code: 'grandes_intervencoes', name: 'Grandes Intervenções' },
  { code: 'parada_eventual', name: 'Parada Eventual' },
  { code: 'gpa', name: 'GPA' },
  { code: 'briquetagem', name: 'Briquetagem' },
  { code: 'portoes_vvs', name: 'Portões VV\'s' },
  { code: 'outros', name: 'Outros' }
]);

EntityStorage.seed('JobFunction', [
  { code: 'supervisor', name: 'Supervisor' },
  { code: 'tecnico', name: 'Técnico' },
  { code: 'mecânico', name: 'Mecânico' },
  { code: 'soldador', name: 'Soldador' },
  { code: 'eletricista', name: 'Eletricista' },
  { code: 'ajudante', name: 'Ajudante' }
]);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
