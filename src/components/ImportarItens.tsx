import { useState, useRef } from 'react';
import { useItens } from '@/context/ItensContext';
import { CATEGORIAS, CLASSES } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

const TYPE_MAP: Record<string, string> = {
  'Polishment': 'Polish',
  'Cordelless': 'Cordless',
  'Pneumatica': 'Pneumatics',
  'Pneumatica ': 'Pneumatics',
};

const VALID_CATEGORIAS = CATEGORIAS as readonly string[];
const VALID_CLASSES = CLASSES as readonly string[];

interface PreviewItem {
  codigo: string;
  descricao: string;
  marca?: string;
  unidade: string;
  precoUnitario: number;
  categoria: string;
  classe: string;
  tipo: 'OPEX' | 'CAPEX';
  linkReferencia?: string;
  valid: boolean;
  errors: string[];
}

export default function ImportarItens({ onClose }: { onClose?: () => void }) {
  const { addItems, itens } = useItens();
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function normalize(raw: any): PreviewItem {
    const errors: string[] = [];
    const categoria = String(raw.categoria ?? '').trim();
    const classeRaw = String(raw.classe ?? '').trim();
    const classe = TYPE_MAP[classeRaw] ?? classeRaw;
    const desc = String(raw.descricao ?? '').trim();
    const tipo = (String(raw.tipo ?? 'OPEX').trim().toUpperCase() === 'CAPEX' ? 'CAPEX' : 'OPEX') as 'OPEX' | 'CAPEX';
    const marca = String(raw.marca ?? '').trim();
    const unidade = String(raw.unidade ?? '').trim() || 'UN';
    const preco = Number(raw.precoUnitario ?? 0) || 0;
    const idHint = Number(raw.id) || 0;
    const codigo = String(raw.codigo ?? (idHint ? `IT-${String(idHint).padStart(3, '0')}` : '')).trim();
    const link = String(raw.linkReferencia ?? '').trim();

    if (!desc) errors.push('Descrição vazia');
    if (!VALID_CATEGORIAS.includes(categoria)) errors.push(`Categoria inválida: "${categoria}"`);
    if (!VALID_CLASSES.includes(classe)) errors.push(`Classe inválida: "${classeRaw}"`);

    return {
      codigo, descricao: desc,
      marca: marca && marca !== 'Not Applicable' ? marca : undefined,
      unidade, precoUnitario: Math.round(preco * 100) / 100,
      categoria, classe, tipo,
      linkReferencia: link || undefined,
      valid: errors.length === 0, errors,
    };
  }

  function parseJSON(text: string) {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        toast.error('JSON deve ser um array de itens.');
        return;
      }
      setPreview(data.map(normalize));
    } catch {
      toast.error('JSON inválido.');
    }
  }

  function parseExcel(buffer: ArrayBuffer) {
    try {
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // Detectar cabeçalho (linha contendo "Description" ou "Descrição")
      let headerRow = -1;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].map((c: any) => String(c).trim().toLowerCase());
        if (r.some((c) => c === 'description' || c === 'descrição' || c === 'descricao')) {
          headerRow = i;
          break;
        }
      }
      if (headerRow === -1) {
        toast.error('Cabeçalho não encontrado (precisa ter coluna Description/Descrição).');
        return;
      }

      const headers = rows[headerRow].map((c: any) => String(c).trim().toLowerCase());
      const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));
      const idxID = idx(['id']);
      const idxCodigo = idx(['código', 'codigo', 'code']);
      const idxCat = idx(['category', 'categoria']);
      const idxType = idx(['type', 'classe']);
      const idxDesc = idx(['description', 'descrição', 'descricao']);
      const idxBrand = idx(['brand', 'marca']);
      const idxUnid = idx(['unidade', 'unit']);
      const idxPreco = idx(['preco usd amazon', 'preço unit.', 'precounitario', 'preco unitario', 'price']);
      const idxTipo = idx(['tipo', 'opex/capex']);
      const idxLink = idx(['link', 'linkreferencia', 'link de referência', 'url', 'referência']);

      const parsed: PreviewItem[] = [];
      for (let i = headerRow + 1; i < rows.length; i++) {
        const row = rows[i];
        const idVal = idxID >= 0 ? String(row[idxID] ?? '').trim() : String(parsed.length + 1);
        if (idxID >= 0 && (!idVal || isNaN(Number(idVal)))) continue;
        const id = Number(idVal) || parsed.length + 1;
        parsed.push(normalize({
          id,
          codigo: idxCodigo >= 0 ? row[idxCodigo] : `IT-${String(id).padStart(3, '0')}`,
          categoria: idxCat >= 0 ? row[idxCat] : '',
          classe: idxType >= 0 ? row[idxType] : '',
          descricao: idxDesc >= 0 ? row[idxDesc] : '',
          marca: idxBrand >= 0 ? row[idxBrand] : '',
          unidade: idxUnid >= 0 ? row[idxUnid] : 'UN',
          precoUnitario: idxPreco >= 0 ? row[idxPreco] : 0,
          tipo: idxTipo >= 0 ? row[idxTipo] : 'OPEX',
          linkReferencia: idxLink >= 0 ? row[idxLink] : '',
        }));
      }
      setPreview(parsed);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao ler Excel. Verifique o formato.');
    }
  }

  function parseFile(file: File) {
    const reader = new FileReader();
    if (file.name.toLowerCase().endsWith('.json')) {
      reader.onload = (e) => parseJSON(String(e.target?.result ?? ''));
      reader.readAsText(file);
    } else {
      reader.onload = (e) => parseExcel(e.target?.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    const existingCodes = new Set(itens.map((i) => i.codigo));
    const validos = preview.filter((p) => p.valid && !existingCodes.has(p.codigo));
    const duplicados = preview.filter((p) => p.valid && existingCodes.has(p.codigo));

    try {
      const payload = validos.map((p) => ({
        codigo: p.codigo,
        descricao: p.descricao,
        marca: p.marca,
        unidade: p.unidade,
        precoUnitario: p.precoUnitario,
        categoria: p.categoria as any,
        classe: p.classe as any,
        tipo: p.tipo,
        linkReferencia: p.linkReferencia,
      }));
      await addItems(payload);
      setImportedCount(validos.length);
      if (validos.length > 0) toast.success(`${validos.length} item(s) importado(s)!`);
      if (duplicados.length > 0) toast.warning(`${duplicados.length} ignorado(s) por código duplicado.`);
      setDone(true);
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao importar: ${err?.message ?? 'falha desconhecida'}`);
    } finally {
      setImporting(false);
    }
  }

  const validos = preview?.filter((p) => p.valid).length ?? 0;
  const invalidos = preview?.filter((p) => !p.valid).length ?? 0;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <CheckCircle className="text-green-500" size={48} />
        <p className="text-lg font-medium text-gray-800">Importação concluída!</p>
        <p className="text-sm text-gray-500">{validos} item(s) adicionados.</p>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!preview ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet size={36} className="text-gray-400" />
          <p className="text-sm font-medium text-gray-600">Arraste um arquivo Excel ou JSON, ou clique para selecionar</p>
          <p className="text-xs text-gray-400">Formatos: .xlsx, .xls, .json</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.json" className="hidden" onChange={handleFile} />
        </div>
      ) : (
        <>
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-green-50 border border-green-100 p-3 text-center">
              <p className="text-2xl font-medium text-green-700">{validos}</p>
              <p className="text-xs text-green-600">prontos para importar</p>
            </div>
            <div className="flex-1 rounded-lg bg-red-50 border border-red-100 p-3 text-center">
              <p className="text-2xl font-medium text-red-600">{invalidos}</p>
              <p className="text-xs text-red-500">com erros (serão ignorados)</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-auto max-h-72">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">Código</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">Descrição</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">Categoria</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-normal">Classe</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-normal">Preço</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item, idx) => (
                  <tr key={`${item.codigo}-${idx}`} className={`border-t border-gray-100 ${!item.valid ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-1.5 font-mono text-gray-400">{item.codigo}</td>
                    <td className="px-3 py-1.5 text-gray-700 max-w-[240px] truncate">{item.descricao}</td>
                    <td className="px-3 py-1.5 text-gray-600">{item.categoria}</td>
                    <td className="px-3 py-1.5 text-gray-600">{item.classe}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">
                      {item.precoUnitario > 0 ? item.precoUnitario.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {item.valid ? (
                        <CheckCircle size={13} className="text-green-500 inline" />
                      ) : (
                        <span title={item.errors.join(', ')}>
                          <AlertCircle size={13} className="text-red-400 inline cursor-help" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPreview(null)}>Escolher outro arquivo</Button>
            <Button onClick={handleImport} disabled={importing || validos === 0} className="gap-2">
              <Upload size={14} />
              {importing ? 'Importando...' : `Importar ${validos} item(s)`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
