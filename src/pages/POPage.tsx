import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search, FileDown, Mail } from 'lucide-react';
import { gerarPDFPO, POData } from '@/lib/gerarPDFPO';
import { toast } from 'sonner';
import { PurchaseRequest } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  aprovada: 'Aprovada',
  aguardando_confirmacao_entrega: 'Ag. Entrega',
  entrega_confirmada: 'Entregue',
  nota_fiscal_recebida: 'NF Recebida',
  pagamento_realizado: 'Pago',
  nota_enviada_contador: 'Concluído',
};

const STATUS_STYLE: Record<string, string> = {
  aprovada: 'bg-green-50 text-green-700 border-green-200',
  aguardando_confirmacao_entrega: 'bg-blue-50 text-blue-700 border-blue-200',
  entrega_confirmada: 'bg-blue-50 text-blue-700 border-blue-200',
  nota_fiscal_recebida: 'bg-purple-50 text-purple-700 border-purple-200',
  pagamento_realizado: 'bg-purple-50 text-purple-700 border-purple-200',
  nota_enviada_contador: 'bg-gray-50 text-gray-600 border-gray-200',
};

function modoEntregaTexto(rc: PurchaseRequest): string {
  if (rc.deliveryMode === 'retirada') return 'Retirada na loja pelo solicitante';
  if (rc.deliveryCarrier === 'transportadora')
    return 'Entrega via transportadora (a contratar pelo solicitante)';
  return 'Entrega pelo fornecedor';
}

function rcParaPO(rc: PurchaseRequest): POData {
  return {
    numeroPO: rc.poNumber ?? '—',
    numeroRC: rc.id,
    numeroProjeto: rc.projectNumber,
    cliente: rc.projectClient,
    fornecedor: rc.supplier?.name ?? '—',
    solicitante: rc.requester?.name ?? '—',
    enderecoEntrega: rc.deliveryAddress ?? '—',
    modoEntrega: modoEntregaTexto(rc),
    imposto: rc.tax ?? 0,
    observacoes: rc.notes ?? '',
    criadoEm: rc.approvedAt ?? rc.createdAt ?? new Date().toISOString(),
    itens: (rc.lineItems ?? []).map((li) => ({
      codigo: li.item.codigo,
      descricao: li.item.descricao,
      categoria: li.item.categoria,
      classe: li.item.classe,
      tipo: li.item.tipo,
      unidade: li.item.unidade,
      qty: li.qty,
      valorUnitario: li.unitPrice,
      desconto: li.discount,
    })),
  };
}

export function POPage() {
  const { rcs, calcRC } = useApp();
  const [busca, setBusca] = useState('');

  const posGeradas = useMemo(() => rcs.filter((r) => r.poNumber), [rcs]);

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return posGeradas;
    return posGeradas.filter((rc) =>
      rc.poNumber?.toLowerCase().includes(q) ||
      rc.projectNumber?.toLowerCase().includes(q) ||
      rc.id.toLowerCase().includes(q) ||
      rc.supplier?.name?.toLowerCase().includes(q)
    );
  }, [posGeradas, busca]);

  function handleVerPDF(rc: PurchaseRequest) {
    gerarPDFPO(rcParaPO(rc));
    toast.success(`PDF ${rc.poNumber} gerado!`);
  }

  function handleEmail(rc: PurchaseRequest) {
    const po = rcParaPO(rc);
    const total = calcRC(rc).total.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'EUR',
    });
    const dataEmissao = new Date(po.criadoEm).toLocaleDateString('pt-BR');
    const assunto = encodeURIComponent(
      `Pedido de Compra ${po.numeroPO} - Projeto ${po.numeroProjeto} - Kessler Group`
    );
    const corpo = encodeURIComponent(
      `Prezado(a),\n\n` +
      `Segue em anexo o Pedido de Compra referente ao projeto ${po.numeroProjeto}.\n\n` +
      `Numero PO:    ${po.numeroPO}\n` +
      `RC Origem:    ${po.numeroRC}\n` +
      `Fornecedor:   ${po.fornecedor}\n` +
      `Emitido em:   ${dataEmissao}\n` +
      `Valor Total:  ${total}\n\n` +
      `Endereco de Entrega:\n${po.enderecoEntrega}\n\n` +
      `Atenciosamente,\nKessler Group\ncompras@kessleroffshore.com.br`
    );

    gerarPDFPO(po);
    setTimeout(() => {
      window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
      toast.success('PDF baixado! Anexe manualmente ao email.');
    }, 500);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            Purchase Orders
            <span className="text-sm font-normal text-gray-400 ml-2">
              {posGeradas.length} PO(s) gerada(s)
            </span>
          </h1>
          <p className="text-sm text-gray-400">Consulta de pedidos de compra aprovados</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por PO, projeto, RC ou fornecedor..."
          className="pl-9"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº PO</TableHead>
              <TableHead>RC Origem</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400 py-12">
                  {posGeradas.length === 0
                    ? 'Nenhuma PO gerada ainda. As POs aparecem aqui após a aprovação das RCs.'
                    : 'Nenhuma PO encontrada para a busca.'}
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((rc) => {
                const total = calcRC(rc).total;
                return (
                  <TableRow key={rc.id}>
                    <TableCell>
                      <span className="font-semibold text-blue-700">{rc.poNumber}</span>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{rc.id}</TableCell>
                    <TableCell className="font-mono text-gray-600 text-sm">{rc.projectNumber}</TableCell>
                    <TableCell className="text-gray-700 text-sm">{rc.supplier?.name ?? '—'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{rc.requester?.name ?? '—'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {rc.approvedAt
                        ? new Date(rc.approvedAt).toLocaleDateString('pt-BR')
                        : new Date(rc.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[rc.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {STATUS_LABEL[rc.status] ?? rc.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-8"
                          title="Baixar PDF da PO"
                          onClick={() => handleVerPDF(rc)}
                        >
                          <FileDown size={13} />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-8"
                          title="Enviar por email"
                          onClick={() => handleEmail(rc)}
                        >
                          <Mail size={13} />
                          Email
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {posGeradas.length > 0 && (
        <p className="text-xs text-gray-400 mt-3">
          As POs são geradas automaticamente quando o Aprovador aprova uma RC.
          O PDF é baixado ao clicar em "PDF" ou "Email".
        </p>
      )}
    </div>
  );
}
