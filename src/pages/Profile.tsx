import { useState } from "react";
import { useSelector } from "react-redux";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useChangePasswordMutation, useCreateVehicleMutation, useDeleteVehicleMutation, useUpdateVehicleMutation, useVehiclesQuery } from "../app/api";
import { PageHeader } from "../components/Layout";
import { Field, TextInput } from "../components/FormField";
import { Modal } from "../components/Modal";
import type { RootState } from "../app/store";
import type { Vehicle } from "../lib/types";

export function Profile() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [vehicleEntry, setVehicleEntry] = useState<Vehicle | null | undefined>();
  const [change, { isSuccess }] = useChangePasswordMutation();
  const { data: vehicles } = useVehiclesQuery(undefined, { skip: user?.role !== "admin" });
  const [createVehicle] = useCreateVehicleMutation();
  const [updateVehicle] = useUpdateVehicleMutation();
  const [deleteVehicle] = useDeleteVehicleMutation();
  const saveVehicle = (body: any) => vehicleEntry?._id ? updateVehicle({ id: vehicleEntry._id, body }).unwrap().then(() => setVehicleEntry(undefined)) : createVehicle(body).unwrap().then(() => setVehicleEntry(undefined));

  return (
    <>
      <PageHeader title="Profile" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel">
          <h2 className="font-black">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="mt-3 text-sm font-semibold">Role: {user?.role}</p>
        </div>
        <form className="panel" onSubmit={(e) => { e.preventDefault(); change({ oldPassword, newPassword }); }}>
          <h2 className="mb-3 font-black">Change Password</h2>
          <Field label="Old Password" required><TextInput type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} /></Field>
          <div className="mt-3"><Field label="New Password" required><TextInput type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} /></Field></div>
          <button className="btn btn-primary mt-4">Update</button>
          {isSuccess && <span className="ml-3 text-sm font-semibold text-mint">Saved</span>}
        </form>
      </div>
      {user?.role === "admin" && (
        <div className="panel mt-4 overflow-x-auto">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-black">Vehicle Master</h2>
            <button className="btn btn-primary" onClick={() => setVehicleEntry(null)}><Plus size={16} /> Add Gaadi</button>
          </div>
          <table className="w-full min-w-[760px]">
            <thead><tr>{["Gaadi No","Model","Driver","Phone","Status","Actions"].map((h) => <th className="th" key={h}>{h}</th>)}</tr></thead>
            <tbody>{(vehicles?.data || []).map((v) => <tr key={v._id}><td className="td font-semibold">{v.vehicleNumber}</td><td className="td">{v.model}</td><td className="td">{v.driverName}</td><td className="td">{v.driverPhone}</td><td className="td">{v.active ? "Active" : "Inactive"}</td><td className="td"><div className="flex gap-2"><button className="btn btn-sky" onClick={() => setVehicleEntry(v)}><Edit size={15} /> Edit</button><button className={`btn ${v.active ? "btn-danger" : "btn-primary"}`} onClick={() => updateVehicle({ id: v._id, body: { active: !v.active } })}>{v.active ? "Disable" : "Enable"}</button><button className="btn btn-danger" onClick={() => confirm("Delete vehicle?") && deleteVehicle(v._id)}><Trash2 size={15} /> Delete</button></div></td></tr>)}</tbody>
          </table>
        </div>
      )}
      {vehicleEntry !== undefined && <VehicleForm entry={vehicleEntry || undefined} onClose={() => setVehicleEntry(undefined)} onSave={saveVehicle} />}
    </>
  );
}

function VehicleForm({ entry, onClose, onSave }: { entry?: Vehicle; onClose: () => void; onSave: (body: any) => Promise<unknown> }) {
  const [body, setBody] = useState({ vehicleNumber: entry?.vehicleNumber || "", model: entry?.model || "", driverName: entry?.driverName || "", driverPhone: entry?.driverPhone || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!body.vehicleNumber.trim()) next.vehicleNumber = "Gaadi number is required";
    if (!body.model.trim()) next.model = "Model is required";
    if (!body.driverName.trim()) next.driverName = "Driver name is required";
    if (!/^[0-9+\-\s]{8,15}$/.test(body.driverPhone.trim())) next.driverPhone = "Enter valid phone number";
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    setApiError("");
    try {
      await onSave({
        vehicleNumber: body.vehicleNumber.trim().toUpperCase(),
        model: body.model.trim(),
        driverName: body.driverName.trim(),
        driverPhone: body.driverPhone.trim(),
      });
    } catch {
      setApiError("Gaadi save nahi hui. Gaadi number duplicate ho sakta hai.");
    }
  }
  return <Modal title={entry ? "Edit Gaadi" : "Add Gaadi"} onClose={onClose}><form className="grid gap-4" onSubmit={submit}><Field label="Gaadi Number" required error={errors.vehicleNumber}><TextInput value={body.vehicleNumber} onChange={(e) => setBody({ ...body, vehicleNumber: e.target.value })} placeholder="Example: DL 01 AB 1234" /></Field><Field label="Model" required error={errors.model}><TextInput value={body.model} onChange={(e) => setBody({ ...body, model: e.target.value })} placeholder="Example: Bolero Pickup" /></Field><Field label="Driver Name" required error={errors.driverName}><TextInput value={body.driverName} onChange={(e) => setBody({ ...body, driverName: e.target.value })} /></Field><Field label="Driver Phone" required error={errors.driverPhone}><TextInput inputMode="tel" value={body.driverPhone} onChange={(e) => setBody({ ...body, driverPhone: e.target.value })} placeholder="Example: 9876543210" /></Field>{apiError && <p className="text-sm font-semibold text-tomato">{apiError}</p>}<button className="btn btn-primary">{entry ? "Update Gaadi" : "Save Gaadi"}</button></form></Modal>;
}
