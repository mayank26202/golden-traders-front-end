import { useState } from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";
import { Field, TextInput, parseAmount } from "./FormField";
import { useAvailableSuppliersQuery, usePartyNamesQuery } from "../app/api";
import { toDateInput } from "../lib/auth";

export function BulkSaleForm({ onClose, onSaveBulk }: { onClose: () => void, onSaveBulk: (entries: any[]) => Promise<void> }) {
  const [saleDate, setSaleDate] = useState(toDateInput(new Date()));
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [rows, setRows] = useState<any[]>([{ id: 1, customerName: "", kg: "", rate: "" }]);
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: names } = usePartyNamesQuery("?type=customer");
  const { data: available } = useAvailableSuppliersQuery(`?date=${saleDate}`, { skip: !saleDate });

  const availableSupplier = available?.data?.find((s: any) => s.supplierId === supplierId);
  const totalKgSold = rows.reduce((sum, r) => sum + (Number(r.kg) || 0), 0);
  const totalAmount = rows.reduce((sum, r) => sum + ((Number(r.kg) || 0) * (Number(r.rate) || 0)), 0);
  const remainingKg = (availableSupplier?.stockBalance ?? availableSupplier?.totalIn ?? 0) - totalKgSold;

  const handleAdd = () => setRows([...rows, { id: Date.now(), customerName: "", kg: "", rate: "" }]);
  const handleRemove = (id: number) => setRows(rows.filter(r => r.id !== id));
  const updateRow = (id: number, field: string, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleNext = () => {
    if (!supplierId || rows.some(r => !r.customerName || !r.kg)) return alert("Please fill all required fields");
    setPreview(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const entries = rows.map(r => ({
      customerName: r.customerName.trim(),
      totalKg: Number(r.kg),
      rateOfSale: Number(r.rate) || 0,
      saleDate,
      supplierId,
      supplierName
    }));
    await onSaveBulk(entries);
    setIsSaving(false);
    onClose();
  };

  if (preview) {
    return (
      <Modal title="Preview Bulk Sales" onClose={onClose}>
        <div className="mb-4 text-sm">
          <p><strong>Date:</strong> {saleDate}</p>
          <p><strong>Supplier:</strong> {supplierName}</p>
          <p className={remainingKg < 0 ? "text-red-500 font-bold" : ""}><strong>Remaining Stock:</strong> {remainingKg} kg</p>
        </div>
        <table className="w-full text-sm mb-4">
          <thead className="bg-slate-100">
            <tr><th className="p-2 text-left">Customer</th><th className="p-2">Kg</th><th className="p-2">Rate</th><th className="p-2 text-right">Total</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-semibold">{r.customerName}</td>
                <td className="p-2 text-center">{r.kg}</td>
                <td className="p-2 text-center">{r.rate}</td>
                <td className="p-2 text-right">Rs. {(Number(r.kg) * Number(r.rate)).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="border-t font-black">
              <td className="p-2">Total</td>
              <td className="p-2 text-center">{totalKgSold}</td>
              <td></td>
              <td className="p-2 text-right">Rs. {totalAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <div className="flex gap-2 justify-end">
          <button className="btn bg-slate-200" onClick={() => setPreview(false)} disabled={isSaving}>Edit</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}><CheckCircle2 size={16}/> {isSaving ? "Saving..." : "Confirm & Save All"}</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Bulk Sales Entry" onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <Field label="Sale Date" required>
          <TextInput type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
        </Field>
        <Field label="Deduct from Supplier" required>
          <select className="input" value={supplierId} onChange={(e) => {
            const s = available?.data?.find((x: any) => x.supplierId === e.target.value);
            setSupplierId(e.target.value);
            setSupplierName(s?.supplierName || "");
          }}>
            <option value="">Select supplier</option>
            {available?.data?.map((s: any) => (
              <option key={s.supplierId} value={s.supplierId}>{s.supplierName} ({(s.stockBalance ?? s.totalIn)} kg in)</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="max-h-[300px] overflow-auto mb-4 border rounded p-2 bg-slate-50">
        {rows.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[1fr_80px_80px_40px] gap-2 mb-2 items-end">
            <Field label={i === 0 ? "Customer Name" : ""}>
              <TextInput list="cust-list" placeholder="Customer" value={r.customerName} onChange={e => updateRow(r.id, "customerName", e.target.value)} />
            </Field>
            <Field label={i === 0 ? "Kg" : ""}>
              <TextInput inputMode="decimal" placeholder="Kg" value={r.kg} onChange={e => updateRow(r.id, "kg", e.target.value)} />
            </Field>
            <Field label={i === 0 ? "Rate" : ""}>
              <TextInput inputMode="decimal" placeholder="Rate" value={r.rate} onChange={e => updateRow(r.id, "rate", e.target.value)} />
            </Field>
            <button className="h-11 w-full flex items-center justify-center text-red-500 hover:bg-red-50 rounded" onClick={() => handleRemove(r.id)}><Trash2 size={16} /></button>
          </div>
        ))}
        <datalist id="cust-list">{names?.data?.map((n: any) => <option key={n._id} value={n.name} />)}</datalist>
        <button className="btn btn-sky w-full mt-2" onClick={handleAdd}><Plus size={16}/> Add Customer Entry</button>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold">
          Total Kg: {totalKgSold} <span className={remainingKg < 0 ? "text-red-500" : "text-slate-500"}>(Left: {remainingKg})</span>
        </div>
        <button className="btn btn-primary" onClick={handleNext}>Preview Entries</button>
      </div>
    </Modal>
  );
}
