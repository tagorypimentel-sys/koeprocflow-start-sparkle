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
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const cleanUrl = () => {
      try {
        const url = new URL(window.location.href);
        url.hash = '';
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      } catch {
        /* noop */
      }
    };

    const init = async () => {
      const href = window.location.href;
      const url = new URL(href);
      const search = url.searchParams;
      const hash = new URLSearchParams(
        window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
      );

      // Errors returned by Supabase (e.g. otp_expired)
      const errCode =
        search.get('error_code') ||
        search.get('error') ||
        hash.get('error_code') ||
        hash.get('error');
      const errDesc =
        search.get('error_description') || hash.get('error_description');
      if (errCode) {
        if (!cancelled) {
          setLinkError(
            errDesc?.replaceAll('+', ' ') ||
              'O link de recuperação expirou ou é inválido. Solicite um novo e-mail.'
          );
          setValidLink(false);
          setReady(true);
        }
        return;
      }

      try {
        // 1) PKCE flow: ?code=...
        const code = search.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          cleanUrl();
          if (!cancelled) {
            setValidLink(true);
            setReady(true);
          }
          return;
        }

        // 2) Implicit flow: #access_token=...&refresh_token=...&type=recovery
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');
        const type = hash.get('type');
        if (accessToken && refreshToken && (type === 'recovery' || !type)) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          cleanUrl();
          if (!cancelled) {
            setValidLink(true);
            setReady(true);
          }
          return;
        }

        // 3) Some flows: ?token_hash=...&type=recovery
        const tokenHash = search.get('token_hash') || hash.get('token_hash');
        const verifyType = (search.get('type') || hash.get('type')) as
          | 'recovery'
          | 'email'
          | null;
        if (tokenHash && verifyType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: verifyType,
          });
          if (error) throw error;
          cleanUrl();
          if (!cancelled) {
            setValidLink(true);
            setReady(true);
          }
          return;
        }

        // 4) Fallback: maybe the client already processed the link and we have a session
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          if (data.session) {
            setValidLink(true);
          } else {
            setLinkError(
              'Link inválido ou expirado. Solicite um novo e-mail de recuperação.'
            );
            setValidLink(false);
          }
          setReady(true);
        }
      } catch (e: any) {
        if (!cancelled) {
          setLinkError(e?.message || 'Não foi possível validar o link de recuperação.');
          setValidLink(false);
          setReady(true);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Validando link…</p>
      </div>
    );
  }

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
              {linkError ?? 'Link inválido ou expirado. Solicite um novo e-mail de recuperação.'}
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
