import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const hiddenKeys = new Set(["_id", "id", "createdBy", "createdAt", "updatedAt", "__v"]);

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" }).replaceAll("/", "-");
}

function cleanRows(rows: Record<string, unknown>[]) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key, value]) => {
    if (hiddenKeys.has(key)) return false;
    if (value && typeof value === "object" && !Array.isArray(value)) return false;
    return true;
  }).map(([key, value]) => {
    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());
    if (key.toLowerCase().includes("date")) return [label, formatDate(value)];
    if (key.toLowerCase().includes("time")) return [label, String(value || "")];
    return [label, value ?? ""];
  })));
}

export function exportExcel(name: string, rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(cleanRows(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${name}.xlsx`);
}

export function exportPdf(name: string, rows: Record<string, unknown>[]) {
  const cleaned = cleanRows(rows);
  const doc = new jsPDF({ orientation: "landscape" });
  const head = [Object.keys(cleaned[0] || { empty: "" })];
  const body = cleaned.map((row) => Object.values(row).map((value) => String(value ?? "")));
  doc.text(name, 14, 14);
  autoTable(doc, { head, body, startY: 20, styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" }, headStyles: { fontSize: 7 } });
  doc.save(`${name}.pdf`);
}
