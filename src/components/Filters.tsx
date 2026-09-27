import { Download, FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { exportExcel, exportPdf } from "../lib/export";

export function Filters({ query, setQuery, rows, name, create }: { query: URLSearchParams; setQuery: (q: URLSearchParams) => void; rows: any[]; name: string; create?: React.ReactNode }) {
  const [draft, setDraft] = useState({
    search: query.get("search") || "",
    from: query.get("from") || "",
    to: query.get("to") || "",
  });
  useEffect(() => {
    setDraft({ search: query.get("search") || "", from: query.get("from") || "", to: query.get("to") || "" });
  }, [query]);
  const apply = () => {
    const next = new URLSearchParams();
    if (draft.search.trim()) next.set("search", draft.search.trim());
    if (draft.from) next.set("from", draft.from);
    if (draft.to) next.set("to", draft.to);
    setQuery(next);
  };
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="panel mb-4 flex flex-wrap items-end gap-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-bold uppercase text-slate-500">Search</span>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input className="field w-64 pl-10" placeholder="Search name" value={draft.search} onChange={(e) => setDraft({ ...draft, search: e.target.value })} />
        </div>
      </label>
      <label className="grid gap-1.5"><span className="text-xs font-bold uppercase text-slate-500">From</span><input className="field" type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></label>
      <label className="grid gap-1.5"><span className="text-xs font-bold uppercase text-slate-500">To</span><input className="field" type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></label>
      <button className="btn bg-ink text-white hover:bg-slate-700" onClick={apply}>Apply</button>
      <button className="btn btn-sky" onClick={() => { setDraft({ ...draft, from: today, to: today }); const next = new URLSearchParams(); if (draft.search.trim()) next.set("search", draft.search.trim()); next.set("from", today); next.set("to", today); setQuery(next); }}>Today</button>
      <button className="btn bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => { setDraft({ search: "", from: "", to: "" }); setQuery(new URLSearchParams()); }}>Clear</button>
      <button className="btn btn-sky" onClick={() => exportExcel(name, rows)}><Download size={16} /> Excel</button>
      <button className="btn btn-amber" onClick={() => exportPdf(name, rows)}><FileText size={16} /> PDF</button>
      {create}
    </div>
  );
}
