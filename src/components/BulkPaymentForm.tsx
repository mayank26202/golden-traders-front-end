import { useState } from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";
import { Field, TextInput } from "./FormField";
import { usePartyNamesQuery } from "../app/api";
import { toDateInput } from "../lib/auth";

export function BulkPaymentForm({ onClose, onSaveBulk }: { onClose: () => void, onSaveBulk: (entries: any[]) => Promise<void> }) {
  const [paymentDate, setPaymentDate] = useState(toDateInput(new Date().toISOString()));
  const [method, setMethod] = useState("cash");
  const [rows, setRows] = useState<any[]>([{ id: 1, customerName: "", amount: "", note: "" }]);
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: names } = usePartyNamesQuery("?type=customer");
  const totalAmount = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleAdd = () => setRows([...rows, { id: Date.now(), customerName: "", amount: "", note: "" }]);
  const handleRemove = (id: number) => setRows(rows.filter(r => r.id !== id));
  const updateRow = (id: number, field: string, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleNext = () => {
    if (rows.some(r => !r.customerName || !r.amount)) return alert("Please fill all required fields");
    setPreview(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const time = new Date().toTimeString().slice(0, 5);
    const entries = rows.map(r => ({
      customerName: r.customerName.trim(),
      amount: Number(r.amount) || 0,
      method,
      paymentDate,
      paymentTime: time,
      note: r.note.trim()
    }));
    await onSaveBulk(entries);
    setIsSaving(false);
    onClose();
  };

  if (preview) {
    return (
      <Modal title="Preview Bulk Payments" onClose={onClose}>
        <div className="mb-4 text-sm">
          <p><strong>Date:</strong> {paymentDate}</p>
          <p><strong>Method:</strong> {method}</p>
        </div>
        <table className="w-full text-sm mb-4">
          <thead className="bg-slate-100">
            <tr><th className="p-2 text-left">Customer</th><th className="p-2">Amount</th><th className="p-2 text-left">Note</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-semibold">{r.customerName}</td>
                <td className="p-2 text-center">Rs. {Number(r.amount).toLocaleString()}</td>
                <td className="p-2">{r.note}</td>
              </tr>
            ))}
            <tr className="border-t font-black">
              <td className="p-2">Total</td>
              <td className="p-2 text-center">Rs. {totalAmount.toLocaleString()}</td>
              <td></td>
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
    <Modal title="Bulk Customer Payments" onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <Field label="Payment Date" required>
          <TextInput type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        </Field>
        <Field label="Payment Method" required>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="SK">SK</option>
            <option value="golden_traders_bank">Golden Trader's Bank</option>
          </select>
        </Field>
      </div>

      <div className="max-h-[300px] overflow-auto mb-4 border rounded p-2 bg-slate-50">
        {rows.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[1fr_100px_1fr_40px] gap-2 mb-2 items-end">
            <Field label={i === 0 ? "Customer Name" : ""}>
              <TextInput list="pay-cust-list" placeholder="Customer" value={r.customerName} onChange={e => updateRow(r.id, "customerName", e.target.value)} />
            </Field>
            <Field label={i === 0 ? "Amount" : ""}>
              <TextInput inputMode="decimal" placeholder="Amount" value={r.amount} onChange={e => updateRow(r.id, "amount", e.target.value)} />
            </Field>
            <Field label={i === 0 ? "Note" : ""}>
              <TextInput placeholder="Note" value={r.note} onChange={e => updateRow(r.id, "note", e.target.value)} />
            </Field>
            <button className="h-11 w-full flex items-center justify-center text-red-500 hover:bg-red-50 rounded" onClick={() => handleRemove(r.id)}><Trash2 size={16} /></button>
          </div>
        ))}
        <datalist id="pay-cust-list">{names?.data?.map((n: any) => <option key={n._id} value={n.name} />)}</datalist>
        <button className="btn btn-sky w-full mt-2" onClick={handleAdd}><Plus size={16}/> Add Payment</button>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold">Total Amount: {totalAmount}</div>
        <button className="btn btn-primary" onClick={handleNext}>Preview Payments</button>
      </div>
    </Modal>
  );
}
