import React from 'react';
import { useApp } from '@/context/AppContext';
import { ROLE_LABELS } from '@/lib/constants';
import { Avatar } from '@/components/ui-pf';

type Page =
  | 'dashboard' | 'rcs' | 'nova_rc'
  | 'aprovacoes' | 'conferencia' | 'financeiro'
  | 'items' | 'suppliers';

interface LayoutProps {
  currentPage: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'rcs', label: 'Requisições', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'nova_rc', label: 'Nova RC', roles: ['solicitante'] },
  { id: 'aprovacoes', label: 'Aprovações', roles: ['aprovador'] },
  { id: 'conferencia', label: 'Conferência', roles: ['conferente'] },
  { id: 'financeiro', label: 'Financeiro', roles: ['financeiro'] },
  { id: 'divider' },
  { id: 'items', label: 'Itens', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
  { id: 'suppliers', label: 'Fornecedores', roles: ['solicitante', 'aprovador', 'conferente', 'financeiro'] },
] as const;

const ICONS: Record<string, string> = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  rcs: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  nova_rc: 'M12 4v16m8-8H4',
  aprovacoes: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0',
  conferencia: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 12h6M9 16h4',
  financeiro: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0',
  items: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  suppliers: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9',
};

export function Layout({ currentPage, setPage, children }: LayoutProps) {
  const { currentUser, setCurrentUser, users } = useApp();

  const visibleNav = NAV_ITEMS.filter(
    (n) => n.id === 'divider' || (n.roles as readonly string[]).includes(currentUser.role)
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
          <span className="font-bold text-blue-900 text-base tracking-tight">ProcureFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</p>
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
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar initials={currentUser.avatar} size={28} colorIndex={currentUser.id} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400">{ROLE_LABELS[currentUser.role]}</p>
            </div>
          </div>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = users.find((x) => x.id === parseInt(e.target.value));
              if (u) setCurrentUser(u);
            }}
            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABELS[u.role]})
              </option>
            ))}
          </select>
          <p className="text-[9px] text-gray-400 mt-1 text-center">Trocar usuário (demo)</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
