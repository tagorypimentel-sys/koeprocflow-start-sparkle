import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RFQ } from '@/context/RFQContext';

const NAVY: [number, number, number] = [30, 58, 138];
const GRAY: [number, number, number] = [107, 114, 128];
const LIGHT: [number, number, number] = [243, 244, 246];

const fmtData = (iso?: string) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

export function gerarPDFRFQ(rfq: RFQ) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Cabeçalho
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('REQUEST FOR QUOTATION (RFQ)', margin, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(rfq.numeroRFQ, pageW - margin, 14, { align: 'right' });

  // Bloco de info
  let y = 32;
  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJETO', margin, y);
  doc.text('EMITIDO EM', margin + 70, y);
  doc.text('ENTREGA LIMITE', margin + 130, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  doc.text(`${rfq.numeroProjeto} ${rfq.nomeProjeto ? '— ' + rfq.nomeProjeto : ''}`, margin, y + 6);
  doc.text(fmtData(rfq.dataEmissao), margin + 70, y + 6);
  doc.text(fmtData(rfq.dataLimiteEntrega), margin + 130, y + 6);

  y += 16;

  // Tabela de itens
  autoTable(doc, {
    startY: y,
    head: [['#', 'Código', 'Descrição', 'Unidade', 'Qtd', 'Referência']],
    body: rfq.itens.map((it, i) => [
      String(i + 1),
      it.codigo,
      it.descricao,
      it.unidade,
      String(it.qty),
      it.referencia || '—',
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      4: { halign: 'right', cellWidth: 18 },
    },
  });

  let finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;

  // Observações
  if (rfq.observacoes && rfq.observacoes.trim()) {
    finalY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('OBSERVAÇÕES', margin, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(rfq.observacoes, pageW - margin * 2);
    doc.text(lines, margin, finalY + 5);
  }

  doc.save(`${rfq.numeroRFQ}.pdf`);
}
