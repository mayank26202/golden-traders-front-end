import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "../components/Layout";
import { usePartyLedgerQuery, usePartyNamesQuery } from "../app/api";
import { exportExcel, exportPdf } from "../lib/export";
import { formatDate } from "../lib/auth";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function Customers() {
  const [type, setType] = useState<"customer" | "supplier">("customer");
  const [name, setName] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Draft state for date inputs
  const [draftFrom, setDraftFrom] = useState(todayStr);
  const [draftTo, setDraftTo] = useState(todayStr);
  
  // Actual applied state
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: names } = usePartyNamesQuery(`?type=${type}`);
  const { data } = usePartyLedgerQuery(`?type=${type}&name=${encodeURIComponent(name)}&from=${from}&to=${to}`, { skip: !name });
  
  const allRows = data?.data || [];
  const cards = data?.cards || {};
  const totalPages = Math.max(1, Math.ceil(allRows.length / limit));
  const rows = allRows.slice((page - 1) * limit, page * limit);

  const download = (kind: "xlsx" | "pdf") => kind === "xlsx" ? exportExcel(`${type}-${name}-ledger`, allRows) : exportPdf(`${type}-${name}-ledger`, allRows);
  const money = (v: number) => `Rs. ${Number(v || 0).toLocaleString()}`;

  const applyFilters = () => {
    setFrom(draftFrom);
    setTo(draftTo);
    setPage(1);
  };

  const applyToday = () => {
    setDraftFrom(todayStr);
    setDraftTo(todayStr);
    setFrom(todayStr);
    setTo(todayStr);
    setPage(1);
  };

  const applyOverall = () => {
    setDraftFrom("");
    setDraftTo("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Customer & Supplier History" />
      <div className="panel mb-4 flex flex-wrap gap-3 items-end">
        <label className="grid gap-1.5"><span className="text-xs font-bold uppercase text-slate-500">Type</span>
          <select className="input" value={type} onChange={(e) => { setType(e.target.value as any); setName(""); }}>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
          </select>
        </label>
        <label className="grid gap-1.5 min-w-[200px]"><span className="text-xs font-bold uppercase text-slate-500">Name</span>
          <select className="input" value={name} onChange={(e) => setName(e.target.value)}>
            <option value="">Select {type}</option>
            {names?.data.map((n: any) => <option key={n._id} value={n.name}>{n.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5"><span className="text-xs font-bold uppercase text-slate-500">From</span>
          <input className="input" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
        </label>
        <label className="grid gap-1.5"><span className="text-xs font-bold uppercase text-slate-500">To</span>
          <input className="input" type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
        </label>
        <button className="btn bg-ink text-white hover:bg-slate-700 h-10" onClick={applyFilters}>Apply</button>
        <button className="btn btn-sky h-10" onClick={applyToday}>Today</button>
        <button className="btn bg-slate-200 text-slate-700 hover:bg-slate-300 h-10" onClick={applyOverall}>Overall</button>
      </div>
      
      {name && (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="panel border-l-4 border-sky">
              <div className="text-xs font-bold uppercase text-slate-500">Selected Period (Kg & {type === 'customer' ? 'Sales' : 'Purchase'})</div>
              <div className="mt-2 text-xl font-black">{cards.totalKg || 0} Kg / {money(cards.totalSales || cards.totalPurchase)}</div>
            </div>
            <div className="panel border-l-4 border-mint">
              <div className="text-xs font-bold uppercase text-slate-500">Selected Period Paid</div>
              <div className="mt-2 text-xl font-black">{money(cards.totalPaid)}</div>
            </div>
            <div className="panel border-l-4 border-amber">
              <div className="text-xs font-bold uppercase text-slate-500">Overall Pending</div>
              <div className="mt-2 text-xl font-black">{money((cards.overallSales || cards.overallPurchase || 0) - (cards.overallPaid || 0))}</div>
            </div>
          </div>
          
          <div className="panel mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-black">{name} Ledger</h2>
              <div className="flex gap-2">
                <button className="btn btn-sky" onClick={() => download("xlsx")}><Download size={15} /> Excel</button>
                <button className="btn btn-danger" onClick={() => download("pdf")}><Download size={15} /> PDF</button>
              </div>
            </div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr>{["Date", "Entry", "Kg", "Amount", "Method"].map((h) => <th className="th" key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r: any, i: number) => (
                    <tr key={`${r.type}-${r.date}-${i}`}>
                      <td className="td">{formatDate(r.date)}</td>
                      <td className="td font-semibold">{r.type}</td>
                      <td className="td">{r.kg || 0}</td>
                      <td className="td">{money(r.amount)}</td>
                      <td className="td">{r.method || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between p-3 text-sm mt-2 border-t">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button className="btn bg-slate-100" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                <button className="btn bg-slate-100" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          </div>
          
          <div className="panel mb-4">
            <h3 className="font-bold mb-2 text-slate-600 uppercase text-xs">Amount Trend (Selected Period)</h3>
            <div className="h-[200px]">
              <Bar 
                data={{
                  labels: allRows.map((r: any) => formatDate(r.date)).reverse(),
                  datasets: [
                    { label: 'Amount', data: allRows.map((r: any) => r.amount).reverse(), backgroundColor: '#38bdf8' }
                  ]
                }} 
                options={{ responsive: true, maintainAspectRatio: false }} 
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
