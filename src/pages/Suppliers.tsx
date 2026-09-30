import { useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { PageHeader } from "../components/Layout";
import { Filters } from "../components/Filters";
import { Modal } from "../components/Modal";
import { useCreatePartyNameMutation, useCreateSupplierMutation, useDeleteSupplierMutation, usePartyNamesQuery, useSupplierHistoryQuery, useSuppliersQuery, useUpdateSupplierMutation } from "../app/api";
import { Field, TextInput, parseAmount } from "../components/FormField";
import { can, formatDate, toDateInput } from "../lib/auth";
import type { RootState } from "../app/store";
import type { SupplierEntry } from "../lib/types";

const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString()}`;

export function Suppliers() {
  const today = new Date().toISOString().slice(0, 10);
  const [q, setQ] = useState(new URLSearchParams("page=1&limit=20"));
  const [editing, setEditing] = useState<SupplierEntry | null | undefined>();
  const user = useSelector((s: RootState) => s.auth.user);
  const { data } = useSuppliersQuery(`?${q}`);
  const { data: history } = useSupplierHistoryQuery();
  const [create] = useCreateSupplierMutation();
  const [update] = useUpdateSupplierMutation();
  const [remove] = useDeleteSupplierMutation();
  const [saveName] = useCreatePartyNameMutation();
  const rows = data?.data || [];
  const { data: savedNames } = usePartyNamesQuery("?type=supplier");
  const page = Number(q.get("page") || 1);
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / Number(q.get("limit") || 12)));
  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(q);
    next.set("page", String(nextPage));
    next.set("limit", q.get("limit") || "12");
    setQ(next);
  };
  const save = (body: any) => saveName({ name: body.supplierName, type: "supplier" }).unwrap().then(() => editing?._id ? update({ id: editing._id, body }).unwrap() : create(body).unwrap()).then(() => setEditing(undefined));
  return (
    <>
      <PageHeader title="Suppliers" />
      <Filters query={q} setQuery={(next) => { next.set("page", "1"); next.set("limit", "20"); setQ(next); }} rows={rows} name="suppliers" create={can(user, "suppliers:create") && <button className="btn btn-primary" onClick={() => setEditing(null)}><Plus size={16} /> Create</button>} />
      <div className="panel">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="sticky top-0 z-10"><tr>{["Supplier","In Kg","Out Kg","Balance","Rate","Total","Supply Date","Actions"].map((h) => <th className="th" key={h}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((r) => <tr key={r._id}><td className="td font-semibold">{r.supplierName}</td><td className="td">{r.totalIn ?? r.kgWeight}</td><td className="td">{r.totalOut ?? 0}</td><td className="td font-semibold">{r.stockBalance ?? r.kgWeight}</td><td className="td">{r.ratePerKg}</td><td className="td">{money(r.totalAmount || r.kgWeight * r.ratePerKg)}</td><td className="td">{formatDate(r.supplyDate)}</td><td className="td"><div className="flex gap-2">{can(user, "suppliers:edit") && <button title="Edit" aria-label="Edit" className="icon-btn text-sky-600" onClick={() => setEditing(r)}><Edit size={15} /></button>}{can(user, "suppliers:delete") && <button title="Delete" aria-label="Delete" className="icon-btn text-red-600" onClick={() => confirm("Delete supplier entry?") && remove(r._id)}><Trash2 size={15} /></button>}</div></td></tr>)}</tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Page {page} of {totalPages}</span><div className="flex gap-2"><button className="btn bg-slate-100 text-slate-700" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><button className="btn bg-slate-100 text-slate-700" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </div>
      <div className="panel mt-4 overflow-x-auto">
        <h2 className="mb-3 font-black">Supplier History</h2>
        <table className="w-full min-w-[760px]"><thead><tr>{["Supplier","Entries","Total Kg","Total Amount","Paid","Pending"].map((h) => <th className="th" key={h}>{h}</th>)}</tr></thead><tbody>{(history?.data || []).map((h) => <tr key={h._id}><td className="td font-semibold">{h._id}</td><td className="td">{h.entryCount}</td><td className="td">{h.totalKg}</td><td className="td">{money(h.totalAmount)}</td><td className="td text-mint">{money(h.paidAmount)}</td><td className="td text-tomato">{money(h.pendingAmount)}</td></tr>)}</tbody></table>
      </div>
      {editing !== undefined && <SupplierForm entry={editing || undefined} names={savedNames?.data || []} onClose={() => setEditing(undefined)} onSave={save} />}
    </>
  );
}

function SupplierForm({ entry, names, onClose, onSave }: { entry?: SupplierEntry; names: any[]; onClose: () => void; onSave: (body: any) => Promise<unknown> }) {
  const [body, setBody] = useState({ supplierName: entry?.supplierName || "", kgWeight: entry ? String(entry.kgWeight) : "", ratePerKg: entry ? String(entry.ratePerKg) : "", supplyDate: toDateInput(entry?.supplyDate) });
  const [newName, setNewName] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const kg = parseAmount(body.kgWeight);
  const rate = parseAmount(body.ratePerKg);
  const total = (kg.value || 0) * (rate.value || 0);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!body.supplierName.trim()) next.supplierName = "Supplier name is required";
    if (!body.supplyDate) next.supplyDate = "Supply date is required";
    if (!body.kgWeight.trim() || kg.error) next.kgWeight = kg.error || "Kg weight is required";
    if (rate.error) next.ratePerKg = rate.error;
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    await onSave({ supplierName: body.supplierName.trim(), kgWeight: kg.value, ratePerKg: rate.value, supplyDate: body.supplyDate });
  }
  return <Modal title={entry ? "Edit Supply Entry" : "Create Supply Entry"} onClose={onClose}><form className="grid gap-4" onSubmit={submit}><Field label="Supplier Name" required error={errors.supplierName}><TextInput list="supplier-names" value={body.supplierName} onChange={(e) => setBody({ ...body, supplierName: e.target.value })} /><datalist id="supplier-names">{names.map((n) => <option key={n._id} value={n.name} />)}</datalist></Field><div className="text-xs text-slate-500">Naya naam enter karne par saved names list me automatically available rahega.</div><div className="grid gap-4 md:grid-cols-2"><Field label="Kg Weight" required error={errors.kgWeight}><TextInput inputMode="decimal" value={body.kgWeight} onChange={(e) => setBody({ ...body, kgWeight: e.target.value })} /></Field><Field label="Rate Per Kg" error={errors.ratePerKg}><TextInput inputMode="decimal" value={body.ratePerKg} onChange={(e) => setBody({ ...body, ratePerKg: e.target.value })} /></Field></div><Field label="Supply Date" required error={errors.supplyDate}><TextInput type="date" value={body.supplyDate} onChange={(e) => setBody({ ...body, supplyDate: e.target.value })} /></Field><div className="rounded-md bg-slate-100 p-3 font-black">Auto Total: {money(total)}</div><button className="btn btn-primary">{entry ? "Update Entry" : "Save Entry"}</button></form></Modal>;
}
