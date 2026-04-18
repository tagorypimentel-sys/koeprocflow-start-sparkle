// src/lib/gerarPDFRFQ.ts
// Dependência: npm install jspdf jspdf-autotable
// ─────────────────────────────────────────────────────────────────────────────
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RFQ } from "@/context/RFQContext";

export function gerarPDFRFQ(rfq: RFQ, nomeEmpresa = "KOE Syst Compras") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const AZUL = [30, 58, 138] as [number, number, number];
  const CINZA = [100, 100, 100] as [number, number, number];
  const CINZA_CLARO = [240, 242, 245] as [number, number, number];

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  // Faixa azul topo
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, W, 22, "F");

  // Nome da empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(nomeEmpresa, 12, 14);

  // Título RFQ
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("REQUEST FOR QUOTATION", W - 12, 9, { align: "right" });
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(rfq.numeroRFQ, W - 12, 18, { align: "right" });

  // ── Info do documento ──────────────────────────────────────────────────────
  let y = 30;
  doc.setTextColor(...CINZA);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  const campos = [
    ["Nº do Projeto", rfq.numeroProjeto],
    ["Data de Emissão", new Date(rfq.criadoEm).toLocaleDateString("pt-BR")],
    ["Prazo para Resposta", rfq.prazoResposta
      ? new Date(rfq.prazoResposta + "T00:00:00").toLocaleDateString("pt-BR")
      : "—"],
  ];

  campos.forEach(([label, valor], i) => {
    const x = 12 + i * 88;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CINZA);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.text(valor, x, y + 5);
    doc.setFontSize(8);
  });

  // Linha divisória
  y += 14;
  doc.setDrawColor(...CINZA_CLARO);
  doc.setLineWidth(0.3);
  doc.line(12, y, W - 12, y);
  y += 6;

  // ── Observações ────────────────────────────────────────────────────────────
  if (rfq.observacoes?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.text("OBSERVAÇÕES", 12, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    const linhas = doc.splitTextToSize(rfq.observacoes, W - 24);
    doc.text(linhas, 12, y);
    y += linhas.length * 4 + 4;
  }

  // ── Tabela de itens ────────────────────────────────────────────────────────
  const colunas = [
    { header: "Código",    dataKey: "codigo" },
    { header: "Descrição", dataKey: "descricao" },
    { header: "Categoria", dataKey: "categoria" },
    { header: "Classe",    dataKey: "classe" },
    { header: "Qtd",       dataKey: "qty" },
    { header: "Unidade",   dataKey: "unidade" },
    { header: "Link de Referência", dataKey: "link" },
  ];

  const linhas = rfq.itens.map((item, idx) => ({
    codigo:    item.codigo || `IT-${String(idx + 1).padStart(3, "0")}`,
    descricao: item.descricao,
    categoria: item.categoria,
    classe:    item.classe,
    qty:       item.qty,
    unidade:   item.unidade || "UN",
    link:      item.linkReferencia || "—",
  }));

  autoTable(doc, {
    startY: y,
    head: [colunas.map((c) => c.header)],
    body: linhas.map((l) => colunas.map((c) => (l as any)[c.dataKey])),
    margin: { left: 12, right: 12 },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: AZUL,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: CINZA_CLARO,
    },
    columnStyles: {
      0: { cellWidth: 22 },                  // Código
      1: { cellWidth: 70 },                  // Descrição
      2: { cellWidth: 28 },                  // Categoria
      3: { cellWidth: 28 },                  // Classe
      4: { cellWidth: 14, halign: "center" },// Qtd
      5: { cellWidth: 18, halign: "center" },// Unidade
      6: { cellWidth: "auto", textColor: [30, 58, 138] }, // Link (azul clicável)
    },
    // Torna o link clicável no PDF
    didDrawCell: (data) => {
      if (data.column.index === 6 && data.section === "body") {
        const url = String(data.cell.raw ?? "");
        if (url.startsWith("http")) {
          doc.link(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            { url }
          );
        }
      }
    },
  });

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const yRodape = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${nomeEmpresa} · ${rfq.numeroRFQ} · Emitido em ${new Date().toLocaleDateString("pt-BR")}`,
      12,
      yRodape
    );
    doc.text(`Página ${i} / ${pageCount}`, W - 12, yRodape, { align: "right" });
  }

  // ── Nome do arquivo: RFQ-{projeto}-{seq}.pdf ──────────────────────────────
  const nomeArquivo = `${rfq.numeroRFQ}.pdf`;
  doc.save(nomeArquivo);
}
