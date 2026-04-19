import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useClientes } from '@/context/ClientesContext';
import { useRFQ, RFQ } from '@/context/RFQContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileDown, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { gerarPDFRFQ } from '@/lib/gerarPDFRFQ';
import { gerarPDFPO, POData } from '@/lib/gerarPDFPO';
import { toast } from 'sonner';
import { PurchaseRequest } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

function calcTotalRC(rc: PurchaseRequest): number {
  const sub = rc.lineItems.reduce((acc, li) => {
    const cd = li.unitPrice * (1 - (li.discount ?? 0) / 100);
    return acc + cd * (li.qty ?? 1);
  }, 0);
  return sub * (1 + (rc.tax ?? 0) / 100);
}

function rcParaPO(rc: PurchaseRequest, clienteNome: string): POData {
  return {
    numeroPO: rc.poNumber ?? '—',
    numeroRC: rc.id,
    numeroProjeto: rc.projectNumber,
    cliente: clienteNome,
    fornecedor: rc.supplier?.name ?? '—',
    solicitante: rc.requester?.name ?? '—',
    enderecoEntrega: rc.deliveryAddress ?? '—',
    modoEntrega: rc.deliveryMode ?? '—',
    imposto: rc.tax ?? 0,
    observacoes: rc.notes ?? '',
    criadoEm: rc.createdAt ?? new Date().toISOString(),
    itens: rc.lineItems.map((li) => ({
      codigo: li.item?.codigo ?? '—',
      descricao: li.item?.descricao ?? '—',
      categoria: li.item?.categoria ?? '—',
      classe: li.item?.classe ?? '—',
      tipo: li.item?.tipo ?? '—',
      unidade: li.item?.unidade ?? 'UN',
      qty: li.qty ?? 1,
      valorUnitario: li.unitPrice ?? 0,
      desconto: li.discount ?? 0,
    })),
  };
}

// ── Badges ────────────────────────────────────────────────────────────────────

const RC_STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  aguardando_aprovacao: 'Ag. Aprovação',
  aprovada: 'Aprovada',
  aguardando_confirmacao_entrega: 'Ag. Entrega',
  entrega_confirmada: 'Entregue',
  nota_fiscal_recebida: 'NF Recebida',
  pagamento_realizado: 'Pago',
  nota_enviada_contador: 'Concluído',
  devolvida: 'Devolvida',
};

const RC_STATUS_STYLE: Record<string, string> = {
  rascunho: 'bg-gray-50 text-gray-500 border-gray-200',
  aguardando_aprovacao: 'bg-amber-50 text-amber-700 border-amber-200',
  aprovada: 'bg-green-50 text-green-700 border-green-200',
  aguardando_confirmacao_entrega: 'bg-blue-50 text-blue-700 border-blue-200',
  entrega_confirmada: 'bg-blue-50 text-blue-700 border-blue-200',
  nota_fiscal_recebida: 'bg-purple-50 text-purple-700 border-purple-200',
  pagamento_realizado: 'bg-purple-50 text-purple-700 border-purple-200',
  nota_enviada_contador: 'bg-gray-50 text-gray-600 border-gray-200',
  devolvida: 'bg-red-50 text-red-600 border-red-200',
};

// ── Card por projeto ──────────────────────────────────────────────────────────

