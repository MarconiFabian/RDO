
import React, { useState, useEffect } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { User } from '../entities/User';
import { EntityStorage } from '../entities/Storage';
import { useToast } from '../components/ui/use-toast';
import { Loader2, ImageIcon, User as UserIcon, Lock, Hash, Wifi, WifiOff } from 'lucide-react';
import { cn, SYSTEM_CONFIG } from '../utils';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isOnline, setIsOnline] = useState(false);
  
  // Custom Logo State: Tenta pegar local, senão usa a Global
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('custom_logo'));

  // Login State
  const [loginName, setLoginName] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRegistration, setRegRegistration] = useState('');

  // Escuta atualizações de storage caso o admin mude a logo em outra aba
  useEffect(() => {
    setIsOnline(EntityStorage.isOnline());
    const handleStorage = () => {
        setCustomLogo(localStorage.getItem('custom_logo'));
        setIsOnline(EntityStorage.isOnline());
    };
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  // Define qual logo mostrar: A customizada local (se houver) ou a Padrão do Sistema
  const displayLogo = customLogo || SYSTEM_CONFIG.defaultLogo;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!loginName || !loginPass) {
        toast({ title: "Campos vazios", description: "Preencha nome e senha.", variant: "warning" });
        return;
    }
    
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    try {
      const res = await User.login(loginName, loginPass);
      if (res.success) {
        toast({ title: "Bem-vindo!", description: res.message, variant: "success" });
        window.dispatchEvent(new Event('auth-update'));
        window.location.hash = '#/Reports';
      } else {
        toast({ title: "Acesso Negado", description: res.message, variant: "destructive" });
        setLoading(false);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao processar login.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!regName || !regRegistration || !regPass) {
        toast({ title: "Campos vazios", description: "Preencha todos os campos.", variant: "warning" });
        return;
    }
    
    setLoading(true);
    try {
      const res = await User.register({
        name: regName,
        password: regPass,
        registration: regRegistration
      });
      if (res.success) {
        toast({ title: "Conta Criada", description: res.message, variant: "success" });
        setActiveTab('login');
        setRegName(''); setRegPass(''); setRegRegistration('');
      } else {
        toast({ title: "Erro no Cadastro", description: res.message, variant: "destructive" });
      }
    } catch (error) {
        toast({ title: "Erro", description: "Falha ao registrar.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f2441] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
      
      {/* Background Overlay for better text readability */}
      <div className="absolute inset-0 bg-[#0f2441]/80 pointer-events-none"></div>

      {/* Status Indicator */}
      <div className={cn(
        "absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold z-20 shadow-sm border backdrop-blur-md transition-colors",
        isOnline 
            ? "bg-green-500/10 text-green-400 border-green-500/20" 
            : "bg-orange-500/10 text-orange-400 border-orange-500/20"
      )}>
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{isOnline ? "CONECTADO" : "OFFLINE (LOCAL)"}</span>
      </div>

      {/* Logo Area */}
      <div className="flex flex-col items-center mb-2 animate-in fade-in zoom-in duration-500 text-center z-10 relative">
        
        {/* LOGO DA EMPRESA */}
        <div 
            className="bg-white p-2 rounded-2xl mb-2 shadow-2xl ring-4 ring-white/10 h-28 w-auto px-6 flex items-center justify-center overflow-hidden relative"
        >
            <img 
                src={displayLogo} 
                alt="Logo Empresa" 
                className="h-full w-auto object-contain"
                onError={(e) => {
                  // Fallback se a imagem quebrar
                  e.currentTarget.style.display = 'none';
                }}
            />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight uppercase">RDO Online</h1>
        <p className="text-sky-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Gestão de Obras</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700 z-10">
        
        {/* Custom Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            type="button"
            onClick={() => setActiveTab('login')}
            className={cn(
              "flex-1 py-4 text-sm font-black uppercase tracking-wide transition-colors outline-none",
              activeTab === 'login' ? "text-[#0f2441] border-b-2 border-[#0f2441]" : "text-slate-400 bg-slate-50/50 hover:bg-slate-50"
            )}
          >
            Entrar
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('register')}
            className={cn(
              "flex-1 py-4 text-sm font-black uppercase tracking-wide transition-colors outline-none",
              activeTab === 'register' ? "text-[#0f2441] border-b-2 border-[#0f2441]" : "text-slate-400 bg-slate-50/50 hover:bg-slate-50"
            )}
          >
            Cadastro
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Nome</Label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-300" />
                    <Input 
                    type="text" 
                    value={loginName}
                    onChange={e => setLoginName(e.target.value)}
                    placeholder="Seu nome"
                    required 
                    className="bg-slate-100/50 border-slate-200 h-12 rounded-xl pl-10 focus:bg-white transition-all text-slate-800"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Senha</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-300" />
                    <Input 
                    type="password" 
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    placeholder="Sua senha"
                    required 
                    className="bg-slate-100/50 border-slate-200 h-12 rounded-xl pl-10 focus:bg-white transition-all text-slate-800"
                    />
                </div>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full h-12 bg-[#0f3460] hover:bg-[#0f2441] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Acessar Sistema"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              
               <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Nome Completo</Label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-300" />
                    <Input 
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Ex: Marconi Fabian"
                    required 
                    className="bg-slate-100/50 border-slate-200 h-11 rounded-xl pl-10"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Matrícula</Label>
                <div className="relative">
                    <Hash className="absolute left-3 top-3 h-5 w-5 text-slate-300" />
                    <Input 
                    value={regRegistration}
                    onChange={e => setRegRegistration(e.target.value)}
                    placeholder="Ex: 00123"
                    required 
                    className="bg-slate-100/50 border-slate-200 h-11 rounded-xl pl-10"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Senha</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-300" />
                    <Input 
                    type="password" 
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                    placeholder="Crie uma senha"
                    required 
                    className="bg-slate-100/50 border-slate-200 h-11 rounded-xl pl-10"
                    />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 bg-[#0f3460] hover:bg-[#0f2441] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Conta"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 text-center opacity-40 z-10">
        <p className="text-[9px] text-white">Versão 1.0.0 • RDO Online</p>
      </div>

    </div>
  );
}
