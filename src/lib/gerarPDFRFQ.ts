// Dependência: npm install jspdf jspdf-autotable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RFQ } from "@/context/RFQContext";

function fmtData(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

export function gerarPDFRFQ(rfq: RFQ) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const AZUL_ESCURO: [number, number, number] = [10, 36, 99];
  const AZUL_MEDIO: [number, number, number] = [30, 64, 175];
  const CINZA: [number, number, number] = [90, 90, 90];
  const CINZA_CLARO: [number, number, number] = [243, 244, 246];
  const BRANCO: [number, number, number] = [255, 255, 255];

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  // Faixa azul escura
  doc.setFillColor(...AZUL_ESCURO);
  doc.rect(0, 0, W, 28, "F");

  // Faixa azul médio à direita (destaque RFQ)
  doc.setFillColor(...AZUL_MEDIO);
  doc.rect(W - 80, 0, 80, 28, "F");

  // Nome empresa (esquerda)
  doc.setTextColor(...BRANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("KESSLER", 12, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Procurement Flow", 12, 19);

  // Título RFQ (direita)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RFQ — REQUEST FOR QUOTATION", W - 12, 10, { align: "right" });

  doc.setFontSize(16);
  doc.text(rfq.numeroRFQ, W - 12, 22, { align: "right" });

  // ── Bloco de informações ───────────────────────────────────────────────────
  let y = 36;

  // Fundo cinza claro para bloco de info
  doc.setFillColor(...CINZA_CLARO);
  doc.roundedRect(10, y, W - 20, 22, 2, 2, "F");

  const infos = [
    { label: "Nº DO PROJETO", valor: rfq.numeroProjeto },
    { label: "NOME DO PROJETO", valor: rfq.nomeProjeto || "—" },
    { label: "DATA DE EMISSÃO", valor: fmtData(rfq.dataEmissao) },
    { label: "ENTREGA LIMITE", valor: fmtData(rfq.dataLimiteEntrega) },
  ];

  const colW = (W - 20) / infos.length;
  infos.forEach((info, i) => {
    const x = 14 + i * colW;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text(info.label, x, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(info.valor, x, y + 16);
  });

  y += 28;

  // ── Observações ────────────────────────────────────────────────────────────
  if (rfq.observacoes?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text("OBSERVAÇÕES", 12, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    const linhas = doc.splitTextToSize(rfq.observacoes.trim(), W - 24);
    doc.text(linhas, 12, y);
    y += linhas.length * 4 + 4;
  }

  // ── Tabela de itens ────────────────────────────────────────────────────────
  const rows = rfq.itens.map((item, idx) => [
    item.codigo || `IT-${String(idx + 1).padStart(3, "0")}`,
    item.descricao,
    String(item.qty),
    item.unidade || "UN",
    item.referencia ? "🔗 Ver Referência" : "—",
  ]);

  // Guarda as URLs separadamente para o didDrawCell
  const urls = rfq.itens.map((item) => item.referencia || "");

  autoTable(doc, {
    startY: y,
    head: [["Código", "Descrição", "Qtd", "Unidade", "Referência"]],
    body: rows,
    margin: { left: 10, right: 10 },
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: [30, 30, 30],
      lineColor: [220, 222, 226],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: AZUL_ESCURO,
      textColor: BRANCO,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252],
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: "bold" },
      1: { cellWidth: 100 },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 32, halign: "center", textColor: AZUL_MEDIO, fontStyle: "bold" },
    },
    // Renderiza o link clicável sobre o texto "Ver Referência"
    didDrawCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        const url = urls[data.row.index];
        if (url && url.startsWith("http")) {
          // Sublinha o texto
          const x = data.cell.x + 2;
          const y2 = data.cell.y + data.cell.height - 3;
          const w = data.cell.width - 4;
          doc.setDrawColor(...AZUL_MEDIO);
          doc.setLineWidth(0.3);
          doc.line(x, y2, x + w, y2);
          // Link clicável
          doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
        }
      }
    },
  });

  // ── Rodapé em todas as páginas ─────────────────────────────────────────────
  const totalPaginas = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    const yRod = H - 7;
    doc.setFillColor(...AZUL_ESCURO);
    doc.rect(0, H - 12, W, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...BRANCO);
    doc.text(
      `Kessler · ${rfq.numeroRFQ} · Emitido em ${new Date().toLocaleDateString("pt-BR")}`,
      12, yRod
    );
    doc.text(`Página ${i} / ${totalPaginas}`, W - 12, yRod, { align: "right" });
  }

  // Nome do arquivo: RFQ-7025-01.pdf
  doc.save(`${rfq.numeroRFQ}.pdf`);
}
