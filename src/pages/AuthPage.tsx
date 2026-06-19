import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, FormField } from '@/components/ui-pf';

type Mode = 'login' | 'signup' | 'forgot';

const emailSchema = z.string().trim().email('E-mail inválido').max(255);
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Mínimo de 6 caracteres').max(128),
});
const signupSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Informe seu nome').max(100),
});
const forgotSchema = z.object({ email: emailSchema });

export default function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && mode !== 'forgot') {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, session, navigate, redirectTo, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    let parsed;
    if (mode === 'login') parsed = loginSchema.safeParse({ email, password });
    else if (mode === 'signup') parsed = signupSchema.safeParse({ name, email, password });
    else parsed = forgotSchema.safeParse({ email });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(
            error.message === 'Invalid login credentials'
              ? 'E-mail ou senha incorretos.'
              : error.message
          );
        }
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name },
          },
        });
        if (error) {
          setError(
            error.message.includes('already')
              ? 'Este e-mail já está cadastrado. Faça login.'
              : error.message
          );
        } else if (data.session) {
          navigate(redirectTo, { replace: true });
        } else {
          setInfo('Conta criada. Verifique seu e-mail para confirmar o cadastro.');
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          setError(error.message);
        } else {
          setInfo(
            'Se este e-mail estiver cadastrado, enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.'
          );
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === 'login' ? 'Acesse sua conta'
    : mode === 'signup' ? 'Crie sua conta'
    : 'Recuperar senha';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Koeprocflow</h1>
          <p className="text-sm text-gray-500 mt-1">{title}</p>
        </div>

        {mode !== 'forgot' && (
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                mode === 'login' ? 'bg-white shadow text-blue-900' : 'text-gray-500'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                mode === 'signup' ? 'bg-white shadow text-blue-900' : 'text-gray-500'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}
          {info && (
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg">
              {info}
            </div>
          )}

          {mode === 'signup' && (
            <FormField label="Nome">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                maxLength={100}
                required
              />
            </FormField>
          )}

          <FormField label="E-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </FormField>

          {mode !== 'forgot' && (
            <FormField label="Senha">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </FormField>
          )}

          {mode === 'login' && (
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-xs text-blue-700 font-medium hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            className="w-full py-2.5 shadow-md"
            disabled={submitting}
          >
            {submitting
              ? 'Aguarde...'
              : mode === 'login'
              ? 'Entrar'
              : mode === 'signup'
              ? 'Criar conta'
              : 'Enviar link de recuperação'}
          </Button>

          <p className="text-center text-xs text-gray-500">
            {mode === 'login' && (
              <>
                Não tem conta?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-blue-700 font-medium hover:underline">
                  Cadastre-se
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Já tem conta?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-blue-700 font-medium hover:underline">
                  Entrar
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button type="button" onClick={() => switchMode('login')} className="text-blue-700 font-medium hover:underline">
                ← Voltar para o login
              </button>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
