import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n';
import { ROLE_LABELS } from '@/lib/constants';
import { Avatar } from '@/components/ui-pf';
import { Bell } from 'lucide-react';

type Page =
  | 'dashboard' | 'rcs' | 'nova_rc' | 'rfq' | 'po' | 'consulta'
  | 'aprovacoes' | 'conferencia' | 'financeiro'
  | 'items' | 'suppliers' | 'clientes' | 'usuarios';

interface LayoutProps {
  currentPage: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'dashboard', tKey: 'dashboard', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'rfq', tKey: 'rfq', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'rcs', tKey: 'rcs', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'consulta', tKey: 'consulta', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },

  { id: 'aprovacoes', tKey: 'aprovacoes', roles: ['aprovador'] },
  { id: 'conferencia', tKey: 'conferencia', roles: ['conferente'] },
  { id: 'financeiro', tKey: 'financeiro', roles: ['financeiro'] },
  { id: 'divider' },
  { id: 'items', tKey: 'items', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'suppliers', tKey: 'suppliers', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'clientes', tKey: 'clientes', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'usuarios', tKey: 'usuarios', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
] as const;

const ICONS: Record<string, string> = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  rcs: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  rfq: 'M8 7h12M8 12h12M8 17h8M3 7h.01M3 12h.01M3 17h.01',
  consulta: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  nova_rc: 'M12 4v16m8-8H4',
  
  aprovacoes: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0',
  conferencia: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 12h6M9 16h4',
  financeiro: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0',
  items: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  suppliers: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9',
  clientes: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  usuarios: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z',
};

export function Layout({ currentPage, setPage, children }: LayoutProps) {
  const { currentUser } = useApp();
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const userRoles = (currentUser.role || '').split(',').map((r) => r.trim()).filter(Boolean);
  const isAdmin = userRoles.includes('admin');
  const visibleNav = NAV_ITEMS.filter(
    (n) =>
      n.id === 'divider' ||
      isAdmin ||
      (n.roles as readonly string[]).some((r) => userRoles.includes(r))
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <span className="font-bold text-blue-900 text-base tracking-tight">KOE ProcFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('menu')}</p>
          {visibleNav.map((item, i) => {
            if (item.id === 'divider') {
              return <div key={`div-${i}`} className="my-2 mx-3 border-t border-gray-100" />;
            }
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id as Page)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition mb-0.5 border-r-2 ${
                  active
                    ? 'bg-blue-50 text-blue-900 border-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d={ICONS[item.id]} />
                </svg>
                {'tKey' in item ? t(item.tKey as TranslationKey) : ''}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Avatar initials={user?.email?.charAt(0).toUpperCase() || 'U'} size={28} colorIndex={5} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate" title={user?.email || ''}>
                {user?.email ? user.email.split('@')[0] : 'Usuário'}
              </p>
              <p className="text-[10px] text-gray-400">{t(`role_${currentUser.role}` as TranslationKey)}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full text-xs border border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-md px-2 py-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
          >
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-6 flex-shrink-0">
          
          {/* Bell Icon */}
          <button className="relative text-gray-500 hover:text-gray-800 transition">
            <Bell size={20} strokeWidth={2} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0ea5e9] text-[9px] font-bold text-white">
              3
            </span>
          </button>

          {/* Language Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white shadow-sm">
            <button
              onClick={() => setLang('EN')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                lang === 'EN' ? 'bg-gray-100 text-[#1a2b6d]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-60">US</span> EN
            </button>
            <div className="w-[1px] h-3 bg-gray-200 mx-0.5" />
            <button
              onClick={() => setLang('PT')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                lang === 'PT' ? 'bg-gray-100 text-[#1a2b6d]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-60">BR</span> PT
            </button>
          </div>

        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
