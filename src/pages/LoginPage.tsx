import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Input, FormField } from '@/components/ui-pf';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Falha no login: verifique seu e-mail e senha.');
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError('Erro ao criar conta: ' + error.message);
    } else {
      alert('Conta criada com sucesso! Verifique seu e-mail se necessário.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ProcureFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Faça login para acessar o sistema de requisições</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <FormField label="E-mail">
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com" 
              required
            />
          </FormField>
          
          <FormField label="Senha">
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required
            />
          </FormField>

          <div className="pt-2">
            <Button 
              variant="primary" 
              className="w-full mb-3 py-2.5 shadow-md" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            
            <button 
              type="button" 
              onClick={handleSignUp}
              disabled={loading}
              className="w-full text-sm text-gray-500 hover:text-blue-700 font-medium transition-colors"
            >
              Não tem conta? Cadastrar-se
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
