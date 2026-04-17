import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseRequest } from '@/types';
import kesslerLogo from '@/assets/kessler-logo.png';

const NAVY: [number, number, number] = [30, 58, 138]; // #1e3a8a
const GRAY: [number, number, number] = [107, 114, 128]; // #6b7280
const LIGHT: [number, number, number] = [243, 244, 246]; // #f3f4f6

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () =>
  new Date().toLocaleDateString('pt-BR');

export interface POTotals {
  subtotal: number;
  taxAmt: number;
  total: number;
}

export function generatePOPdf(rc: PurchaseRequest, totals: POTotals) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ===== Header band (white area for logo + navy band for title) =====
  // White top strip behind logo
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, 22, 'F');

  // Kessler logo (top-left, on white)
  try {
    doc.addImage(kesslerLogo, 'PNG', margin, 3, 18, 18);
  } catch (e) {
    console.warn('Falha ao adicionar logo Kessler:', e);
  }

  // Company info block next to logo
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Kessler Group', margin + 22, 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('Av Brasil, 4577, Sala 2, Rio de Janeiro', margin + 22, 14);
  doc.text('compras@kessleroffshore.com.br', margin + 22, 19);

  // Navy band with PO title below
  doc.setFillColor(...NAVY);
  doc.rect(0, 22, pageW, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PEDIDO DE COMPRA', margin, 31);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const poText = rc.poNumber || '—';
  const poW = doc.getTextWidth(poText);
  doc.text(poText, pageW - margin - poW, 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const dateLabel = `Emitido em ${today()}`;
  const dW = doc.getTextWidth(dateLabel);
  doc.text(dateLabel, pageW - margin - dW, 18);
  doc.setTextColor(...GRAY);

  let y = 46;

  // ===== Metadata block (2 columns) =====
  const labelValue = (label: string, value: string, x: number, yy: number, maxW = 80) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(label.toUpperCase(), x, yy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(value || '—', maxW);
    doc.text(lines, x, yy + 4.5);
    return 4.5 + lines.length * 4;
  };

  const colW = (pageW - margin * 2) / 2;
  const leftX = margin;
  const rightX = margin + colW;

  const meta: Array<[string, string]> = [
    ['Solicitante', rc.requester.name],
    ['Aprovado em', rc.approvedAt || today()],
  ];

  let leftY = y;
  let rightY = y;
  meta.forEach((m, i) => {
    if (i % 2 === 0) {
      const h = labelValue(m[0], m[1], leftX, leftY, colW - 5);
      leftY += h + 3;
    } else {
      const h = labelValue(m[0], m[1], rightX, rightY, colW - 5);
      rightY += h + 3;
    }
  });

  y = Math.max(leftY, rightY) + 2;

  // ===== Supplier block =====
  doc.setFillColor(...LIGHT);
  doc.rect(margin, y, pageW - margin * 2, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text('FORNECEDOR', margin + 3, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(rc.supplier.name, margin + 3, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  const supLine1 = `CNPJ: ${rc.supplier.cnpj}   ·   Contato: ${rc.supplier.contact}   ·   Tel: ${rc.supplier.phone}`;
  doc.text(supLine1, margin + 3, y + 16);
  if (rc.supplier.address) {
    const addr = doc.splitTextToSize(rc.supplier.address, pageW - margin * 2 - 6);
    doc.text(addr, margin + 3, y + 21);
  }

  y += 32;

  // ===== Delivery mode block =====
  const deliveryText =
    rc.deliveryMode === 'retirada'
      ? 'Retirada na loja pelo solicitante'
      : rc.deliveryCarrier === 'transportadora'
      ? 'Entrega via transportadora (a contratar pelo solicitante)'
      : 'Entrega pelo fornecedor';

  const addrLines =
    rc.deliveryMode === 'entrega' && rc.deliveryAddress
      ? doc.splitTextToSize(`Endereço: ${rc.deliveryAddress}`, pageW - margin * 2 - 6)
      : [];
  const blockH = 14 + (addrLines.length ? addrLines.length * 4 + 2 : 0);

  doc.setFillColor(...LIGHT);
  doc.rect(margin, y, pageW - margin * 2, blockH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text('MODALIDADE DE ENTREGA', margin + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(deliveryText, margin + 3, y + 11);

  if (addrLines.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(addrLines, margin + 3, y + 16);
  }

  y += blockH + 6;

  // ===== Items table =====
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Código', 'Descrição', 'Qtd', 'Unit. (R$)', 'Desc.', 'Total (R$)']],
    body: rc.lineItems.map((li) => {
      const t = li.unitPrice * li.qty * (1 - li.discount / 100);
      return [
        li.item.code,
        li.item.name,
        String(li.qty),
        fmt(li.unitPrice),
        li.discount > 0 ? `${li.discount}%` : '—',
        fmt(t),
      ];
    }),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5, textColor: [30, 30, 30] },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  // @ts-ignore - autotable adds lastAutoTable
  y = (doc as any).lastAutoTable.finalY + 6;

  // ===== Totals =====
  const totalsX = pageW - margin - 70;
  const valX = pageW - margin;
  const totalsRow = (label: string, value: string, bold = false, big = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(big ? 12 : 9.5);
    doc.setTextColor(big ? NAVY[0] : 80, big ? NAVY[1] : 80, big ? NAVY[2] : 80);
    doc.text(label, totalsX, y);
    doc.setTextColor(big ? NAVY[0] : 20, big ? NAVY[1] : 20, big ? NAVY[2] : 20);
    const vW = doc.getTextWidth(value);
    doc.text(value, valX - vW, y);
    y += big ? 7 : 5.2;
  };

  totalsRow('Subtotal', `R$ ${fmt(totals.subtotal)}`);
  totalsRow(`Impostos (${rc.tax}%)`, `R$ ${fmt(totals.taxAmt)}`);
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(totalsX, y - 2, valX, y - 2);
  y += 1;
  totalsRow('TOTAL', `R$ ${fmt(totals.total)}`, true, true);

  // ===== Notes =====
  if (rc.notes) {
    y += 4;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(252, 211, 77);
    const noteLines = doc.splitTextToSize(rc.notes, pageW - margin * 2 - 6);
    const boxH = 8 + noteLines.length * 4;
    doc.rect(margin, y, pageW - margin * 2, boxH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text('OBSERVAÇÕES', margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 53, 15);
    doc.text(noteLines, margin + 3, y + 10);
    y += boxH;
  }

  // ===== Footer on every page =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text('Documento gerado automaticamente por Kessler Group · ProcureFlow', margin, pageH - 9);
    const pg = `Página ${i} de ${pageCount}`;
    const pgW = doc.getTextWidth(pg);
    doc.text(pg, pageW - margin - pgW, pageH - 9);
  }

  const fileName = `${rc.poNumber || rc.id}.pdf`;
  doc.save(fileName);
}
