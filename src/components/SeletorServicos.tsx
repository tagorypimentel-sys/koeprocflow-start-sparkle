import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineItem, Item } from "@/types";
import { Plus, Trash2 } from "lucide-react";

interface ServicoLinha {
  id: string;
  descricao: string;
  valorUnitario: number;
  qty: number;
}

interface Props {
  onConfirmar: (itens: LineItem[]) => void;
  onCancelar: () => void;
}

const SERVICO_CATEGORIA = "Serviços" as const;

/** Cria um Item "virtual" para representar um serviço */
function criarItemServico(descricao: string): Item {
  return {
    id: Date.now(),
    codigo: "SVC",
    descricao: descricao || "Serviço",
    unidade: "un",
    precoUnitario: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categoria: SERVICO_CATEGORIA as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classe: "General" as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tipo: "OPEX" as any,
  };
}

function novaLinha(): ServicoLinha {
  return { id: crypto.randomUUID(), descricao: "", valorUnitario: 0, qty: 1 };
}

const fmt = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SeletorServicos({ onConfirmar, onCancelar }: Props) {
  const [linhas, setLinhas] = useState<ServicoLinha[]>([novaLinha()]);

  const update = (id: string, field: keyof ServicoLinha, value: string | number) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const addLinha = () => setLinhas((prev) => [...prev, novaLinha()]);

  const removeLinha = (id: string) => {
    if (linhas.length === 1) return; // manter pelo menos 1 linha
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  };

  const totalGeral = linhas.reduce((acc, l) => acc + l.valorUnitario * l.qty, 0);

  const podeConfirmar = linhas.some((l) => l.descricao.trim() && l.valorUnitario > 0);

  const handleConfirmar = () => {
    const linhasValidas = linhas.filter((l) => l.descricao.trim() && l.valorUnitario > 0);
    const result: LineItem[] = linhasValidas.map((l, idx) => ({
      id: Date.now() + idx,
      item: criarItemServico(l.descricao.trim()),
      qty: l.qty,
      unitPrice: l.valorUnitario,
      discount: 0,
      isServico: true,
    }));
    onConfirmar(result);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho informativo */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3">
        <p className="text-sm font-semibold text-violet-800 mb-0.5">
          🛠️ Compra de Serviços
        </p>
        <p className="text-xs text-violet-600">
          Descreva cada serviço a ser contratado. Adicione quantas linhas forem necessárias.
        </p>
      </div>

      {/* Tabela de linhas */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 w-[50%]">
                Descrição do Serviço <span className="text-red-500">*</span>
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 w-[12%]">
                Qtd
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 w-[20%]">
                Valor Unit. (€) <span className="text-red-500">*</span>
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 w-[15%]">
                Total (€)
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, idx) => {
              const lineTotal = linha.valorUnitario * linha.qty;
              return (
                <tr key={linha.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  {/* nº da linha */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-mono text-xs w-5 shrink-0 text-right">
                        {idx + 1}
                      </span>
                      <Input
                        placeholder={`Ex: Serviço de Fabricação de Peça`}
                        className="h-8 text-xs"
                        value={linha.descricao}
                        onChange={(e) => update(linha.id, "descricao", e.target.value)}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min={1}
                      className="h-8 text-xs text-right"
                      value={linha.qty}
                      onChange={(e) =>
                        update(linha.id, "qty", Math.max(1, Number(e.target.value)))
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        €
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8 text-xs text-right pl-7"
                        value={linha.valorUnitario === 0 ? "" : linha.valorUnitario}
                        placeholder="0,00"
                        onChange={(e) =>
                          update(linha.id, "valorUnitario", Math.max(0, Number(e.target.value)))
                        }
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-700">
                    {lineTotal > 0 ? `€ ${fmt(lineTotal)}` : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeLinha(linha.id)}
                      disabled={linhas.length === 1}
                      className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Botão adicionar linha */}
      <button
        type="button"
        onClick={addLinha}
        className="flex items-center gap-1.5 text-xs text-violet-700 hover:text-violet-900 font-medium transition-colors w-fit"
      >
        <Plus size={13} />
        Adicionar linha de serviço
      </button>

      {/* Total geral */}
      <div className="text-right text-sm text-gray-500 border-t border-gray-100 pt-3">
        Total geral:{" "}
        <span className="font-semibold text-gray-800">€ {fmt(totalGeral)}</span>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button
          size="sm"
          disabled={!podeConfirmar}
          onClick={handleConfirmar}
          className="bg-violet-700 hover:bg-violet-800 text-white"
        >
          Adicionar Serviços à RC
        </Button>
      </div>
    </div>
  );
}
