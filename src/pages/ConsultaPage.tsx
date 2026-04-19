import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useClientes } from '@/context/ClientesContext';
import { useRFQ, RFQ } from '@/context/RFQContext';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, Mail, ChevronDown, ChevronUp, Eye, FileText, Receipt } from 'lucide-react';
import { gerarPDFRFQ } from '@/lib/gerarPDFRFQ';
import { gerarPDFPO, POData } from '@/lib/gerarPDFPO';
import { toast } from 'sonner';
import { PurchaseRequest } from '@/types';
import { VisualizarRC, VisualizarPO } from '@/components/VisualizarDocumento';

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

// ── Botão de documento ───────────────────────────────────────────────────────

function DocBtn({
  label, icon, onClick, title, disabled = false, color = '',
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-colors
        ${disabled
          ? 'opacity-30 cursor-not-allowed border-gray-200 text-gray-400'
          : color
            ? `${color} cursor-pointer`
            : 'border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Card por projeto ──────────────────────────────────────────────────────────

function ProjetoCard({
  numeroProjeto,
  clienteNome,
  rfqs,
  rcs,
  onPDFRFQ,
  onVerRC,
  onVerPO,
  onEmailPO,
}: {
  numeroProjeto: string;
  clienteNome: string;
  rfqs: RFQ[];
  rcs: PurchaseRequest[];
  onPDFRFQ: (rfq: RFQ) => void;
  onVerRC: (rc: PurchaseRequest) => void;
  onVerPO: (rc: PurchaseRequest) => void;
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
          <div className="flex gap-2 ml-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
              {rfqs.length} RFQ{rfqs.length !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200">
              {rcs.length} RC{rcs.length !== 1 ? 's' : ''}
            </span>
            {posGeradas > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
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
          {/* RFQs */}
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
                    <DocBtn
                      label="RFQ"
                      title="Visualizar PDF da RFQ"
                      icon={<Eye size={11} />}
                      color="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => onPDFRFQ(rfq)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RCs e POs */}
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
                    <th className="py-1.5 text-right font-normal">Documentos</th>
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
                        <div className="flex gap-1.5 justify-end items-center">
                          {/* RC — abre modal */}
                          <DocBtn
                            label="RC"
                            title="Visualizar RC"
                            icon={<Eye size={11} />}
                            color="border-gray-200 text-gray-600 hover:bg-gray-50"
                            onClick={() => onVerRC(rc)}
                          />
                          {/* PO — abre modal, só quando gerada */}
                          <DocBtn
                            label="PO"
                            title={rc.poNumber ? 'Visualizar PO' : 'PO ainda não gerada'}
                            icon={<Eye size={11} />}
                            color={rc.poNumber ? 'border-green-200 text-green-700 hover:bg-green-50' : ''}
                            disabled={!rc.poNumber}
                            onClick={() => onVerPO(rc)}
                          />
                          {/* NF — placeholder para futuro */}
                          <DocBtn
                            label="NF"
                            title="Nota Fiscal — em breve"
                            icon={<Receipt size={11} />}
                            disabled
                            onClick={() => {}}
                          />
                          {/* Email — só quando PO gerada */}
                          {rc.poNumber && (
                            <button
                              onClick={() => onEmailPO(rc)}
                              title="Enviar PO por email"
                              className="inline-flex items-center justify-center w-6 h-6 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                            >
                              <Mail size={11} />
                            </button>
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
  const [filtroCliente, setFiltroCliente] = useState('all');
  const [verRC, setVerRC] = useState<PurchaseRequest | null>(null);
  const [verPO, setVerPO] = useState<PurchaseRequest | null>(null);

  function getNomeCliente(rc: PurchaseRequest): string {
    const projClient = rc.projectClient;
    if (!projClient) return '—';
    const found = clientes.find(
      (c) => String(c.id) === String(projClient) || c.nome === projClient
    );
    return found?.nome ?? projClient ?? '—';
  }

  function handlePDFRFQ(rfq: RFQ) {
    gerarPDFRFQ(rfq);
    toast.success(`PDF ${rfq.numeroRFQ} gerado!`);
  }

  function handlePDFRC(rc: PurchaseRequest) {
    const clienteNome = getNomeCliente(rc);
    const rcData = rcParaPO(rc, clienteNome);
    rcData.numeroPO = `RC: ${rc.id}`;
    gerarPDFPO(rcData);
    toast.success(`PDF ${rc.id} gerado!`);
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
        if (filtroCliente !== 'all' && clienteNome !== filtroCliente) return false;
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
  }, [rcs, rfqs, clientes, busca, filtroCliente]);

  // Lista de clientes únicos com RCs
  const clientesComDados = useMemo(() => {
    const nomes = new Set<string>();
    rcs.forEach((rc) => {
      const nome = getNomeCliente(rc);
      if (nome && nome !== '—') nomes.add(nome);
    });
    return Array.from(nomes).sort();
  }, [rcs, clientes]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-gray-900">Consulta</h1>
        <p className="text-sm text-gray-400">Visão unificada de RFQs, RCs e POs por projeto</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 h-9 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Buscar por projeto, RC, PO ou RFQ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-56 h-9 text-sm">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clientesComDados.map((nome) => (
              <SelectItem key={nome} value={nome}>{nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(busca || filtroCliente !== 'all') && (
          <button
            className="text-xs text-gray-400 hover:text-gray-600 px-2"
            onClick={() => { setBusca(''); setFiltroCliente('all'); }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Legenda dos botões de documento */}
      <div className="flex items-center gap-4 mb-3 px-1">
        <span className="text-xs text-gray-400">Documentos:</span>
        <span className="flex items-center gap-1 text-xs text-gray-500"><FileText size={11}/> RC — Requisição de Compra</span>
        <span className="flex items-center gap-1 text-xs text-green-600"><Eye size={11}/> PO — Pedido de Compra</span>
        <span className="flex items-center gap-1 text-xs text-gray-300"><Receipt size={11}/> NF — Nota Fiscal (em breve)</span>
      </div>

      {projetos.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-gray-400 text-sm">
            {busca || filtroCliente !== 'all'
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
            onVerRC={(rc) => setVerRC(rc)}
            onVerPO={(rc) => setVerPO(rc)}
            onEmailPO={handleEmailPO}
          />
        ))
      )}
    </div>
  );
}
