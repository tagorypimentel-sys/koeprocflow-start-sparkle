import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PurchaseRequest } from '@/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const STATUS_LABELS: Record<string, string> = {
  rascunho:                       'Rascunho',
  aguardando_aprovacao:           'Ag. Aprovação',
  aprovada:                       'Aprovada',
  aguardando_confirmacao_entrega: 'Ag. Entrega',
  entrega_confirmada:             'Entregue',
  nota_fiscal_recebida:           'NF Recebida',
  pagamento_realizado:            'Pago',
  nota_enviada_contador:          'Concluído',
  devolvida:                      'Devolvida',
};

const STATUS_COLORS: Record<string, string> = {
  rascunho:                       '#B4B2A9',
  aguardando_aprovacao:           '#BA7517',
  aprovada:                       '#1D9E75',
  aguardando_confirmacao_entrega: '#378ADD',
  entrega_confirmada:             '#378ADD',
  nota_fiscal_recebida:           '#7F77DD',
  pagamento_realizado:            '#7F77DD',
  nota_enviada_contador:          '#888780',
  devolvida:                      '#E24B4A',
};

const GARGALO_STATUS = [
  'aguardando_aprovacao',
  'devolvida',
  'aguardando_confirmacao_entrega',
  'nota_fiscal_recebida',
  'pagamento_realizado',
];

