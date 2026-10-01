import { useState } from "react";
import { Edit, Landmark, Plus, Trash2, Wallet } from "lucide-react";
import { useSelector } from "react-redux";
import { PageHeader } from "../components/Layout";
import { Filters } from "../components/Filters";
import { Modal } from "../components/Modal";
import {
  Field,
  SelectInput,
  TextInput,
  parseAmount,
} from "../components/FormField";
import {
  useCashDepositsQuery,
  useCreateCashDepositMutation,
  useCreatePaymentMutation,
  useDeleteCashDepositMutation,
  useDeletePaymentMutation,
  useOutstandingQuery,
  usePaymentsQuery,
  useUpdateCashDepositMutation,
  useUpdatePaymentMutation,
  useCreateSupplierPaymentMutation,
  useUpdateSupplierPaymentMutation,
  useSupplierPaymentsQuery,
  usePartyNamesQuery, // NOTE: rename this to match your actual hook (e.g. useCustomerNamesQuery / useSupplierNamesQuery) if different
} from "../app/api";
import { can, formatDate, toDateInput } from "../lib/auth";
import type { RootState } from "../app/store";
import type { CashDeposit, CustomerPayment } from "../lib/types";
import { BulkPaymentForm } from "../components/BulkPaymentForm";
import { API_URL } from "../app/api";

type PaymentFormState = {
  customerName: string;
  amount: string;
  method: CustomerPayment["method"];
  paymentDate: string;
  paymentTime: string;
  note: string;
};

type DepositFormState = {
  amount: string;
  bankAccount: CashDeposit["bankAccount"];
  depositDate: string;
  depositTime: string;
  note: string;
};

