import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ClientesProvider } from '@/context/ClientesContext';
import { ItensProvider } from '@/context/ItensContext';
import { RFQProvider } from '@/context/RFQContext';

import { Layout } from '@/components/layout/Layout';
import { RCDetailPanel } from '@/components/rc/RCDetailPanel';
import { DashboardPage } from '@/pages/DashboardPage';
import { RCListPage } from '@/pages/RCListPage';
import { NovaRCPage } from '@/pages/NovaRCPage';
import { AprovacoesPage } from '@/pages/AprovacoesPage';
import { ConferenciaPage } from '@/pages/ConferenciaPage';
import { FinanceiroPage } from '@/pages/FinanceiroPage';
import { ItemsPage } from '@/pages/ItemsPage';
import { RFQPage } from '@/pages/RFQPage';
import { POPage } from '@/pages/POPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { ClientesPage } from '@/pages/ClientesPage';
import { UsuariosPage } from '@/pages/UsuariosPage';

import { PurchaseRequest } from '@/types';

type Page =
  | 'dashboard' | 'rcs' | 'nova_rc' | 'rfq' | 'po'
  | 'aprovacoes' | 'conferencia' | 'financeiro'
  | 'items' | 'suppliers' | 'clientes' | 'usuarios';

function AppInner() {
  const [page, setPage] = useState<Page>('dashboard');
  const { selectedRC, setSelectedRC } = useApp();

  const handleSelectRC = (rc: PurchaseRequest) => setSelectedRC(rc);
  const handleClosePanel = () => setSelectedRC(null);
  const navigateTo = (p: Page) => {
    setPage(p);
    setSelectedRC(null);
  };

  return (
    <Layout currentPage={page} setPage={navigateTo}>
      <div className="flex h-full">
        <div className="flex-1 overflow-y-auto">
          {page === 'dashboard' && <DashboardPage onSelectRC={handleSelectRC} />}
          {page === 'rcs' && <RCListPage onSelectRC={handleSelectRC} onNewRC={() => navigateTo('nova_rc')} />}
          {page === 'nova_rc' && <NovaRCPage onSave={() => navigateTo('rcs')} onCancel={() => navigateTo('rcs')} />}
          {page === 'aprovacoes' && <AprovacoesPage onSelectRC={handleSelectRC} />}
          {page === 'conferencia' && <ConferenciaPage onSelectRC={handleSelectRC} />}
          {page === 'financeiro' && <FinanceiroPage onSelectRC={handleSelectRC} />}
          
          {page === 'rfq' && <RFQPage />}
          {page === 'po' && <POPage />}
          {page === 'items' && <ItemsPage />}
          {page === 'suppliers' && <SuppliersPage />}
          {page === 'clientes' && <ClientesPage />}
          {page === 'usuarios' && <UsuariosPage />}
        </div>
        {selectedRC && <RCDetailPanel rc={selectedRC} onClose={handleClosePanel} />}
      </div>
    </Layout>
  );
}

export default function Index() {
  return (
    <AppProvider>
      <ItensProvider>
        <ClientesProvider>
          <RFQProvider>
            <AppInner />
          </RFQProvider>
        </ClientesProvider>
      </ItensProvider>
    </AppProvider>
  );
}
