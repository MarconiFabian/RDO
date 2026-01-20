
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User } from '../entities/User';
import { useToast } from '../components/ui/use-toast';
import { Shield, Lock, UserPlus, Anchor } from 'lucide-react';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRegistration, setRegRegistration] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await User.login(loginEmail, loginPass);
    if (res.success) {
      toast({ title: "Bem-vindo!", description: res.message, variant: "success" });
      window.location.hash = '#/Reports';
    } else {
      toast({ title: "Erro de Acesso", description: res.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await User.register({
      name: regName,
      email: regEmail,
      password: regPass,
      registration: regRegistration
    });
    
    if (res.success) {
      toast({ title: "Sucesso!", description: res.message, variant: "success" });
      // Limpa campos e volta para login seria ideal, mas aqui apenas avisamos
    } else {
      toast({ title: "Erro no Cadastro", description: res.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-950 via-blue-900 to-sky-950 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 mb-4">
            <Anchor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Porto Diário</h1>
          <p className="text-sky-300 text-xs font-bold uppercase tracking-widest">Sistema de Registro de Obras</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-xl border-none shadow-2xl overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none h-12 bg-slate-100/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-white">LOGIN</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white">REGISTRAR</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="p-6 space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">E-mail Corporativo</Label>
                  <Input 
                    type="email" 
                    placeholder="ex@empresa.com.br" 
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Senha</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-sky-900 text-white font-bold h-11">
                  {loading ? "AUTENTICANDO..." : "ENTRAR NO SISTEMA"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="p-6 space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Nome Completo</Label>
                  <Input 
                    placeholder="Como será exibido no relatório" 
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">E-mail</Label>
                    <Input 
                      type="email" 
                      placeholder="Email corporativo" 
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Matrícula</Label>
                    <Input 
                      placeholder="ID Funcional" 
                      value={regRegistration}
                      onChange={e => setRegRegistration(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Criar Senha</Label>
                  <Input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-sky-900 text-white font-bold h-11">
                  {loading ? "PROCESSANDO..." : "SOLICITAR ACESSO"}
                </Button>
                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Seu cadastro passará por aprovação do administrador antes de liberar o acesso.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <div className="text-center">
          <p className="text-sky-400/60 text-[10px] font-bold uppercase tracking-widest">
            Segurança Portuária Monitorada
          </p>
        </div>
      </div>
    </div>
  );
}
