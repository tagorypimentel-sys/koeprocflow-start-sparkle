import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button, Input, FormField } from '@/components/ui-pf';

const schema = z
  .object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  });

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase appends the recovery token in the URL hash (#access_token=...&type=recovery)
    // and the client auto-processes it, firing a PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setValidLink(true);
        setReady(true);
      }
    });

    // Fallback: check if there is already an active session from the link
    supabase.auth.getSession().then(({ data }) => {
      const hash = window.location.hash;
      const isRecovery = hash.includes('type=recovery') || hash.includes('access_token=');
      if (data.session || isRecovery) setValidLink(true);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setInfo('Senha atualizada com sucesso! Redirecionando...');
        await supabase.auth.signOut();
        setTimeout(() => navigate('/auth', { replace: true }), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Redefinir senha</h1>
          <p className="text-sm text-gray-500 mt-1">Escolha uma nova senha para sua conta.</p>
        </div>

        {!validLink ? (
          <div className="space-y-4">
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              Link inválido ou expirado. Solicite um novo e-mail de recuperação.
            </div>
            <Button variant="primary" className="w-full" onClick={() => navigate('/auth')}>
              Voltar para o login
            </Button>
          </div>
        ) : (
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

            <FormField label="Nova senha">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </FormField>

            <FormField label="Confirmar nova senha">
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </FormField>

            <Button
              variant="primary"
              type="submit"
              className="w-full py-2.5 shadow-md"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