type NameEntry = {
  _id: string;
  name: string;
  normalizedName: string;
  type: "customer" | "supplier";
};

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString()}`;

// Builds a de-duplicated, sorted option list, making sure the currently
// selected value (e.g. when editing an old entry) is always present even
// if it's missing from the master list.
function buildNameOptions(list: NameEntry[] = [], currentValue?: string) {
  const names = new Set(list.map((n) => n.name));
  if (currentValue) names.add(currentValue);
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

export function Payments() {
  const [q, setQ] = useState(() => new URLSearchParams());

  const [paymentEntry, setPaymentEntry] = useState<
    CustomerPayment | null | undefined
  >();

  const [depositEntry, setDepositEntry] = useState<
    CashDeposit | null | undefined
  >();

  const [supplierPaymentEntry, setSupplierPaymentEntry] = useState<any>();
  const [updateSupplierPayment] = useUpdateSupplierPaymentMutation();

  const user = useSelector((s: RootState) => s.auth.user);

  const { data } = usePaymentsQuery(`?${q}`);

  const { data: outstanding } = useOutstandingQuery(
    `?search=${q.get("search") || ""}`,
  );

  const { data: deposits } = useCashDepositsQuery(`?${q}`);
  const { data: supplierPayments } = useSupplierPaymentsQuery(`?${q}`);

  // Master name lists for the dropdowns
  const { data: customerNames } = usePartyNamesQuery(`?type=customer`);
  const { data: supplierNames } = usePartyNamesQuery(`?type=supplier`);

  const [createPayment] = useCreatePaymentMutation();
  const [updatePayment] = useUpdatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();

  const [createDeposit] = useCreateCashDepositMutation();
  const [updateDeposit] = useUpdateCashDepositMutation();
  const [deleteDeposit] = useDeleteCashDepositMutation();

  const [createSupplierPayment] = useCreateSupplierPaymentMutation();

  const rows = data?.data || [];
  const depositRows = deposits?.data || [];

  const savePayment = (body: any) =>
    paymentEntry?._id
      ? updatePayment({ id: paymentEntry._id, body })
          .unwrap()
          .then(() => setPaymentEntry(undefined))
      : createPayment(body)
          .unwrap()
          .then(() => setPaymentEntry(undefined));

  const saveDeposit = (body: any) =>
    depositEntry?._id
      ? updateDeposit({ id: depositEntry._id, body })
          .unwrap()
          .then(() => setDepositEntry(undefined))
      : createDeposit(body)
          .unwrap()
          .then(() => setDepositEntry(undefined));

  return (
    <>
      <PageHeader title="Payments">
        {can(user, "sales:create") && (
          <button
            className="btn btn-primary"
            onClick={() => setPaymentEntry(null)}
          >
            <Plus size={16} /> Customer Payment
          </button>
        )}

        {can(user, "suppliers:create") && (
          <button
            className="btn btn-sky"
            onClick={() => setSupplierPaymentEntry(null)}
          >
            <Plus size={16} /> Supplier Payment
          </button>
        )}

        {can(user, "sales:create") && (
          <button className="btn btn-sky" onClick={() => setDepositEntry(null)}>
            <Landmark size={16} /> Cash Deposit
          </button>
        )}
      </PageHeader>

      {/* Payment Summary Cards */}
      <div className="mb-4 grid gap-3 md:grid-cols-5">
        {Object.entries(data?.cards || {}).map(([k, v]) => (
          <div className="panel border-l-4 border-mint" key={k}>
            <div className="text-xs font-bold uppercase text-slate-500">
              {k.replaceAll("_", " ")}
            </div>

            <div className="mt-2 text-xl font-black">
              {v.count} / {money(v.total)}
            </div>
          </div>
        ))}
      </div>

      <Filters query={q} setQuery={setQ} rows={rows} name="customer-payments" />

      {/* Customer Payments + Outstanding */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        {/* Customer Payment Ledger */}
        <div className="panel min-w-0">
          <div className="max-h-[500px] overflow-y-auto overflow-x-hidden">
            <h2 className="mb-3 flex items-center gap-2 font-black">
              <Wallet size={18} /> Customer Payment Ledger
            </h2>

            <table className="w-full table-fixed">
              <thead className="sticky top-0 z-10 bg-white shadow-sm">
                <tr>
                  <th className="th w-[18%]">Customer</th>
                  <th className="th w-[12%]">Amount</th>
                  <th className="th w-[14%]">Method</th>
                  <th className="th w-[12%]">Date</th>
                  <th className="th w-[10%]">Time</th>
                  <th className="th w-[18%]">Note</th>
                  <th className="th w-[16%]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td
                      className="td truncate font-semibold"
                      title={r.customerName}
                    >
                      {r.customerName}
                    </td>

                    <td className="td whitespace-nowrap">{money(r.amount)}</td>

                    <td
                      className="td truncate"
                      title={r.method.replaceAll("_", " ")}
                    >
                      {r.method.replaceAll("_", " ")}
                    </td>

                    <td className="td whitespace-nowrap">
                      {formatDate(r.paymentDate)}
                    </td>

                    <td className="td whitespace-nowrap">{r.paymentTime}</td>

                    <td className="td truncate" title={r.note}>
                      {r.note}
                    </td>

                    <td className="td">
                      <div className="flex gap-2">
                        {can(user, "sales:edit") && (
                          <button
                            className="btn btn-sky"
                            onClick={() => setPaymentEntry(r)}
                          >
                            <Edit size={15} />
                          </button>
                        )}

                        {can(user, "sales:delete") && (
                          <button
                            className="btn btn-danger"
                            onClick={() =>
                              confirm("Delete payment?") && deletePayment(r._id)
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
          </div>
        </div>

        {/* Customer Outstanding */}
        <div className="panel min-w-0">
          <div className="max-h-[500px] overflow-y-auto overflow-x-hidden">
            <h2 className="mb-3 font-black">Customer Outstanding</h2>

            <table className="w-full table-fixed">
              <thead className="sticky top-0 z-10 bg-white shadow-sm">
                <tr>
                  <th className="th w-[40%]">Customer</th>
                  <th className="th w-[20%]">Sales</th>
                  <th className="th w-[20%]">Paid</th>
                  <th className="th w-[20%]">Remaining</th>
                </tr>
              </thead>

              <tbody>
                {(outstanding?.data || []).map((r: any) => (
                  <tr key={r.customerName}>
                    <td
                      className="td truncate font-semibold"
                      title={r.customerName}
                    >
                      {r.customerName}
                    </td>

                    <td className="td whitespace-nowrap">
                      {money(r.totalSales)}
                    </td>

                    <td className="td whitespace-nowrap">
                      {money(r.totalPaid)}
                    </td>

                    <td
                      className={`td whitespace-nowrap font-black ${
                        r.outstanding > 0 ? "text-tomato" : "text-mint"
                      }`}
                    >
                      {money(r.outstanding)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Supplier Payment Ledger */}
      <div className="panel mt-4 min-w-0">
        <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
          <h2 className="mb-3 font-black">Supplier Payment Ledger</h2>

          <table className="w-full min-w-[500px] table-fixed">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className="th w-[28%]">Supplier</th>
                <th className="th w-[18%]">Amount</th>
                <th className="th w-[18%]">Method</th>
                <th className="th w-[18%]">Date</th>
                <th className="th w-[18%]">Time</th>
              </tr>
            </thead>

            <tbody>
              {(supplierPayments?.data || []).map((r: any) => (
                <tr key={r._id}>
                  <td
                    className="td truncate font-semibold"
                    title={r.supplierName}
                  >
                    {r.supplierName}
                  </td>

                  <td className="td whitespace-nowrap">{money(r.amount)}</td>

                  <td className="td truncate" title={r.method}>
                    {r.method}
                  </td>

                  <td className="td whitespace-nowrap">
                    {formatDate(r.paymentDate)}
                  </td>

                  <td className="td whitespace-nowrap">{r.paymentTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Payment Modal */}
      {supplierPaymentEntry !== undefined && (
        <SupplierPaymentForm
          supplierOptions={buildNameOptions(supplierNames?.data)}
          onClose={() => setSupplierPaymentEntry(undefined)}
          onSave={(body) =>
            supplierPaymentEntry?._id ? updateSupplierPayment({ id: supplierPaymentEntry._id, body }).unwrap().then(() => setSupplierPaymentEntry(undefined)) : createSupplierPayment(body)
              .unwrap()
              .then(() => setSupplierPaymentEntry(undefined))
          }
        />
      )}

      {/* ================= PARTITION: Bank Deposits ================= */}
      <div className="mt-8 border-t-4 border-sky/30 pt-6">
        <h1 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-700">
          <Landmark size={20} /> Bank Deposits
        </h1>

        {/* Deposit Summary Cards */}
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(deposits?.cards || {}).map(([k, v]) => (
            <div className="panel border-l-4 border-sky" key={k}>
              <div className="text-xs font-bold uppercase text-slate-500">
                {k.replaceAll("_", " ")}
              </div>

              <div className="mt-2 text-xl font-black">
                {v.count} / {money(v.total)}
              </div>
            </div>
          ))}
        </div>

        {/* Cash Deposit Ledger */}
        <div className="panel mt-4 min-w-0">
          <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
            <h2 className="mb-3 font-black">Cash Deposited In Bank</h2>

            <table className="w-full min-w-[500px] table-fixed">
              <thead className="sticky top-0 z-10 bg-white shadow-sm">
                <tr>
                  <th className="th w-[15%]">Amount</th>
                  <th className="th w-[20%]">Bank</th>
                  <th className="th w-[15%]">Date</th>
                  <th className="th w-[12%]">Time</th>
                  <th className="th w-[20%]">Note</th>
                  <th className="th w-[18%]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {depositRows.map((r) => (
                  <tr key={r._id}>
                    <td className="td whitespace-nowrap">{money(r.amount)}</td>

                    <td
                      className="td truncate"
                      title={r.bankAccount.replaceAll("_", " ")}
                    >
                      {r.bankAccount.replaceAll("_", " ")}
                    </td>

                    <td className="td whitespace-nowrap">
                      {formatDate(r.depositDate)}
                    </td>

                    <td className="td whitespace-nowrap">{r.depositTime}</td>

                    <td className="td truncate" title={r.note}>
                      {r.note}
                    </td>

                    <td className="td">
                      <div className="flex gap-2">
                        {can(user, "sales:edit") && (
                          <button
                            className="btn btn-sky"
                            onClick={() => setDepositEntry(r)}
                          >
                            <Edit size={15} />
                          </button>
                        )}

                        {can(user, "sales:delete") && (
                          <button
                            className="btn btn-danger"
                            onClick={() =>
                              confirm("Delete deposit?") && deleteDeposit(r._id)
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
          </div>
        </div>
      </div>
      {/* ================= END PARTITION: Bank Deposits ================= */}

      {paymentEntry !== undefined && (
        paymentEntry ? (
          <PaymentForm
            entry={paymentEntry}
            customerOptions={buildNameOptions(
              customerNames?.data,
              paymentEntry.customerName,
            )}
            onClose={() => setPaymentEntry(undefined)}
            onSave={savePayment}
          />
        ) : (
          <BulkPaymentForm
            onClose={() => setPaymentEntry(undefined)}
            onSaveBulk={async (entries) => {
              const token = localStorage.getItem("token");
              await fetch(`${API_URL}/payments/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ entries })
              });
              setPaymentEntry(undefined);
              setQ(new URLSearchParams(q.toString()));
            }}
          />
        )
      )}

      {/* Deposit Modal */}
      {depositEntry !== undefined && (
        <DepositForm
          entry={depositEntry || undefined}
          onClose={() => setDepositEntry(undefined)}
          onSave={saveDeposit}
        />
      )}
    </>
  );
}

