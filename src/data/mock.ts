import { Item, Categoria, Classe, Tipo } from '../types';
import itensSeed from './itens_seed.json';

export const MOCK_ITEMS: Item[] = (itensSeed as Array<{
  id: number; codigo: string; descricao: string; marca?: string; unidade: string;
  precoUnitario: number; categoria: string; classe: string; tipo: string;
  linkReferencia?: string;
}>).map((i) => ({
  id: String(i.id),
  codigo: i.codigo,
  descricao: i.descricao,
  marca: i.marca && i.marca !== 'Not Applicable' ? i.marca : undefined,
  unidade: i.unidade || 'UN',
  precoUnitario: i.precoUnitario || 0,
  categoria: i.categoria as Categoria,
  classe: i.classe as Classe,
  tipo: i.tipo as Tipo,
  linkReferencia: i.linkReferencia,
}));
