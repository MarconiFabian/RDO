
import React, { useState, useEffect } from 'react';
import { MaintenanceStandard } from '../entities/MaintenanceStandard';
import { EquipmentCatalog } from '../entities/EquipmentCatalog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Book, HardDrive, Search, ArrowLeft, ExternalLink } from 'lucide-react';
import { createPageUrl } from '../utils';

export function ResourcesPage() {
  const [standards, setStandards] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const s = await MaintenanceStandard.list();
    const e = await EquipmentCatalog.list();
    setStandards(s);
    setEquipment(e);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-sky-900 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => window.location.hash = createPageUrl('Reports')} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <Book className="w-6 h-6 mr-2" /> Biblioteca Técnica
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Pesquisar manuais ou equipamentos..." 
            className="pl-9 w-full md:w-1/2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="standards" className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-xl">
            <TabsTrigger value="standards"><Book className="w-4 h-4 mr-2" /> Normas & Manuais</TabsTrigger>
            <TabsTrigger value="equipment"><HardDrive className="w-4 h-4 mr-2" /> Catálogo de Equipamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="standards">
            <Card>
              <CardHeader><CardTitle>Procedimentos e Normas Técnicas</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead className="text-right">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standards.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">Nenhuma norma cadastrada.</TableCell></TableRow>
                    ) : (
                      standards.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.code}</TableCell>
                          <TableCell className="font-medium">{s.title}</TableCell>
                          <TableCell>{s.version}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => window.open(s.pdf_url, '_blank')}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment">
             <Card>
                <CardHeader><CardTitle>Catálogo de Materiais e Peças</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Fabricante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipment.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">Nenhum equipamento cadastrado.</TableCell></TableRow>
                      ) : (
                        equipment.map(e => (
                          <TableRow key={e.id}>
                            <TableCell className="font-mono text-xs">{e.code}</TableCell>
                            <TableCell className="font-medium">{e.name}</TableCell>
                            <TableCell className="capitalize">{e.category}</TableCell>
                            <TableCell>{e.manufacturer}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
