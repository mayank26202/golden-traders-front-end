import { BarChart3, CreditCard, LogOut, ReceiptText, ShieldCheck, ShoppingCart, Truck, UserCircle, Users, WalletCards } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, type RootState } from "../app/store";

const nav = [
  { to: "/", label: "Dashboard", icon: BarChart3, adminOnly: false },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/expenses", label: "Expenses", icon: WalletCards },
  { to: "/customers", label: "Customer History", icon: Users },
  { to: "/users", label: "Users", icon: ShieldCheck, adminOnly: true },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export function Layout() {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#13a47f] text-lg font-black text-white">GT</div>
          <div><div className="font-black">Golden Traders</div><div className="text-xs text-slate-500">{user?.role === "admin" ? "Admin Control" : "Entry User"}</div></div>
        </div>
        <nav className="space-y-1">
          {nav.filter((x) => !x.adminOnly || user?.role === "admin").map((item) => {
            const Icon = item.icon;
            return <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-[#13a47f] text-white" : "text-slate-700 hover:bg-slate-100"}`}><Icon size={18} />{item.label}</NavLink>;
          })}
        </nav>
        <button className="btn mt-8 w-full bg-slate-100 text-slate-700" onClick={() => { dispatch(logout()); navigate("/login"); }}><LogOut size={17} /> Logout</button>
      </aside>
      <main className="flex-1 p-6"><Outlet /></main>
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black">{title}</h1><div className="flex flex-wrap gap-2">{children}</div></div>;
}
