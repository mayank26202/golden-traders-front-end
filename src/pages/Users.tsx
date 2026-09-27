import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../components/Layout";
import { Modal } from "../components/Modal";
import { useCreateUserMutation, useUpdateUserMutation, useUsersQuery } from "../app/api";
import { Field, TextInput } from "../components/FormField";

const permissions = ["dashboard:view","suppliers:create","suppliers:edit","suppliers:delete","sales:create","sales:edit","sales:delete","expenses:create","expenses:edit","expenses:delete","payments:view","reports:export","users:manage"];

export function UsersPage() {
  const { data } = useUsersQuery();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [create] = useCreateUserMutation();
  const [update] = useUpdateUserMutation();
  return <><PageHeader title="Users"><button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Create User</button></PageHeader><div className="grid gap-3">{data?.data.map((u) => {
    const selected = drafts[u._id] || u.permissions;
    return <div className="panel" key={u._id}><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-black">{u.name}</div><div className="text-sm text-slate-500">{u.email} · {u.role}</div></div>{u.role !== "admin" && <button className={`btn ${u.active ? "btn-danger" : "btn-primary"}`} onClick={() => update({ id: u._id, body: { active: !u.active } })}>{u.active ? "Disable" : "Enable"}</button>}</div>{u.role !== "admin" && <><div className="mt-3 grid gap-2 md:grid-cols-4">{permissions.map((p) => <label key={p} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(p)} onChange={(e) => { const next = e.target.checked ? [...selected, p] : selected.filter((x) => x !== p); setDrafts({ ...drafts, [u._id]: next }); }} />{p}</label>)}</div><button className="btn btn-primary mt-3" onClick={() => update({ id: u._id, body: { permissions: selected } }).then(() => setDrafts(({ [u._id]: _done, ...rest }) => rest))}>Save Permissions</button></>}</div>;
  })}</div>{open && <UserForm onClose={() => setOpen(false)} onSave={(body) => create(body).unwrap().then(() => setOpen(false))} />}</>;
}

function UserForm({ onClose, onSave }: { onClose: () => void; onSave: (body: any) => Promise<unknown> }) {
  const [body, setBody] = useState({ name: "", email: "", password: "", permissions: ["suppliers:create", "sales:create"] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!body.name.trim()) next.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(body.email)) next.email = "Enter a valid email";
    if (body.password.length < 8) next.password = "Password must be at least 8 characters";
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    setApiError("");
    try {
      await onSave({ ...body, name: body.name.trim(), email: body.email.trim().toLowerCase() });
    } catch {
      setApiError("Could not create user. Email may already exist.");
    }
  }
  return <Modal title="Create User" onClose={onClose}><form className="grid gap-4" onSubmit={submit}><Field label="Full Name" required error={errors.name}><TextInput placeholder="Enter user name" value={body.name} onChange={(e) => setBody({ ...body, name: e.target.value })} /></Field><Field label="Email" required error={errors.email}><TextInput placeholder="user@example.com" value={body.email} onChange={(e) => setBody({ ...body, email: e.target.value })} /></Field><Field label="Password" required error={errors.password}><TextInput type="password" placeholder="Minimum 8 characters" value={body.password} onChange={(e) => setBody({ ...body, password: e.target.value })} /></Field><div className="rounded-md bg-slate-100 p-3 text-sm font-semibold text-slate-600">Default permissions: create supplier and sale entries. Admin can edit this after saving.</div>{apiError && <p className="text-sm font-semibold text-tomato">{apiError}</p>}<button className="btn btn-primary">Save User</button></form></Modal>;
}