function PaymentForm({
  entry,
  customerOptions,
  onClose,
  onSave,
}: {
  entry?: CustomerPayment;
  customerOptions: string[];
  onClose: () => void;
  onSave: (body: any) => Promise<unknown>;
}) {
  const [body, setBody] = useState<PaymentFormState>({
    customerName: entry?.customerName || "",
    amount: entry ? String(entry.amount) : "",
    method: entry?.method || "cash",
    paymentDate: toDateInput(entry?.paymentDate),
    paymentTime: entry?.paymentTime || nowTime(),
    note: entry?.note || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const amount = parseAmount(body.amount);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const next: Record<string, string> = {};

    if (!body.customerName.trim())
      next.customerName = "Customer name is required";

    if (!body.amount.trim() || amount.error || !amount.value)
      next.amount = amount.error || "Payment must be greater than zero";

    if (!body.paymentDate) next.paymentDate = "Date is required";

    if (!body.paymentTime) next.paymentTime = "Time is required";

    if (Object.keys(next).length) return setErrors(next);

    setErrors({});

    await onSave({
      ...body,
      customerName: body.customerName.trim(),
      amount: amount.value,
      note: body.note.trim(),
    });
  }

  return (
    <Modal
      title={entry ? "Edit Customer Payment" : "Create Customer Payment"}
      onClose={onClose}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Customer Name" required error={errors.customerName}>
          <SelectInput
            value={body.customerName}
            onChange={(e) =>
              setBody({
                ...body,
                customerName: e.target.value,
              })
            }
          >
            <option value="">-- Select Customer --</option>
            {customerOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Payment Amount" required error={errors.amount}>
          <TextInput
            inputMode="decimal"
            value={body.amount}
            onChange={(e) =>
              setBody({
                ...body,
                amount: e.target.value,
              })
            }
          />
        </Field>

        <Field label="Payment Method" required>
          <SelectInput
            value={body.method}
            onChange={(e) =>
              setBody({
                ...body,
                method: e.target.value as PaymentFormState["method"],
              })
            }
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="SK">SK</option>
            <option value="golden_traders_bank">Golden Trader's Bank</option>
          </SelectInput>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Payment Date" required error={errors.paymentDate}>
            <TextInput
              type="date"
              value={body.paymentDate}
              onChange={(e) =>
                setBody({
                  ...body,
                  paymentDate: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Payment Time" required error={errors.paymentTime}>
            <TextInput
              type="time"
              value={body.paymentTime}
              onChange={(e) =>
                setBody({
                  ...body,
                  paymentTime: e.target.value,
                })
              }
            />
          </Field>
        </div>

        <Field label="Note">
          <TextInput
            value={body.note}
            onChange={(e) =>
              setBody({
                ...body,
                note: e.target.value,
              })
            }
          />
        </Field>

        <button className="btn btn-primary">
          {entry ? "Update Payment" : "Save Payment"}
        </button>
      </form>
    </Modal>
  );
}

function DepositForm({
  entry,
  onClose,
  onSave,
}: {
  entry?: CashDeposit;
  onClose: () => void;
  onSave: (body: any) => Promise<unknown>;
}) {
  const [body, setBody] = useState<DepositFormState>({
    amount: entry ? String(entry.amount) : "",
    bankAccount: entry?.bankAccount || "golden_traders_bank",
    depositDate: toDateInput(entry?.depositDate),
    depositTime: entry?.depositTime || nowTime(),
    note: entry?.note || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const amount = parseAmount(body.amount);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const next: Record<string, string> = {};

    if (!body.amount.trim() || amount.error || !amount.value)
      next.amount = amount.error || "Deposit must be greater than zero";

    if (!body.depositDate) next.depositDate = "Date is required";

    if (!body.depositTime) next.depositTime = "Time is required";

    if (Object.keys(next).length) return setErrors(next);

    setErrors({});

    await onSave({
      ...body,
      amount: amount.value,
      note: body.note.trim(),
    });
  }

  return (
    <Modal
      title={entry ? "Edit Cash Deposit" : "Cash Deposit In Bank"}
      onClose={onClose}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Cash Amount" required error={errors.amount}>
          <TextInput
            inputMode="decimal"
            value={body.amount}
            onChange={(e) =>
              setBody({
                ...body,
                amount: e.target.value,
              })
            }
          />
        </Field>

        <Field label="Bank Account" required>
          <SelectInput
            value={body.bankAccount}
            onChange={(e) =>
              setBody({
                ...body,
                bankAccount: e.target.value as DepositFormState["bankAccount"],
              })
            }
          >
            <option value="SK">SK</option>
            <option value="golden_traders_bank">Golden Trader's Bank</option>
          </SelectInput>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Deposit Date" required error={errors.depositDate}>
            <TextInput
              type="date"
              value={body.depositDate}
              onChange={(e) =>
                setBody({
                  ...body,
                  depositDate: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Deposit Time" required error={errors.depositTime}>
            <TextInput
              type="time"
              value={body.depositTime}
              onChange={(e) =>
                setBody({
                  ...body,
                  depositTime: e.target.value,
                })
              }
            />
          </Field>
        </div>

        <Field label="Note">
          <TextInput
            value={body.note}
            onChange={(e) =>
              setBody({
                ...body,
                note: e.target.value,
              })
            }
          />
        </Field>

        <button className="btn btn-sky">
          {entry ? "Update Deposit" : "Save Deposit"}
        </button>
      </form>
    </Modal>
  );
}

function SupplierPaymentForm({
  entry,
  supplierOptions,
  onClose,
  onSave,
}: {
  entry?: any;
  supplierOptions: string[];
  onClose: () => void;
  onSave: (body: any) => Promise<unknown>;
}) {
  const [body, setBody] = useState({
    supplierName: entry?.supplierName || "",
    amount: entry ? String(entry.amount) : "",
    method: entry?.method || "bank",
    paymentDate: entry?.paymentDate ? toDateInput(entry.paymentDate) : today(),
    paymentTime: entry?.paymentTime || nowTime(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const amount = parseAmount(body.amount);

  return (
    <Modal title={entry ? "Edit Supplier Payment" : "Create Supplier Payment"} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();

          const next: Record<string, string> = {};

          if (!body.supplierName.trim())
            next.supplierName = "Supplier name is required";

          if (!body.amount.trim() || amount.error || !amount.value)
            next.amount = amount.error || "Payment must be greater than zero";

          if (Object.keys(next).length) return setErrors(next);

          setErrors({});

          void onSave({
            ...body,
            supplierName: body.supplierName.trim(),
            amount: amount.value,
          });
        }}
      >
        <Field label="Supplier Name" required error={errors.supplierName}>
          <SelectInput
            value={body.supplierName}
            onChange={(e) =>
              setBody({
                ...body,
                supplierName: e.target.value,
              })
            }
          >
            <option value="">-- Select Supplier --</option>
            {supplierOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Amount" required error={errors.amount}>
          <TextInput
            inputMode="decimal"
            value={body.amount}
            onChange={(e) =>
              setBody({
                ...body,
                amount: e.target.value,
              })
            }
          />
        </Field>

        <Field label="Payment Method" required>
          <SelectInput
            value={body.method}
            onChange={(e) =>
              setBody({
                ...body,
                method: e.target.value,
              })
            }
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="SK">SK</option>
            <option value="golden_traders_bank">Golden Trader's Bank</option>
          </SelectInput>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date" required>
            <TextInput
              type="date"
              value={body.paymentDate}
              onChange={(e) =>
                setBody({
                  ...body,
                  paymentDate: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Time" required>
            <TextInput
              type="time"
              value={body.paymentTime}
              onChange={(e) =>
                setBody({
                  ...body,
                  paymentTime: e.target.value,
                })
              }
            />
          </Field>
        </div>

        <button className="btn btn-primary">Save Payment</button>
      </form>
    </Modal>
  );
}