function ProjetoCard({
  numeroProjeto,
  clienteNome,
  rfqs,
  rcs,
  onPDFRFQ,
  onPDFPO,
  onEmailPO,
}: {
  numeroProjeto: string;
  clienteNome: string;
  rfqs: RFQ[];
  rcs: PurchaseRequest[];
  onPDFRFQ: (rfq: RFQ) => void;
  onPDFPO: (rc: PurchaseRequest) => void;
  onEmailPO: (rc: PurchaseRequest) => void;
}) {
  const [aberto, setAberto] = useState(true);

  const totalRCs = rcs.reduce((acc, rc) => acc + calcTotalRC(rc), 0);
  const posGeradas = rcs.filter((rc) => rc.poNumber).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-3">
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setAberto(!aberto)}
      >
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Projeto</p>
            <p className="text-base font-semibold text-gray-900">{numeroProjeto}</p>
          </div>
          {clienteNome && clienteNome !== '—' && (
            <div className="text-left border-l border-gray-200 pl-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Cliente</p>
              <p className="text-sm font-medium text-gray-700">{clienteNome}</p>
            </div>
          )}
          <div className="flex gap-3 ml-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
              {rfqs.length} RFQ{rfqs.length !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200">
              {rcs.length} RC{rcs.length !== 1 ? 's' : ''}
            </span>
            {posGeradas > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                {posGeradas} PO{posGeradas !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">Total RCs</p>
            <p className="text-sm font-semibold text-gray-900">{fmtMoeda(totalRCs)}</p>
          </div>
          {aberto ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {aberto && (
        <div className="divide-y divide-gray-100">
          {rfqs.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">RFQs</p>
              <div className="space-y-1.5">
                {rfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-blue-50 border border-blue-100"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-blue-700 text-sm">{rfq.numeroRFQ}</span>
                      <span className="text-xs text-gray-500">{rfq.itens?.length ?? 0} item(s)</span>
                      <span className="text-xs text-gray-400">
                        Entrega:{' '}
                        {rfq.dataLimiteEntrega
                          ? new Date(rfq.dataLimiteEntrega + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                      <span className="text-xs text-gray-400">Emitido: {fmtData(rfq.criadoEm)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => onPDFRFQ(rfq)}
                    >
                      <FileDown size={12} /> PDF
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rcs.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">RCs / POs</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-1.5 pr-3 font-normal">RC</th>
                    <th className="text-left py-1.5 pr-3 font-normal">PO</th>
                    <th className="text-left py-1.5 pr-3 font-normal">Fornecedor</th>
                    <th className="text-left py-1.5 pr-3 font-normal">Solicitante</th>
                    <th className="text-right py-1.5 pr-3 font-normal">Valor</th>
                    <th className="text-left py-1.5 pr-3 font-normal">Status RC</th>
                    <th className="text-left py-1.5 pr-3 font-normal">Data</th>
                    <th className="py-1.5 text-right font-normal">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rcs.map((rc) => (
                    <tr key={rc.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-3 font-semibold text-gray-700">{rc.id}</td>
                      <td className="py-2 pr-3">
                        {rc.poNumber ? (
                          <span className="font-semibold text-green-700">{rc.poNumber}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gray-600 max-w-[120px] truncate">
                        {rc.supplier?.name ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-gray-500">{rc.requester?.name ?? '—'}</td>
                      <td className="py-2 pr-3 text-right font-medium text-gray-700">
                        {fmtMoeda(calcTotalRC(rc))}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                            RC_STATUS_STYLE[rc.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          {RC_STATUS_LABEL[rc.status] ?? rc.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-400">{fmtData(rc.createdAt)}</td>
                      <td className="py-2">
                        <div className="flex gap-1 justify-end">
                          {rc.poNumber && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                title="Baixar PDF da PO"
                                onClick={() => onPDFPO(rc)}
                              >
                                <FileDown size={11} /> PO
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                title="Enviar PO por email"
                                onClick={() => onEmailPO(rc)}
                              >
                                <Mail size={11} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function ConsultaPage() {
  const { rcs } = useApp();
  const { clientes } = useClientes();
  const { rfqs } = useRFQ();
  const [busca, setBusca] = useState('');

  function getNomeCliente(rc: PurchaseRequest): string {
    const projClient = rc.projectClient;
    if (!projClient) return '—';
    const found = clientes.find(
      (c) => String(c.id) === String(projClient) || c.nome === projClient
    );
    return found?.nome ?? projClient ?? '—';
  }

  const projetos = useMemo(() => {
    const q = busca.toLowerCase().trim();

    const todosProjetos = new Set<string>();
    rcs.forEach((rc) => {
      if (rc.projectNumber) todosProjetos.add(rc.projectNumber);
    });
    rfqs.forEach((rfq) => {
      if (rfq.numeroProjeto) todosProjetos.add(rfq.numeroProjeto);
    });

    return Array.from(todosProjetos)
      .map((proj) => {
        const rcsProj = rcs.filter((rc) => rc.projectNumber === proj);
        const rfqsProj = rfqs.filter((rfq) => rfq.numeroProjeto === proj);
        const clienteNome = rcsProj.length > 0 ? getNomeCliente(rcsProj[0]) : '—';
        return { numeroProjeto: proj, clienteNome, rcs: rcsProj, rfqs: rfqsProj };
      })
      .filter(({ numeroProjeto, clienteNome, rcs: rcsP, rfqs: rfqsP }) => {
        if (!q) return true;
        return (
          numeroProjeto.toLowerCase().includes(q) ||
          clienteNome.toLowerCase().includes(q) ||
          rcsP.some(
            (rc) =>
              rc.id.toLowerCase().includes(q) ||
              (rc.poNumber ?? '').toLowerCase().includes(q)
          ) ||
          rfqsP.some((rfq) => rfq.numeroRFQ?.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.numeroProjeto.localeCompare(b.numeroProjeto));
  }, [rcs, rfqs, clientes, busca]);

  function handlePDFRFQ(rfq: RFQ) {
    gerarPDFRFQ(rfq);
    toast.success(`PDF ${rfq.numeroRFQ} gerado!`);
  }

  function handlePDFPO(rc: PurchaseRequest) {
    const clienteNome = getNomeCliente(rc);
    gerarPDFPO(rcParaPO(rc, clienteNome));
    toast.success(`PDF ${rc.poNumber} gerado!`);
  }

  function handleEmailPO(rc: PurchaseRequest) {
    const clienteNome = getNomeCliente(rc);
    const po = rcParaPO(rc, clienteNome);
    const total = fmtMoeda(calcTotalRC(rc));
    const assunto = encodeURIComponent(
      `Pedido de Compra ${po.numeroPO} - Projeto ${po.numeroProjeto} - Kessler Group`
    );
    const corpo = encodeURIComponent(
      `Prezado(a),\n\n` +
        `Segue em anexo o Pedido de Compra referente ao projeto ${po.numeroProjeto}.\n\n` +
        `Número PO:   ${po.numeroPO}\n` +
        `RC Origem:   ${po.numeroRC}\n` +
        `Fornecedor:  ${po.fornecedor}\n` +
        `Valor Total: ${total}\n\n` +
        `Atenciosamente,\nKessler Group\ncompras@kessleroffshore.com.br`
    );
    gerarPDFPO(po);
    setTimeout(() => {
      window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
      toast.success('PDF baixado! Anexe ao email.');
    }, 400);
  }

  const totalProjetos = projetos.length;
  const totalRCs = projetos.reduce((a, p) => a + p.rcs.length, 0);
  const totalRFQs = projetos.reduce((a, p) => a + p.rfqs.length, 0);
  const totalPOs = projetos.reduce(
    (a, p) => a + p.rcs.filter((rc) => rc.poNumber).length,
    0
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Consulta</h1>
        <p className="text-sm text-gray-400">Visão unificada de RFQs, RCs e POs por projeto</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Projetos', valor: totalProjetos, cor: 'text-gray-900' },
          { label: 'RFQs', valor: totalRFQs, cor: 'text-blue-700' },
          { label: 'RCs', valor: totalRCs, cor: 'text-gray-700' },
          { label: 'POs', valor: totalPOs, cor: 'text-green-700' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-2xl font-semibold ${m.cor}`}>{m.valor}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-5 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por projeto, cliente, RC, PO ou RFQ..."
          className="pl-9"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {projetos.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-gray-400 text-sm">
            {busca
              ? 'Nenhum resultado encontrado.'
              : 'Nenhum projeto encontrado. Crie uma RFQ ou RC para começar.'}
          </p>
        </div>
      ) : (
        projetos.map((p) => (
          <ProjetoCard
            key={p.numeroProjeto}
            numeroProjeto={p.numeroProjeto}
            clienteNome={p.clienteNome}
            rfqs={p.rfqs}
            rcs={p.rcs}
            onPDFRFQ={handlePDFRFQ}
            onPDFPO={handlePDFPO}
            onEmailPO={handleEmailPO}
          />
        ))
      )}
    </div>
  );
}
