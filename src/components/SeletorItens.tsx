import { useState, useMemo } from "react";
import { useItens, CATEGORIAS, CLASSES } from "@/context/ItensContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { LineItem } from "@/types";

interface Props {
  onConfirmar: (itens: LineItem[]) => void;
  onCancelar: () => void;
}

const CATEGORIA_STYLE: Record<string, string> = {
  Tools: "bg-blue-50 text-blue-700 border-blue-200",
  Consumables: "bg-amber-50 text-amber-700 border-amber-200",
  Hospedagem: "bg-pink-50 text-pink-700 border-pink-200",
  Bagagem: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Aluguel Carro/Van": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Aluguel/Equipamentos": "bg-teal-50 text-teal-700 border-teal-200",
  Uniformes: "bg-orange-50 text-orange-700 border-orange-200",
};

const TIPO_STYLE: Record<string, string> = {
  OPEX: "bg-green-50 text-green-700 border-green-200",
  CAPEX: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function SeletorItens({ onConfirmar, onCancelar }: Props) {
  const { itens } = useItens();

  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterClasse, setFilterClasse] = useState<string>("all");
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [valores, setValores] = useState<
    Record<string, { qty: number; valorUnitario: number; desconto: number }>
  >({});
  const [etapa, setEtapa] = useState<"selecionar" | "preencher">("selecionar");

  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      const matchSearch =
        !search ||
        item.descricao.toLowerCase().includes(search.toLowerCase()) ||
        item.codigo.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategoria === "all" || item.categoria === filterCategoria;
      const matchClasse = filterClasse === "all" || item.classe === filterClasse;
      return matchSearch && matchCat && matchClasse;
    });
  }, [itens, search, filterCategoria, filterClasse]);

  const itensSelecionados = itens.filter((i) => selecionados[String(i.id)]);

  function toggleItem(id: string, item?: { precoUnitario: number }) {
    setSelecionados((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) {
        setValores((v) => {
          const nv = { ...v };
          delete nv[id];
          return nv;
        });
      } else {
        setValores((v) => ({
          ...v,
          [id]: v[id] ?? { qty: 1, valorUnitario: item?.precoUnitario ?? 0, desconto: 0 },
        }));
      }
      return next;
    });
  }

  function toggleAll() {
    const allSelected = itensFiltrados.every((i) => selecionados[String(i.id)]);
    const next: Record<string, boolean> = { ...selecionados };
    const nextVal = { ...valores };
    itensFiltrados.forEach((i) => {
      const key = String(i.id);
      if (allSelected) {
        next[key] = false;
        delete nextVal[key];
      } else {
        next[key] = true;
        if (!nextVal[key]) nextVal[key] = { qty: 1, valorUnitario: i.precoUnitario, desconto: 0 };
      }
    });
    setSelecionados(next);
    setValores(nextVal);
  }

  function setValorField(id: string, field: "qty" | "valorUnitario" | "desconto", value: number) {
    setValores((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function handleConfirmar() {
    const result: LineItem[] = itensSelecionados.map((item, idx) => {
      const v = valores[String(item.id)] ?? { qty: 1, valorUnitario: item.precoUnitario, desconto: 0 };
      return {
        id: Date.now() + idx,
        item,
        qty: v.qty,
        unitPrice: v.valorUnitario,
        discount: v.desconto,
      };
    });
    onConfirmar(result);
  }

  const totalSelecionados = itensSelecionados.length;
  const allVisibleSelected =
    itensFiltrados.length > 0 && itensFiltrados.every((i) => selecionados[String(i.id)]);

  const fmt = (v: number) =>
    v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (etapa === "selecionar") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar item..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="h-8 text-sm w-44">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterClasse} onValueChange={setFilterClasse}>
            <SelectTrigger className="h-8 text-sm w-44">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as classes</SelectItem>
              {CLASSES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterCategoria !== "all" || filterClasse !== "all" || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-400"
              onClick={() => {
                setSearch("");
                setFilterCategoria("all");
                setFilterClasse("all");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{itensFiltrados.length} item(s) encontrado(s)</span>
          {totalSelecionados > 0 && (
            <span className="text-blue-600 font-medium">{totalSelecionados} selecionado(s)</span>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Código</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Descrição</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Categoria</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Classe</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Tipo</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Unidade</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-8">
                      Nenhum item encontrado
                    </td>
                  </tr>
                ) : (
                  itensFiltrados.map((item) => {
                    const key = String(item.id);
                    const checked = !!selecionados[key];
                    return (
                      <tr
                        key={item.id}
                        className={`border-t border-gray-100 cursor-pointer transition-colors ${
                          checked ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => toggleItem(key, item)}
                      >
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={checked} onCheckedChange={() => toggleItem(key, item)} />
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-400">{item.codigo}</td>
                        <td className="px-3 py-2 font-medium text-gray-700 max-w-[220px]">
                          <div className="truncate" title={item.descricao}>
                            {item.descricao}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                              CATEGORIA_STYLE[item.categoria] ?? "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {item.categoria}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{item.classe}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                              TIPO_STYLE[item.tipo] ?? ""
                            }`}
                          >
                            {item.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{item.unidade}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <Button variant="outline" size="sm" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button size="sm" disabled={totalSelecionados === 0} onClick={() => setEtapa("preencher")}>
            Próximo — preencher valores ({totalSelecionados})
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        Preencha o <strong className="font-medium text-gray-700">preço unitário</strong>, a{" "}
        <strong className="font-medium text-gray-700">quantidade</strong> e o{" "}
        <strong className="font-medium text-gray-700">desconto</strong> para cada item selecionado.
      </p>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Descrição</th>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Cat.</th>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Classe</th>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Tipo</th>
                <th className="text-right px-3 py-2 font-normal text-gray-500">Qtd *</th>
                <th className="text-right px-3 py-2 font-normal text-gray-500">Valor Unit. (R$) *</th>
                <th className="text-right px-3 py-2 font-normal text-gray-500">Desc. %</th>
                <th className="text-right px-3 py-2 font-normal text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {itensSelecionados.map((item) => {
                const key = String(item.id);
                const v = valores[key] ?? { qty: 1, valorUnitario: item.precoUnitario, desconto: 0 };
                const comDesc = v.valorUnitario * (1 - v.desconto / 100);
                const total = comDesc * v.qty;
                return (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-700 max-w-[180px]">
                      <div className="truncate" title={item.descricao}>
                        {item.descricao}
                      </div>
                      <div className="text-gray-400 font-normal font-mono">{item.codigo}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                          CATEGORIA_STYLE[item.categoria] ?? "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {item.categoria}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{item.classe}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                          TIPO_STYLE[item.tipo] ?? ""
                        }`}
                      >
                        {item.tipo}
                      </span>
                    </td>
                    <td className="px-2 py-2" style={{ width: 72 }}>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 text-xs text-right"
                        value={v.qty}
                        onChange={(e) =>
                          setValorField(key, "qty", Math.max(1, Number(e.target.value)))
                        }
                      />
                    </td>
                    <td className="px-2 py-2" style={{ width: 130 }}>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          R$
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="h-8 text-xs text-right pl-7"
                          value={v.valorUnitario}
                          onChange={(e) =>
                            setValorField(key, "valorUnitario", Math.max(0, Number(e.target.value)))
                          }
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2" style={{ width: 80 }}>
                      <div className="flex items-center gap-0.5">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          className="h-8 text-xs text-right"
                          value={v.desconto}
                          onChange={(e) =>
                            setValorField(
                              key,
                              "desconto",
                              Math.min(100, Math.max(0, Number(e.target.value)))
                            )
                          }
                        />
                        <span className="text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-700">
                      {v.valorUnitario > 0 ? `R$ ${fmt(total)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-right text-sm text-gray-500">
        Total geral:{" "}
        <span className="font-medium text-gray-800">
          R$ {fmt(
            itensSelecionados.reduce((acc, item) => {
              const v = valores[String(item.id)] ?? { qty: 1, valorUnitario: item.precoUnitario, desconto: 0 };
              return acc + v.valorUnitario * (1 - v.desconto / 100) * v.qty;
            }, 0)
          )}
        </span>
      </div>

      <div className="flex justify-between items-center pt-1">
        <Button variant="outline" size="sm" onClick={() => setEtapa("selecionar")}>
          ← Voltar
        </Button>
        <Button size="sm" onClick={handleConfirmar}>
          Adicionar {totalSelecionados} item(s) à RC
        </Button>
      </div>
    </div>
  );
}
