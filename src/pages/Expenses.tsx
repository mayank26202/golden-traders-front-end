import { useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { PageHeader } from "../components/Layout";
import { Filters } from "../components/Filters";
import { Modal } from "../components/Modal";
import {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useExpenseHistoryQuery,
  useExpensesQuery,
  useUpdateExpenseMutation,
  usePartyNamesQuery,
  useVehiclesQuery,
} from "../app/api";
import {
  Field,
  SelectInput,
  TextInput,
  parseAmount,
} from "../components/FormField";
import { can, formatDate, toDateInput } from "../lib/auth";
import type { RootState } from "../app/store";
import type { Expense } from "../lib/types";

const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString()}`;
const total = (r: Partial<Expense>) =>
  (r.foodCost || 0) +
  (r.petrolCost || 0) +
  (r.miscellaneousCost || 0) +
  (r.fixedAmount || 0) +
  (r.salaryAmount || 0) +
  (r.bonusAmount || 0);

export function Expenses() {
  const [q, setQ] = useState(
    new URLSearchParams(
      `page=1&limit=20&from=${new Date().toISOString().slice(0, 10)}&to=${new Date().toISOString().slice(0, 10)}`,
    ),
  );
  const [typeFilter, setTypeFilter] = useState("");
  const [editing, setEditing] = useState<Expense | null | undefined>();
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: customerNames } = usePartyNamesQuery("?type=customer");
  const { data: supplierNames } = usePartyNamesQuery("?type=supplier");

  console.log("customerNames", customerNames);
  console.log("supplierNames", supplierNames);
  const { data } = useExpensesQuery(`?${q}`);
  const { data: history } = useExpenseHistoryQuery();
  const { data: vehicles } = useVehiclesQuery(undefined, {
    skip: !can(user, "expenses:create"),
  });
  const [create] = useCreateExpenseMutation();
  const [update] = useUpdateExpenseMutation();
  const [remove] = useDeleteExpenseMutation();
  const allRows = data?.data || [];
  const rows = typeFilter
    ? allRows.filter((r: any) => r.type === typeFilter)
    : allRows;

  const save = (body: any) =>
    editing?._id
      ? update({ id: editing._id, body })
          .unwrap()
          .then(() => setEditing(undefined))
      : create(body)
          .unwrap()
          .then(() => setEditing(undefined));
  return (
    <>
      <PageHeader title="Expenses">
        {can(user, "expenses:create") && (
          <button className="btn btn-primary" onClick={() => setEditing(null)}>
            <Plus size={16} /> Add Expense
          </button>
        )}
      </PageHeader>

      {data?.cards && Object.keys(data.cards).length > 0 && (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {Object.entries(data.cards).map(([k, v]: [string, any]) => (
            <div className="panel border-l-4 border-sky" key={k}>
              <div className="text-xs font-bold uppercase text-slate-500">
                {k}
              </div>
              <div className="mt-2 text-xl font-black">{money(v.total)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        {/* Expense Type */}
        <div className="shrink-0">
          <select
            className="input w-full sm:w-54"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            
            <option value="">All Types</option>
            <option value="salary">Salary / Bonus</option>
            <option value="emi">EMI Paid</option>
            <option value="vehicle">Gaadi Expense</option>
          </select>
        </div>
        {/* Search / Filters */}
        <div className="min-w-0 flex-1">
          
          <Filters
            query={q}
            setQuery={(next) => {
              next.set("page", "1");
              next.set("limit", "20");
              setQ(next);
            }}
            rows={rows}
            name="expenses"
          />
        </div>
      </div>

      <div className="panel">
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full min-w-[1200px]">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr>
                {[
                  "Type",
                  "Date",
                  "Gaadi",
                  "Driver/Employee",
                  "Fuel",
                  "Food",
                  "Fuel Cost",
                  "Other",
                  "EMI",
                  "Salary",
                  "Bonus",
                  "Total",
                  "Actions",
                ].map((h) => (
                  <th className="th" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r._id}>
                  <td className="td">{r.type}</td>
                  <td className="td">{formatDate(r.expenseDate)}</td>
                  <td className="td">{r.vehicleNumber}</td>
                  <td className="td font-semibold">
                    {r.driverName || r.employeeName}
                  </td>
                  <td className="td">{r.fuelType}</td>
                  <td className="td">{money(r.foodCost)}</td>
                  <td className="td">{money(r.petrolCost)}</td>
                  <td className="td">{money(r.miscellaneousCost)}</td>
                  <td className="td">{money(r.fixedAmount)}</td>
                  <td className="td">{money(r.salaryAmount)}</td>
                  <td className="td">{money(r.bonusAmount)}</td>
                  <td className="td font-black">{money(total(r))}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      {can(user, "expenses:edit") && (
                        <button
                          title="Edit"
                          aria-label="Edit"
                          className="icon-btn text-sky-600"
                          onClick={() => setEditing(r)}
                        >
                          <Edit size={15} />
                        </button>
                      )}
                      {can(user, "expenses:delete") && (
                        <button
                          title="Delete"
                          aria-label="Delete"
                          className="icon-btn text-red-600"
                          onClick={() =>
                            confirm("Delete expense?") && remove(r._id)
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
        <div className="flex justify-between p-3 text-sm border-t mt-2">
          <span>
            Page {q.get("page") || 1} of{" "}
            {Math.max(1, Math.ceil((data?.total || rows.length) / 20))}
          </span>
          <div className="flex gap-2">
            <button
              className="btn bg-slate-100"
              disabled={Number(q.get("page") || 1) <= 1}
              onClick={() => {
                const n = new URLSearchParams(q);
                n.set("page", String(Number(q.get("page") || 1) - 1));
                setQ(n);
              }}
            >
              Prev
            </button>
            <button
              className="btn bg-slate-100"
              disabled={
                Number(q.get("page") || 1) >=
                Math.max(1, Math.ceil((data?.total || rows.length) / 20))
              }
              onClick={() => {
                const n = new URLSearchParams(q);
                n.set("page", String(Number(q.get("page") || 1) + 1));
                setQ(n);
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="panel mt-4">
        <h2 className="mb-3 font-black">Expense History</h2>
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full min-w-[760px]">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr>
                {["Type", "Person", "Gaadi", "Entries", "Total"].map((h) => (
                  <th className="th" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(history?.data || []).map((h: any) => (
                <tr
                  key={`${h._id.type}-${h._id.person}-${h._id.vehicleNumber}`}
                >
                  <td className="td">{h._id.type}</td>
                  <td className="td font-semibold">{h._id.person}</td>
                  <td className="td">{h._id.vehicleNumber}</td>
                  <td className="td">{h.entries}</td>
                  <td className="td font-black">{money(h.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing !== undefined && (
        <ExpenseForm
          entry={editing || undefined}
          vehicles={vehicles?.data || []}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      )}
    </>
  );
}

function ExpenseForm({
  entry,
  vehicles,
  onClose,
  onSave,
}: {
  entry?: Expense;
  vehicles: any[];
  onClose: () => void;
  onSave: (body: any) => Promise<unknown>;
}) {
  const [body, setBody] = useState<any>({
    type: entry?.type || "vehicle",
    vehicleNumber: entry?.vehicleNumber || "",
    driverName: entry?.driverName || "",
    employeeName: entry?.employeeName || "",
    fuelType: entry?.fuelType || "diesel",
    foodCost: entry ? String(entry.foodCost || "") : "",
    petrolCost: entry ? String(entry.petrolCost || "") : "",
    miscellaneousCost: entry ? String(entry.miscellaneousCost || "") : "",
    title: entry?.title || "",
    fixedAmount: entry ? String(entry.fixedAmount || "") : "",
    salaryAmount: entry ? String(entry.salaryAmount || "") : "",
    bonusAmount: entry ? String(entry.bonusAmount || "") : "",
    expenseDate: toDateInput(entry?.expenseDate),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setBody({ ...body, [k]: v });
  const pickVehicle = (vehicleNumber: string) => {
    const vehicle = vehicles.find(
      (v: any) => v.vehicleNumber === vehicleNumber,
    );
    setBody({
      ...body,
      vehicleNumber,
      driverName: vehicle?.driverName || body.driverName,
    });
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const keys = [
      "foodCost",
      "petrolCost",
      "miscellaneousCost",
      "fixedAmount",
      "salaryAmount",
      "bonusAmount",
    ];
    const next: Record<string, string> = {};
    const amounts = Object.fromEntries(
      keys.map((key) => {
        const parsed = parseAmount(body[key]);
        if (parsed.error) next[key] = parsed.error;
        return [key, parsed.value || 0];
      }),
    );
    if (!body.expenseDate) next.expenseDate = "Date is required";
    if (body.type === "vehicle" && !body.vehicleNumber)
      next.vehicleNumber = "Gaadi is required";
    if (body.type === "emi" && !body.title.trim())
      next.title = "EMI title is required";
    if (body.type === "salary" && !body.employeeName.trim())
      next.employeeName = "Employee or driver name is required";
    if (Object.values(amounts).every((v) => v === 0))
      next.foodCost = "Enter at least one amount";
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    await onSave({
      ...body,
      ...amounts,
      driverName: body.driverName.trim(),
      employeeName: body.employeeName.trim(),
      title: body.title.trim(),
    });
  }
  return (
    <Modal title={entry ? "Edit Expense" : "Add Expense"} onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <Field label="Expense Type" required>
          <SelectInput
            value={body.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="vehicle">Gaadi Expense</option>
            <option value="emi">EMI Paid</option>
            <option value="salary">Salary / Bonus</option>
          </SelectInput>
        </Field>
        <Field label="Expense Date" required error={errors.expenseDate}>
          <TextInput
            type="date"
            value={body.expenseDate}
            onChange={(e) => set("expenseDate", e.target.value)}
          />
        </Field>
        {body.type === "vehicle" && (
          <>
            <Field label="Gaadi Number" required error={errors.vehicleNumber}>
              <SelectInput
                value={body.vehicleNumber}
                onChange={(e) => pickVehicle(e.target.value)}
              >
                <option value="">Select gaadi</option>
                {vehicles.map((v: any) => (
                  <option key={v._id} value={v.vehicleNumber}>
                    {v.vehicleNumber} - {v.driverName}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Driver Name">
              <TextInput
                value={body.driverName}
                onChange={(e) => set("driverName", e.target.value)}
              />
            </Field>
            <Field label="Fuel Type">
              <SelectInput
                value={body.fuelType}
                onChange={(e) => set("fuelType", e.target.value)}
              >
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="cng">CNG</option>
              </SelectInput>
            </Field>
            <Field label="Food Cost" error={errors.foodCost}>
              <TextInput
                inputMode="decimal"
                value={body.foodCost}
                onChange={(e) => set("foodCost", e.target.value)}
              />
            </Field>
            <Field label="Fuel Cost" error={errors.petrolCost}>
              <TextInput
                inputMode="decimal"
                value={body.petrolCost}
                onChange={(e) => set("petrolCost", e.target.value)}
              />
            </Field>
            <Field label="Miscellaneous Cost" error={errors.miscellaneousCost}>
              <TextInput
                inputMode="decimal"
                value={body.miscellaneousCost}
                onChange={(e) => set("miscellaneousCost", e.target.value)}
              />
            </Field>
          </>
        )}
        {body.type === "emi" && (
          <>
            <Field label="EMI For" required error={errors.title}>
              <TextInput
                value={body.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Example: Bolero EMI"
              />
            </Field>
            <Field label="EMI Amount" error={errors.fixedAmount}>
              <TextInput
                inputMode="decimal"
                value={body.fixedAmount}
                onChange={(e) => set("fixedAmount", e.target.value)}
              />
            </Field>
          </>
        )}
        {body.type === "salary" && (
          <>
            <Field
              label="Employee / Driver Name"
              required
              error={errors.employeeName}
            >
              <TextInput
                value={body.employeeName}
                onChange={(e) => set("employeeName", e.target.value)}
              />
            </Field>
            <Field label="Salary Amount" error={errors.salaryAmount}>
              <TextInput
                inputMode="decimal"
                value={body.salaryAmount}
                onChange={(e) => set("salaryAmount", e.target.value)}
              />
            </Field>
            <Field label="Bonus Amount" error={errors.bonusAmount}>
              <TextInput
                inputMode="decimal"
                value={body.bonusAmount}
                onChange={(e) => set("bonusAmount", e.target.value)}
              />
            </Field>
          </>
        )}
        {errors.foodCost && (
          <p className="text-sm font-semibold text-tomato md:col-span-2">
            {errors.foodCost}
          </p>
        )}
        <button className="btn btn-primary md:col-span-2">
          {entry ? "Update Expense" : "Save Expense"}
        </button>
      </form>
    </Modal>
  );
}