function fmt(v: number): string {
  if (v >= 1000000) return '€ ' + (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return '€ ' + (v / 1000).toFixed(0) + 'k';
  return '€ ' + Math.round(v).toLocaleString('de-DE');
}

function lineSubtotal(li: PurchaseRequest['lineItems'][number]): number {
  return li.unitPrice * li.qty * (1 - (li.discount ?? 0) / 100);
}

function calcTotal(rc: PurchaseRequest): number {
  const sub = rc.lineItems.reduce((a, li) => a + lineSubtotal(li), 0);
  return sub * (1 + (rc.tax ?? 0) / 100);
}

function calcByTipo(rc: PurchaseRequest, tipo: 'OPEX' | 'CAPEX'): number {
  const sub = rc.lineItems.reduce((a, li) => {
    if (li.item.tipo !== tipo) return a;
    return a + lineSubtotal(li);
  }, 0);
  return sub * (1 + (rc.tax ?? 0) / 100);
}

function parseDate(s?: string): Date {
  if (!s) return new Date(0);
  // suporta 'YYYY-MM-DD' e ISO
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function MetricCard({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p className="text-2xl font-medium text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs mt-1.5" style={{ color: subColor ?? '#888' }}>{sub}</p>}
    </div>
  );
}

export function DashboardPage({ onSelectRC }: Props) {
  const { rcs, currentUser } = useApp();
  const [drillTipo, setDrillTipo] = useState<'OPEX' | 'CAPEX' | null>(null);

  const requisicoes = useMemo(
    () => (currentUser.role.includes('solicitante') && !currentUser.role.includes('aprovador') ? rcs.filter((r) => r.requester.id === currentUser.id) : rcs),
    [rcs, currentUser]
  );

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const stats = useMemo(() => {
    const rcsMes    = requisicoes.filter(rc => { const d = parseDate(rc.createdAt); return d.getMonth() === mesAtual && d.getFullYear() === anoAtual; });
    const rcsMesAnt = requisicoes.filter(rc => { const d = parseDate(rc.createdAt); return d.getMonth() === (mesAtual === 0 ? 11 : mesAtual - 1) && d.getFullYear() === anoAtual; });

    const totalMes    = rcsMes.reduce((a, rc) => a + calcTotal(rc), 0);
    const totalMesAnt = rcsMesAnt.reduce((a, rc) => a + calcTotal(rc), 0);
    const totalAno    = requisicoes.reduce((a, rc) => a + calcTotal(rc), 0);
    const totalOpex   = requisicoes.reduce((a, rc) => a + calcByTipo(rc, 'OPEX'), 0);
    const totalCapex  = requisicoes.reduce((a, rc) => a + calcByTipo(rc, 'CAPEX'), 0);

    const varPct = totalMesAnt > 0 ? ((totalMes - totalMesAnt) / totalMesAnt * 100).toFixed(0) : null;

    const porMes = Array(12).fill(0);
    const porMesAnt = Array(12).fill(0);
    requisicoes.forEach(rc => {
      const d = parseDate(rc.createdAt);
      if (d.getFullYear() === anoAtual) porMes[d.getMonth()] += calcTotal(rc);
      if (d.getFullYear() === anoAtual - 1) porMesAnt[d.getMonth()] += calcTotal(rc);
    });

    const statusCount: Record<string, number> = {};
    requisicoes.forEach(rc => { statusCount[rc.status] = (statusCount[rc.status] ?? 0) + 1; });

    const porProjeto: Record<string, number> = {};
    requisicoes.forEach(rc => {
      if (rc.projectNumber) porProjeto[rc.projectNumber] = (porProjeto[rc.projectNumber] ?? 0) + calcTotal(rc);
    });
    const topProjetos = Object.entries(porProjeto).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const porForn: Record<string, number> = {};
    requisicoes.forEach(rc => {
      const nome = rc.supplier?.name;
      if (nome) porForn[nome] = (porForn[nome] ?? 0) + calcTotal(rc);
    });
    const topFornecedores = Object.entries(porForn).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const categoriasPorTipo: Record<string, Record<string, number>> = { OPEX: {}, CAPEX: {} };
    requisicoes.forEach(rc => {
      rc.lineItems.forEach((li) => {
        const tipo = li.item.tipo === 'CAPEX' ? 'CAPEX' : 'OPEX';
        const cat = li.item.classe || li.item.categoria || 'Outros';
        const val = lineSubtotal(li) * (1 + (rc.tax ?? 0) / 100);
        categoriasPorTipo[tipo][cat] = (categoriasPorTipo[tipo][cat] ?? 0) + val;
      });
    });

    const recent = [...requisicoes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

    return { totalMes, totalMesAnt, totalAno, totalOpex, totalCapex, varPct, porMes, porMesAnt, statusCount, topProjetos, topFornecedores, categoriasPorTipo, recent };
  }, [requisicoes, mesAtual, anoAtual]);

  const opexPct = stats.totalAno > 0 ? Math.round(stats.totalOpex / stats.totalAno * 100) : 0;
  const capexPct = 100 - opexPct;
  const maxProj = stats.topProjetos[0]?.[1] ?? 1;
  const maxForn = stats.topFornecedores[0]?.[1] ?? 1;
  const totalForn = stats.topFornecedores.reduce((a, [, v]) => a + v, 0);
  const maxGargalo = Math.max(...GARGALO_STATUS.map(s => stats.statusCount[s] ?? 0), 1);

  const drillData = useMemo(() => {
    if (!drillTipo) return null;
    const cats = stats.categoriasPorTipo[drillTipo] ?? {};
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [drillTipo, stats.categoriasPorTipo]);

  const DRILL_COLORS = ['#1D9E75','#5DCAA5','#9FE1CB','#1a2b6d','#378ADD','#B5D4F4','#7F77DD','#AFA9EC','#BA7517','#EF9F27'];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do sistema de compras</p>
      </div>

      {/* Modal drill-down */}
      <Dialog open={!!drillTipo} onOpenChange={(v) => { if (!v) setDrillTipo(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{drillTipo} — Gastos por categoria</DialogTitle>
          </DialogHeader>
          {drillData && drillData.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Nenhum dado disponível para {drillTipo}.</p>
          ) : drillData && (
            <div className="pt-2">
              <div className="flex gap-6 items-center">
                <div style={{width:160,height:160,flexShrink:0}}>
                  <Doughnut
                    data={{
                      labels: drillData.map(([k]) => k),
                      datasets: [{
                        data: drillData.map(([, v]) => v),
                        backgroundColor: DRILL_COLORS.slice(0, drillData.length),
                        borderWidth: 0,
                        hoverOffset: 4,
                      }],
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: true, cutout: '60%',
                      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.raw as number)}` } } },
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2.5">
                  {drillData.map(([cat, val], i) => {
                    const total = drillData.reduce((a, [, v]) => a + v, 0);
                    const pct = total > 0 ? Math.round(val / total * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{background: DRILL_COLORS[i % DRILL_COLORS.length]}}/>
                            {cat}
                          </span>
                          <span className="text-xs font-medium text-gray-700">{fmt(val)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${pct}%`, background: DRILL_COLORS[i % DRILL_COLORS.length]}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Comprometido este mês"
          value={fmt(stats.totalMes)}
          sub={stats.varPct !== null ? `${Number(stats.varPct) >= 0 ? '+' : ''}${stats.varPct}% vs mês anterior` : 'Sem dados anteriores'}
          subColor={stats.varPct !== null && Number(stats.varPct) >= 0 ? '#1D9E75' : '#E24B4A'}
        />
        <MetricCard
          label="Total acumulado (ano)"
          value={fmt(stats.totalAno)}
          sub={`${requisicoes.length} RC(s) no total`}
        />
        <MetricCard
          label="OPEX (ano)"
          value={fmt(stats.totalOpex)}
          sub={`${opexPct}% do total comprometido`}
          subColor="#1D9E75"
        />
        <MetricCard
          label="CAPEX (ano)"
          value={fmt(stats.totalCapex)}
          sub={`${capexPct}% do total comprometido`}
          subColor="#7F77DD"
        />
      </div>

      {/* Financeiro + OPEX vs CAPEX */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Comprometido por mês</p>
          <div className="flex gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:'#1a2b6d'}}/>Ano atual
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:'#B5D4F4'}}/>Ano anterior
            </span>
          </div>
          <div style={{height:180}}>
            <Bar
              data={{
                labels: MESES,
                datasets: [
                  { label: 'Ano atual',    data: stats.porMes,    backgroundColor: '#1a2b6d', borderRadius: 3 },
                  { label: 'Ano anterior', data: stats.porMesAnt, backgroundColor: '#B5D4F4', borderRadius: 3 },
                ],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.raw as number) } } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#888' } },
                  y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => fmt(v as number), font: { size: 10 }, color: '#888' } },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">OPEX vs CAPEX</p>
          <p className="text-xs text-gray-400 mb-3">Clique em OPEX ou CAPEX para ver por categoria</p>
          <div className="flex items-center gap-6">
            <div style={{width:140,height:140,flexShrink:0,position:'relative'}}>
              <Doughnut
                data={{
                  labels: ['OPEX','CAPEX'],
                  datasets: [{ data: [stats.totalOpex||1, stats.totalCapex||1], backgroundColor: ['#1D9E75','#7F77DD'], borderWidth: 0, hoverOffset: 6 }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: true, cutout: '68%',
                  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.raw as number) } } },
                  onClick: (_e, elements) => {
                    if (elements.length > 0) {
                      setDrillTipo(elements[0].index === 0 ? 'OPEX' : 'CAPEX');
                    }
                  },
                }}
                style={{cursor:'pointer'}}
              />
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                <p style={{fontSize:10,color:'#888'}}>Total</p>
                <p style={{fontSize:12,fontWeight:500,color:'#111'}}>{fmt(stats.totalAno)}</p>
              </div>
            </div>
            <div style={{flex:1}}>
              {[{label:'OPEX',val:stats.totalOpex,pct:opexPct,color:'#1D9E75'},{label:'CAPEX',val:stats.totalCapex,pct:capexPct,color:'#7F77DD'}].map(item=>(
                <div key={item.label} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:item.color}}/>
                      {item.label}
                    </span>
                    <span className="text-xs font-medium text-gray-700">{fmt(item.val)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${item.pct}%`,background:item.color}}/>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{item.pct}% do total</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gargalos + Projetos + Fornecedores */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Em processo</p>
          <div className="space-y-3">
            {GARGALO_STATUS.map(s => {
              const n = stats.statusCount[s] ?? 0;
              const pct = n / maxGargalo * 100;
              const cor = n > 3 ? '#E24B4A' : n > 1 ? '#BA7517' : '#888';
              return (
                <div key={s}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">{STATUS_LABELS[s]}</span>
                    <span className="text-base font-medium" style={{color:cor}}>{n}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:STATUS_COLORS[s]}}/>
                  </div>
                </div>
              );
            })}
          </div>
          {requisicoes.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-4">Nenhuma RC criada ainda</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Top projetos por valor</p>
          {stats.topProjetos.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8">Nenhum projeto encontrado</p>
          ) : (
            <div className="space-y-3">
              {stats.topProjetos.map(([proj, val]) => (
                <div key={proj} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 min-w-[60px]">{proj}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-800 rounded-full" style={{width:`${val/maxProj*100}%`}}/>
                  </div>
                  <span className="text-xs text-gray-500 min-w-[60px] text-right">{fmt(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Gastos por fornecedor</p>
          {stats.topFornecedores.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8">Nenhum fornecedor encontrado</p>
          ) : (
            <div className="space-y-3">
              {stats.topFornecedores.map(([nome, val]) => {
                const share = totalForn > 0 ? Math.round(val / totalForn * 100) : 0;
                const shortNome = nome.length > 20 ? nome.slice(0,19) + '…' : nome;
                return (
                  <div key={nome}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600 truncate max-w-[130px]" title={nome}>{shortNome}</span>
                      <span className="text-xs text-gray-400">{share}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${val/maxForn*100}%`,background:'#5DCAA5'}}/>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(val)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recentes */}
      {stats.recent.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-800">Requisições Recentes</h2>
          </div>
          {stats.recent.map((rc) => (
            <div
              key={rc.id}
              onClick={() => onSelectRC(rc)}
              className="px-5 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-blue-900">{rc.id}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{rc.projectClient} · {rc.supplier.name}</div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">{rc.createdAt}</div>
              <div className="text-sm font-bold text-gray-800 flex-shrink-0">{fmt(calcTotal(rc))}</div>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: STATUS_COLORS[rc.status] + '20', color: STATUS_COLORS[rc.status] }}
              >
                {STATUS_LABELS[rc.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
