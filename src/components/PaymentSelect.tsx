import { useState } from "react";
import type { Payment, PaymentMethod } from "../lib/types";

const methods: PaymentMethod[] = ["none", "cash", "upi", "bank_to_bank", "SK", "company_account"];

export function PaymentSelect({ payment, onSave }: { payment: Payment; onSave: (status: string, method: string) => void }) {
  const [status, setStatus] = useState<Payment["status"]>(payment?.status || "pending");
  const [method, setMethod] = useState<PaymentMethod>(payment?.method || "none");
  return (
    <div className="flex min-w-72 gap-2">
      <select className="field w-28" value={status} onChange={(e) => setStatus(e.target.value as Payment["status"])}><option value="pending">Pending</option><option value="done">Done</option></select>
      <select className="field w-40" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{methods.map((m) => <option key={m} value={m}>{m.replaceAll("_", " ")}</option>)}</select>
      <button className="btn btn-primary" onClick={() => onSave(status, method)}>Save</button>
    </div>
  );
}
