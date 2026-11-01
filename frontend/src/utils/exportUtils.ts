import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportXlsx(rows: Record<string, unknown>[], fileName: string, sheetName = 'Data') {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportPdf(title: string, rows: Record<string, unknown>[], fileName: string) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  doc.setFontSize(9);
  doc.text('Synthetic demonstration data', 14, 20);
  const head = [rows.length ? Object.keys(rows[0]) : []];
  const body = rows.map((r) => Object.values(r).map((v) => String(v ?? '')));
  autoTable(doc, {
    startY: 25,
    head,
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [11, 36, 71] }
  });
  doc.save(`${fileName}.pdf`);
}