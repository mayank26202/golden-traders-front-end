import { Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from "chart.js";
import { PageHeader } from "../components/Layout";
import { useDashboardQuery } from "../app/api";
import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { Activity, Banknote, CircleDollarSign, Scale, TrendingDown, TrendingUp, Wallet } from "lucide-react";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString()}`;
const number = (value: number) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function Dashboard() {
  const { user } = useSelector((s: RootState) => s.auth);
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [filter, setFilter] = useState({ mode: "today", from: defaultDate, to: defaultDate });
  const [draft, setDraft] = useState({ from: defaultDate, to: defaultDate });
  const query = filter.mode === "overall" ? "?period=overall" : `?from=${filter.from}&to=${filter.to}`;
  const { data } = useDashboardQuery(query);
  const cards = data?.cards || {};
  const chart = data?.trend || [];
  const paymentLabels = Object.keys(data?.paymentMix || {});
  const metrics = [
    { label: "Turnover", value: money(cards.turnover), tone: "border-[#13a47f]", icon: CircleDollarSign, sub: `${cards.saleCount || 0} sale entries` },
    { label: "Net Profit", value: money(cards.profit), tone: cards.profit >= 0 ? "border-[#0ea5e9]" : "border-[#f87171]", icon: TrendingUp, sub: `${number(cards.marginPercent)}% margin` },
    { label: "Supply Cost", value: money(cards.supplyCost), tone: "border-[#f59e0b]", icon: Wallet, sub: `${cards.supplyCount || 0} supplier entries` },
    { label: "Pending Collection", value: money(cards.pendingSales), tone: "border-[#f87171]", icon: Banknote, sub: `${money(cards.paidSales)} received` },
    { label: "Stock Loss", value: `${cards.deadOrMissingKg >= 0 ? "+" : ""}${number(cards.deadOrMissingKg)} kg`, tone: cards.deadOrMissingKg > 0 ? "border-[#f87171]" : "border-[#13a47f]", icon: Scale, sub: `${number(cards.supplyKg)} kg in - ${number(cards.saleKg)} kg out` },
    { label: "Expenses", value: money(cards.expenseCost), tone: "border-[#64748b]", icon: TrendingDown, sub: `${cards.expenseCount || 0} expense entries` },
    { label: "Received Payments", value: money(cards.receivedPayments), tone: "border-[#f87171]", icon: Activity, sub: `${cards.recievedPaymentsCount || 0} payment entries` },
  ];
  return (
    <>
      <PageHeader title="Business Dashboard">
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1.5"><span className="text-xs font-bold uppercase text-slate-500">From</span><input className="field w-40" type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></label>
          <label className="grid gap-1.5"><span className="text-xs font-bold uppercase text-slate-500">To</span><input className="field w-40" type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></label>
          <button className="btn bg-ink text-white" onClick={() => setFilter({ mode: "custom", from: draft.from, to: draft.to })}>Apply</button>
          <button className={`btn ${filter.mode === "today" ? "btn-primary" : "bg-slate-100 text-slate-700"}`} onClick={() => { setDraft({ from: defaultDate, to: defaultDate }); setFilter({ mode: "today", from: defaultDate, to: defaultDate }); }}>Today</button>
          <button className={`btn ${filter.mode === "overall" ? "btn-sky" : "bg-slate-100 text-slate-700"}`} onClick={() => setFilter({ ...filter, mode: "overall" })}>Overall</button>
        </div>
      </PageHeader>
      <section className="mb-5 rounded-xl bg-ink p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-200">{filter.mode === "overall" ? "Overall business view" : `${filter.from} to ${filter.to}`}</p>
            <h2 className="mt-1 text-3xl font-black">Stock, cash, profit and pending payments</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right">
            <div><div className="text-xs text-slate-300">Avg Buy Rate</div><div className="text-xl font-black">{money(cards.avgBuyRate)}</div></div>
            <div><div className="text-xs text-slate-300">Avg Sale Rate</div><div className="text-xl font-black">{money(cards.avgSaleRate)}</div></div>
          </div>
        </div>
      </section>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((item) => {
          const Icon = item.icon;
          return <div key={item.label} className={`panel border-l-4 ${item.tone}`}><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase text-slate-500">{item.label}</span><Icon size={18} className="text-slate-400" /></div><div className="text-2xl font-black">{item.value}</div><div className="mt-1 text-xs font-semibold text-slate-500">{item.sub}</div></div>;
        })}
      </div>
      {user?.role === "admin" && <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="panel"><div className="mb-3 flex items-center gap-2 font-black"><Activity size={18} /> Revenue, Cost and Profit Trend</div><Line options={{ responsive: true, plugins: { legend: { position: "bottom" } }, scales: { y: { grid: { color: "#eef2f7" } }, x: { grid: { display: false } } } }} data={{ labels: chart.map((x: any) => x.date), datasets: [{ label: "Revenue", data: chart.map((x: any) => x.revenue), borderColor: "#13a47f", backgroundColor: "rgba(19,164,127,.12)", fill: true, tension: .35 }, { label: "Cost", data: chart.map((x: any) => x.cost), borderColor: "#ef5a4c", tension: .35 }, { label: "Profit", data: chart.map((x: any) => x.profit), borderColor: "#3182ce", tension: .35 }] }} /></div>
        <div className="panel"><h2 className="mb-3 font-black">Payment Mix</h2>{paymentLabels.length ? <Doughnut data={{ labels: paymentLabels.map((x) => x.replaceAll("_", " ")), datasets: [{ data: paymentLabels.map((x) => data.paymentMix[x].total), backgroundColor: ["#13a47f", "#3182ce", "#f59e0b", "#ef5a4c", "#64748b"] }] }} /> : <p className="text-sm text-slate-500">No completed payments yet.</p>}</div>
      </div>}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Recent title="Recent Sales" rows={data?.recent?.sales || []} nameKey="customerName" dateKey="saleDate" />
        <Recent title="Recent Supplies" rows={data?.recent?.supplies || []} nameKey="supplierName" dateKey="supplyDate" />
      </div>
      {user?.role === "admin" && <div className="panel mt-4"><h2 className="mb-3 font-black">Last User Login</h2><table className="w-full"><tbody>{data?.users?.map((u: any) => <tr key={u._id}><td className="td font-semibold">{u.name}</td><td className="td">{u.email}</td><td className="td">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</td></tr>)}</tbody></table></div>}
    </>
  );
}

function Recent({ title, rows, nameKey, dateKey }: { title: string; rows: any[]; nameKey: string; dateKey: string }) {
  const amount = (row: any) => "totalKg" in row ? row.totalKg * row.rateOfSale : row.kgWeight * row.ratePerKg;
  return <div className="panel"><h2 className="mb-3 font-black">{title}</h2><table className="w-full"><tbody>{rows.map((row) => <tr key={row._id}><td className="td font-semibold">{row[nameKey]}</td><td className="td">{new Date(row[dateKey]).toLocaleDateString()}</td><td className="td text-right">{money(amount(row))}</td></tr>)}{!rows.length && <tr><td className="td text-slate-500">No entries yet.</td></tr>}</tbody></table></div>;
}
