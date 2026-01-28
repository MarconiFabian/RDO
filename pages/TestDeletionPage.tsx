import React, { useState, useEffect } from 'react';
import { EntityStorage } from '../entities/Storage';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Trash2, Plus, ArrowLeft, RefreshCw, Database } from 'lucide-react';

export function TestDeletionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  // Carrega dados e força atualização
  const refresh = async () => {
    const data = await EntityStorage.list<any>('MaterialType');
    setItems([...data]); // Cria novo array para forçar render do React
  };

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener('storage-updated', handleUpdate);
    return () => window.removeEventListener('storage-updated', handleUpdate);
  }, []);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const handleCreate = async () => {
    if (!inputValue) return;
    const newItem = await EntityStorage.create<any>('MaterialType', { 
        name: inputValue, 
        active: true 
    });
    addLog(`Criado: ${newItem.name} (ID: ${newItem.id})`);
    setInputValue("");
  };

  const handleDelete = async (id: string) => {
    addLog(`Tentando deletar ID: ${id}...`);
    await EntityStorage.delete('MaterialType', id);
    addLog(`Comando executado.`);
    // O evento 'storage-updated' vai chamar o refresh automaticamente
  };

  const handleNuke = () => {
    localStorage.removeItem('MaterialType');
    window.dispatchEvent(new Event('storage-updated'));
    addLog("BANCO DE DADOS DE MATERIAIS APAGADO COMPLETAMENTE.");
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => window.location.hash = '#/Management'}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-black text-red-600 uppercase">Diagnóstico de Exclusão</h1>
        </div>

        {/* Console de Logs */}
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-32 overflow-y-auto border border-gray-800 shadow-inner">
           {logs.length === 0 ? <span className="opacity-50">Aguardando ações...</span> : logs.map((l, i) => <div key={i}>> {l}</div>)}
        </div>

        {/* Área de Criação */}
        <Card className="border-blue-200">
           <CardHeader className="bg-blue-50 py-3"><CardTitle className="text-sm uppercase text-blue-900">Adicionar Item</CardTitle></CardHeader>
           <CardContent className="flex gap-2 pt-4">
              <Input 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
                placeholder="Nome do material..." 
              />
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                 <Plus className="w-4 h-4 mr-2" /> SALVAR
              </Button>
           </CardContent>
        </Card>

        {/* Lista de Itens */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 bg-slate-50">
               <CardTitle className="text-sm uppercase flex items-center gap-2">
                 <Database className="w-4 h-4" /> Materiais ({items.length})
               </CardTitle>
               <Button size="sm" variant="destructive" onClick={handleNuke}>
                 <Trash2 className="w-4 h-4 mr-2" /> RESETAR TUDO
               </Button>
            </CardHeader>
            <CardContent className="p-0">
               {items.length === 0 ? (
                 <div className="p-8 text-center text-gray-400">Nenhum item encontrado.</div>
               ) : (
                 <div className="divide-y">
                   {items.map((item) => (
                     <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div>
                           <div className="font-bold text-lg">{item.name}</div>
                           <div className="text-[10px] font-mono bg-slate-200 text-slate-600 px-1 rounded inline-block">
                             ID: {item.id}
                           </div>
                        </div>
                        <Button 
                          onClick={() => handleDelete(item.id)} 
                          className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> DELETAR
                        </Button>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
        </Card>

        {/* Debug Raw */}
        <div className="mt-8">
           <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Dados Brutos (JSON):</h3>
           <pre className="text-[10px] bg-white p-4 rounded border overflow-x-auto text-gray-600">
             {JSON.stringify(items, null, 2)}
           </pre>
        </div>

      </div>
    </div>
  );
}