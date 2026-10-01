import { useState } from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";
import { Field, TextInput } from "./FormField";
import { usePartyNamesQuery } from "../app/api";
import { toDateInput } from "../lib/auth";

export function BulkSupplierForm({ onClose, onSaveBulk }: { onClose: () => void, onSaveBulk: (entries: any[]) => Promise<void> }) {
  const [supplyDate, setSupplyDate] = useState(toDateInput(new Date().toISOString()));
  const [rows, setRows] = useState<any[]>([{ id: 1, supplierName: "", kgWeight: "", ratePerKg: "" }]);
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: names } = usePartyNamesQuery("?type=supplier");
  
  const totalKg = Math.round(rows.reduce((sum, r) => sum + (Number(r.kgWeight) || 0), 0) * 100) / 100;
  const totalAmount = Math.round(rows.reduce((sum, r) => sum + ((Number(r.kgWeight) || 0) * (Number(r.ratePerKg) || 0)), 0) * 100) / 100;

  const handleAdd = () => setRows([...rows, { id: Date.now(), supplierName: "", kgWeight: "", ratePerKg: "" }]);
  const handleRemove = (id: number) => setRows(rows.filter(r => r.id !== id));
  const updateRow = (id: number, field: string, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleNext = () => {
    if (rows.some(r => !r.supplierName || !r.kgWeight)) return alert("Please fill all required fields");
    setPreview(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const entries = rows.map(r => ({
      supplierName: r.supplierName.trim(),
      kgWeight: Number(r.kgWeight),
      ratePerKg: Number(r.ratePerKg) || 0,
      supplyDate
    }));
    await onSaveBulk(entries);
    setIsSaving(false);
    onClose();
  };

  if (preview) {
    return (
      <Modal title="Preview Bulk Suppliers" onClose={onClose}>
        <div className="mb-4 text-sm">
          <p><strong>Date:</strong> {supplyDate}</p>
        </div>
        <table className="w-full text-sm mb-4">
          <thead className="bg-slate-100">
            <tr><th className="p-2 text-left">Supplier</th><th className="p-2">Kg</th><th className="p-2">Rate</th><th className="p-2 text-right">Total</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-semibold">{r.supplierName}</td>
                <td className="p-2 text-center">{r.kgWeight}</td>
                <td className="p-2 text-center">{r.ratePerKg}</td>
                <td className="p-2 text-right">Rs. {Math.round(Number(r.kgWeight) * Number(r.ratePerKg)).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="border-t font-black">
              <td className="p-2">Total</td>
              <td className="p-2 text-center">{totalKg}</td>
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
    <Modal title="Bulk Suppliers Entry" onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <Field label="Supply Date" required>
          <TextInput type="date" value={supplyDate} onChange={(e) => setSupplyDate(e.target.value)} />
        </Field>
      </div>

      <div className="max-h-[300px] overflow-auto mb-4 border rounded p-2 bg-slate-50">
        {rows.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[1fr_80px_80px_40px] gap-2 mb-2 items-end">
            <Field label={i === 0 ? "Supplier Name" : ""}>
              <TextInput list="supp-list" placeholder="Supplier" value={r.supplierName} onChange={e => updateRow(r.id, "supplierName", e.target.value)} onKeyDown={(e) => handleKeyDown(e, r.id)} />
            </Field>
            <Field label={i === 0 ? "Kg Weight" : ""}>
              <TextInput inputMode="decimal" placeholder="Kg" value={r.kgWeight} onChange={e => updateRow(r.id, "kgWeight", e.target.value)} onKeyDown={(e) => handleKeyDown(e, r.id)} />
            </Field>
            <Field label={i === 0 ? "Rate" : ""}>
              <TextInput inputMode="decimal" placeholder="Rate" value={r.ratePerKg} onChange={e => updateRow(r.id, "ratePerKg", e.target.value)} onKeyDown={(e) => handleKeyDown(e, r.id)} />
            </Field>
            <button type="button" className="h-11 w-full flex items-center justify-center text-red-500 hover:bg-red-50 rounded" onClick={() => handleRemove(r.id)}><Trash2 size={16} /></button>
          </div>
        ))}
        <datalist id="supp-list">{names?.data?.map((n: any) => <option key={n._id} value={n.name} />)}</datalist>
        <button className="btn btn-sky w-full mt-2" onClick={handleAdd}><Plus size={16}/> Add Supplier Entry</button>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold">Total Kg: {totalKg}</div>
        <button className="btn btn-primary" onClick={handleNext}>Preview Entries</button>
      </div>
    </Modal>
  );
}
