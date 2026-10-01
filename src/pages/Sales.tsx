import { useState } from "react";
import { Edit, FileDown, Plus, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import {
  API_URL,
  useAvailableSuppliersQuery,
  useCreatePartyNameMutation,
  useCreateSaleMutation,
  useDeleteSaleMutation,
  usePartyNamesQuery,
  useSalesQuery,
  useUpdateSaleMutation,
} from "../app/api";
import { PageHeader } from "../components/Layout";
import { Filters } from "../components/Filters";
import { Modal } from "../components/Modal";
import { Field, TextInput, parseAmount } from "../components/FormField";
import { BulkSaleForm } from "../components/BulkSaleForm";
import { can, formatDate, toDateInput } from "../lib/auth";
import type { RootState } from "../app/store";
import type { SaleEntry } from "../lib/types";

const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString()}`;

export function Sales() {
  const [editing, setEditing] = useState<SaleEntry | null | undefined>();
  const [bulkOpen, setBulkOpen] = useState(false);
  const user = useSelector((s: RootState) => s.auth.user);
  const [q, setQ] = useState(new URLSearchParams("page=1&limit=20"));
  const { data } = useSalesQuery(`?${q}`);
  const [create] = useCreateSaleMutation();
  const [update] = useUpdateSaleMutation();
  const [remove] = useDeleteSaleMutation();
  const [saveName] = useCreatePartyNameMutation();
  const token = localStorage.getItem("token");
  const rows = data?.data || [];
  const invoice = (id: string) =>
    window.open(
      `${API_URL.replace("/api", "")}/api/sales/${id}/invoice?token=${token}`,
      "_blank",
    );
  const saveBulk = async (entries: any[]) => {
    const tok = localStorage.getItem("token");
    await fetch(`${API_URL}/sales/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + tok },
      body: JSON.stringify({ entries })
    });
    entries.forEach(b => saveName({ name: b.customerName, type: "customer" }).catch(() => {}));
    setQ(new URLSearchParams(q.toString()));
  };
  const save = (body: any) =>
    saveName({ name: body.customerName, type: "customer" })
      .unwrap()
      .then(() =>
        editing?._id
          ? update({ id: editing._id, body }).unwrap()
          : create(body).unwrap(),
      )
      .then(() => setEditing(undefined));
  const page = Number(q.get("page") || 1);
  const totalPages = Math.max(1, Math.ceil((data?.total || rows.length) / 20));
  return (
    <>
      <PageHeader title="Sales" />
      
      {q.get("from") && q.get("to") && q.get("from") === q.get("to") && (
        <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {(data as any)?.cards && (
            <div className="panel border-l-4 border-mint">
              <div className="text-xs font-bold uppercase text-slate-500">Overall</div>
              <div className="mt-2 font-black">
                <div className="text-lg">Sale: {(data as any).cards.overall.totalSale} kg</div>
                <div className={(data as any).cards.overall.stockLeft < 0 ? 'text-red-500' : 'text-slate-500'}>Stock Left: {(data as any).cards.overall.stockLeft} kg</div>
              </div>
            </div>
          )}
          {(data as any)?.cards?.suppliers.map((s: any) => (
            <div className="panel border-l-4 border-sky-400" key={s.supplierName}>
              <div className="text-xs font-bold uppercase text-slate-500 truncate" title={s.supplierName}>{s.supplierName}</div>
              <div className="mt-2 font-black">
                <div className="text-lg">Sale: {s.totalSale} kg</div>
                <div className={s.stockLeft < 0 ? 'text-red-500' : 'text-slate-500'}>Stock Left: {s.stockLeft} kg</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Filters
        query={q}
        setQuery={(next) => {
          next.set("page", "1");
          next.set("limit", "20");
          setQ(next);
        }}
        rows={rows}
        name="sales"
        create={
          can(user, "sales:create") && (
            <button
              className="btn btn-primary"
              onClick={() => setBulkOpen(true)}
            >
              <Plus size={16} /> Create
            </button>
          )
        }
      />
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr>
              {[
                "Customer",
                "Kg",
                "Rate",
                "Total",
                "Created",
                "Sale Date",
                "Invoice",
                "Actions",
              ].map((h) => (
                <th className="th" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td className="td font-semibold">{r.customerName}</td>
                <td className="td">{r.totalKg}</td>
                <td className="td">{r.rateOfSale}</td>
                <td className="td">
                  {money(r.totalAmount || r.totalKg * r.rateOfSale)}
                </td>
                <td className="td">{formatDate(r.createdAt)}</td>
                <td className="td">{formatDate(r.saleDate)}</td>
                <td className="td">
                  <button
                    title="Download invoice"
                    className="icon-btn text-sky-600"
                    onClick={() => invoice(r._id)}
                  >
                    <FileDown size={16} />
                  </button>
                </td>
                <td className="td">
                  <div className="flex gap-2">
                    {can(user, "sales:edit") && (
                      <button
                        title="Edit"
                        aria-label="Edit"
                        className="icon-btn text-sky-600"
                        onClick={() => setEditing(r)}
                      >
                        <Edit size={15} />
                      </button>
                    )}
                    {can(user, "sales:delete") && (
                      <button
                        title="Delete"
                        aria-label="Delete"
                        className="icon-btn text-red-600"
                        onClick={() =>
                          confirm("Delete sale entry?") && remove(r._id)
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between p-3 text-sm">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="btn bg-slate-100"
              disabled={page <= 1}
              onClick={() => {
                const n = new URLSearchParams(q);
                n.set("page", String(page - 1));
                setQ(n);
              }}
            >
              Prev
            </button>
            <button
              className="btn bg-slate-100"
              disabled={page >= totalPages}
              onClick={() => {
                const n = new URLSearchParams(q);
                n.set("page", String(page + 1));
                setQ(n);
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {editing !== undefined && (
        <SaleForm
          entry={editing || undefined}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      )}
    {bulkOpen && <BulkSaleForm onClose={() => setBulkOpen(false)} onSaveBulk={saveBulk} />}
    </>
  );
}

function SaleForm({
  entry,
  onClose,
  onSave,
}: {
  entry?: SaleEntry;
  onClose: () => void;
  onSave: (body: any) => Promise<unknown>;
}) {
  const [body, setBody] = useState({
    customerName: entry?.customerName || "",
    totalKg: entry ? String(entry.totalKg) : "",
    rateOfSale: entry ? String(entry.rateOfSale) : "",
    saleDate: toDateInput(entry?.saleDate),
    supplierId: (entry as any)?.supplierId || "",
    supplierName: (entry as any)?.supplierName || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const kg = parseAmount(body.totalKg);
  const rate = parseAmount(body.rateOfSale);
  const total = (kg.value || 0) * (rate.value || 0);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!body.customerName.trim())
      next.customerName = "Customer name is required";
    if (!body.saleDate) next.saleDate = "Sale date is required";
    if (!body.totalKg.trim()) next.totalKg = "Total kg is required";
    if (kg.error) next.totalKg = kg.error;
    if (rate.error) next.rateOfSale = rate.error;
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    setApiError("");
    try {
      if (!body.supplierId) next.supplierName = "Supplier is required";
      if (Object.keys(next).length) return setErrors(next);
      await onSave({
        customerName: body.customerName.trim(),
        totalKg: kg.value,
        rateOfSale: rate.value,
        saleDate: body.saleDate,
        supplierId: body.supplierId,
        supplierName: body.supplierName,
      });
    } catch {
      setApiError(
        "Could not save sale entry. Please check details and try again.",
      );
    }
  }
  const { data: names } = usePartyNamesQuery("?type=customer");
  const { data: available } = useAvailableSuppliersQuery(
    `?date=${body.saleDate}`,
    { skip: !body.saleDate },
  );
  return (
    <Modal
      title={entry ? "Edit Sale Entry" : "Create Sale Entry"}
      onClose={onClose}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Customer Name" required error={errors.customerName}>
          <select
            className="input"
            value={
              names?.data.some((n: any) => n.name === body.customerName)
                ? body.customerName
                : "__new"
            }
            onChange={(e) =>
              setBody({
                ...body,
                customerName: e.target.value === "__new" ? "" : e.target.value,
              })
            }
          >
            <option value="">Select customer</option>
            {names?.data.map((n: any) => (
              <option key={n._id} value={n.name}>
                {n.name}
              </option>
            ))}
            <option value="__new">+ New customer</option>
          </select>
        </Field>
        {(!names?.data.some((n: any) => n.name === body.customerName) ||
          !body.customerName) && (
          <Field label="New Customer Name" required error={errors.customerName}>
            <TextInput
              value={body.customerName}
              onChange={(e) =>
                setBody({ ...body, customerName: e.target.value })
              }
            />
          </Field>
        )}
        <Field
          label="Supplier For This Date"
          required
          error={errors.supplierName}
        >
          <select
            className="input"
            value={body.supplierId}
            onChange={(e) => {
              const s = available?.data.find(
                (x: any) => x.supplierId === e.target.value,
              );
              setBody({
                ...body,
                supplierId: e.target.value,
                supplierName: s?.supplierName || "",
              });
            }}
          >
            <option value="">Select supplier</option>
            {available?.data.map((s: any) => (
              <option key={s.supplierId} value={s.supplierId}>
                {s.supplierName} ({s.totalIn} kg in)
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Total Kg" required error={errors.totalKg}>
            <TextInput
              inputMode="decimal"
              placeholder="Example: 150"
              value={body.totalKg}
              onChange={(e) => setBody({ ...body, totalKg: e.target.value })}
            />
          </Field>
          <Field label="Rate Of Sale" error={errors.rateOfSale}>
            <TextInput
              inputMode="decimal"
              placeholder="Example: 145"
              value={body.rateOfSale}
              onChange={(e) => setBody({ ...body, rateOfSale: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Sale Date" required error={errors.saleDate}>
          <TextInput
            type="date"
            value={body.saleDate}
            onChange={(e) => setBody({ ...body, saleDate: e.target.value })}
          />
        </Field>
        <div className="rounded-md bg-slate-100 p-3 font-black">
          Auto Total: {money(total)}
        </div>
        {apiError && (
          <p className="text-sm font-semibold text-tomato">{apiError}</p>
        )}
        <button className="btn btn-primary">
          {entry ? "Update Entry" : "Save Entry"}
        </button>
      </form>
    </Modal>
  );
}
