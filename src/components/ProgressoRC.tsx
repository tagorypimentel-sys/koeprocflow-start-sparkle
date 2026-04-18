import { FLUXO_RC, RESPONSAVEL_STYLE, StatusRC, idxEtapa } from '@/lib/fluxoRC';

interface Props {
  statusAtual: StatusRC;
}

export default function ProgressoRC({ statusAtual }: Props) {
  const idxAtual = idxEtapa(statusAtual);
  const devolvida = statusAtual === 'devolvida';

  return (
    <div className="flex flex-col gap-0">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
        Progresso
      </p>

      {devolvida && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L1 13h12L7 1z" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7 5v3M7 10h.01" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs text-red-600 font-medium">
            RC devolvida ao solicitante para revisão
          </span>
        </div>
      )}

      {FLUXO_RC.map((etapa, idx) => {
        const concluida = devolvida
          ? idx < idxEtapa('aguardando_aprovacao')
          : idx < idxAtual;
        const atual = !devolvida && idx === idxAtual;
        const pendente = devolvida ? idx >= idxEtapa('aguardando_aprovacao') : idx > idxAtual;

        return (
          <div key={etapa.status} className="flex items-start gap-3">
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  concluida
                    ? 'bg-green-500 border-green-500'
                    : atual
                    ? 'bg-white border-blue-500'
                    : devolvida && idx === idxEtapa('aguardando_aprovacao')
                    ? 'bg-white border-red-400'
                    : 'bg-white border-gray-200'
                }`}
              >
                {concluida ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : devolvida && idx === idxEtapa('aguardando_aprovacao') ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2l-6 6" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : atual ? (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                ) : null}
              </div>

              {idx < FLUXO_RC.length - 1 && (
                <div
                  className={`w-px flex-1 my-0.5 transition-all ${concluida ? 'bg-green-300' : 'bg-gray-100'}`}
                  style={{ minHeight: 20 }}
                />
              )}
            </div>

            <div className={`pb-4 flex-1 flex items-center justify-between gap-2 ${pendente ? 'opacity-35' : ''}`}>
              <div>
                <p
                  className={`text-sm leading-tight ${
                    atual
                      ? 'font-semibold text-gray-900'
                      : concluida
                      ? 'font-medium text-gray-700'
                      : 'text-gray-400'
                  }`}
                >
                  {etapa.label}
                </p>
                {atual && <p className="text-xs text-gray-400 mt-0.5">{etapa.descricao}</p>}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${RESPONSAVEL_STYLE[etapa.responsavel]}`}
                >
                  {etapa.responsavel}
                </span>
                {atual && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                    Atual
                  </span>
                )}
                {devolvida && idx === idxEtapa('aguardando_aprovacao') && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                    Devolvida
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
