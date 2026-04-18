import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { LineItem } from '@/types';

interface Props {
  numeroProjeto: string;
  /** ID da RC atual já salva (Aprovações). Será excluída do "anterior" e somada como "Esta RC". */
  rcAtualId?: string;
  /** Itens da RC sendo criada (Nova RC), ainda sem ID. Somados como "Esta RC". */
  itensAtuais?: LineItem[];
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const totalLine = (li: LineItem) =>
  li.unitPrice * li.qty * (1 - (li.discount ?? 0) / 100);

export default function CartaoConsolidadoProjeto({
  numeroProjeto,
  rcAtualId,
  itensAtuais,
}: Props) {
  const { rcs } = useApp();

  const rcsAnteriores = useMemo(
    () =>
      rcs.filter(
        (rc) => rc.projectNumber === numeroProjeto && rc.id !== rcAtualId,
      ),
    [rcs, numeroProjeto, rcAtualId],
  );

  const rcAtual = rcAtualId ? rcs.find((rc) => rc.id === rcAtualId) : undefined;
  const itensDaAtual: LineItem[] =
    rcAtual?.lineItems ?? itensAtuais ?? [];

  const consolidado = useMemo(() => {
    let opex = 0;
    let capex = 0;
    let opexAtual = 0;
    let capexAtual = 0;

    rcsAnteriores.forEach((rc) =>
      rc.lineItems.forEach((li) => {
        const t = totalLine(li);
        if (li.item.tipo === 'CAPEX') capex += t;
        else opex += t;
      }),
    );

    itensDaAtual.forEach((li) => {
      const t = totalLine(li);
      if (li.item.tipo === 'CAPEX') capexAtual += t;
      else opexAtual += t;
    });

    return { opex, capex, opexAtual, capexAtual };
  }, [rcsAnteriores, itensDaAtual]);

  const totalAnterior = consolidado.opex + consolidado.capex;
  const totalAtual = consolidado.opexAtual + consolidado.capexAtual;
  const totalGeral = totalAnterior + totalAtual;
  const totalOpex = consolidado.opex + consolidado.opexAtual;
  const totalCapex = consolidado.capex + consolidado.capexAtual;
  const mostrarAtual = !!rcAtualId || (itensAtuais && itensAtuais.length > 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Consolidado do Projeto
          </p>
          <p className="text-base font-medium text-gray-900">{numeroProjeto}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total acumulado</p>
          <p className="text-lg font-semibold text-gray-900">{fmt(totalGeral)}</p>
        </div>
      </div>

      {/* OPEX / CAPEX */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* OPEX */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              OPEX
            </span>
            <span className="text-xs text-gray-400">Custo operacional</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                RCs anteriores
                <span className="ml-1.5 text-xs text-gray-300">
                  ({rcsAnteriores.length} RC{rcsAnteriores.length !== 1 ? 's' : ''})
                </span>
              </span>
              <span className="text-gray-700">{fmt(consolidado.opex)}</span>
            </div>
            {mostrarAtual && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  Esta RC
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-50 text-amber-600 border border-amber-200">
                    pendente
                  </span>
                </span>
                <span className="text-gray-700">{fmt(consolidado.opexAtual)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Subtotal OPEX</span>
              <span className="text-sm font-semibold text-green-700">{fmt(totalOpex)}</span>
            </div>
          </div>
        </div>

        {/* CAPEX */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              CAPEX
            </span>
            <span className="text-xs text-gray-400">Investimento de capital</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                RCs anteriores
                <span className="ml-1.5 text-xs text-gray-300">
                  ({rcsAnteriores.length} RC{rcsAnteriores.length !== 1 ? 's' : ''})
                </span>
              </span>
              <span className="text-gray-700">{fmt(consolidado.capex)}</span>
            </div>
            {mostrarAtual && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  Esta RC
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-50 text-amber-600 border border-amber-200">
                    pendente
                  </span>
                </span>
                <span className="text-gray-700">{fmt(consolidado.capexAtual)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Subtotal CAPEX</span>
              <span className="text-sm font-semibold text-purple-700">{fmt(totalCapex)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>
            OPEX{' '}
            <strong className="text-gray-600">
              {totalGeral > 0 ? Math.round((totalOpex / totalGeral) * 100) : 0}%
            </strong>
          </span>
          <span>
            CAPEX{' '}
            <strong className="text-gray-600">
              {totalGeral > 0 ? Math.round((totalCapex / totalGeral) * 100) : 0}%
            </strong>
          </span>
          <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden flex">
            <div
              className="h-full bg-green-400 transition-all"
              style={{ width: `${totalGeral > 0 ? (totalOpex / totalGeral) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-purple-400 transition-all"
              style={{ width: `${totalGeral > 0 ? (totalCapex / totalGeral) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total OPEX + CAPEX</p>
          <p className="text-base font-semibold text-gray-900">{fmt(totalGeral)}</p>
        </div>
      </div>
    </div>
  );
}
