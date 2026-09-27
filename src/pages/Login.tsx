// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { LogIn, Truck, ShieldCheck, Box } from "lucide-react";
// import { useDispatch } from "react-redux";
// import { useLoginMutation } from "../app/api";
// import { setCredentials } from "../app/store";

// export function Login() {
//   const [email, setEmail] = useState("admin@example.com");
//   const [password, setPassword] = useState("Admin@12345");
//   const [login, { isLoading, error }] = useLoginMutation();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
  
//   async function submit(e: React.FormEvent) {
//     e.preventDefault();
//     const data = await login({ email, password }).unwrap();
//     dispatch(setCredentials(data));
//     navigate("/");
//   }
  
//   return (
//     <div className="flex min-h-screen bg-slate-50">
//       <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-center px-12 relative overflow-hidden">
//         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400 via-slate-900 to-slate-900"></div>
//         <div className="relative z-10 max-w-lg mx-auto">
//           <Truck size={48} className="text-sky-400 mb-6" />
//           <p className="text-4xl font-red font-bold mb-4">Golden Traders Supply System</p>
//           <p className="text-lg text-slate-300 mb-8 leading-relaxed">
//             The complete management platform for modern supply chains. Track daily stock, monitor sales, calculate costs, and optimize your profits all in one place.
//           </p>
//           <div className="grid gap-4">
//             <div className="flex items-center gap-3"><ShieldCheck className="text-mint" /><span className="text-slate-300 font-medium">Secure Role-Based Access</span></div>
//             <div className="flex items-center gap-3"><Box className="text-amber" /><span className="text-slate-300 font-medium">Real-time Stock Management</span></div>
//           </div>
//         </div>
//       </div>
      
//       <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
//         <div className="w-full max-w-sm">
//           <div className="mb-10 text-center lg:hidden">
//             <h1 className="text-3xl font-black text-slate-900">Golden Traders</h1>
//             <p className="text-slate-500 mt-2">Supply Management System</p>
//           </div>
          
//           <form onSubmit={submit} className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
//             <div className="mb-8">
//               <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
//               <p className="text-sm text-slate-500 mt-1">Please enter your details to sign in.</p>
//             </div>
            
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Email</label>
//                 <input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} />
//               </div>
              
//               <div>
//                 <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Password</label>
//                 <input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-colors" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
//               </div>
//             </div>
            
//             <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg mt-8 transition-colors flex justify-center items-center gap-2" disabled={isLoading}>
//               <LogIn size={18} /> {isLoading ? "Signing in..." : "Sign in to account"}
//             </button>
            
//             {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium text-center border border-red-100">Invalid email or password</div>}
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogIn,
  Truck,
  ShieldCheck,
  Package,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../app/api";
import { setCredentials } from "../app/store";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const data = await login({ email, password }).unwrap();
      dispatch(setCredentials(data));
      navigate("/");
    } catch {
      // Error is handled by the error state below
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#111827] text-white relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#13a47f]/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-[#13a47f]/10 blur-3xl" />

          <div className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#13a47f] flex items-center justify-center shadow-lg shadow-[#13a47f]/20">
                <Truck size={23} strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xl font-bold tracking-tight">
                  Golden Traders
                </p>
                <p className="text-xs text-slate-400 tracking-wider uppercase">
                  Supply Management
                </p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-xl">

            <h1 className="text-5xl xl:text-6xl text-white leading-[1.05] tracking-tight">
              Manage your
              <span className="block text-[#13a47f]">
                supply business.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-400 max-w-lg">
              Keep track of inventory, purchases, sales, payments and
              day-to-day operations from one simple dashboard.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mt-10">

              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <Package size={19} />
                </div>

                <p className="font-semibold text-sm">
                  Stock Control
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Monitor inventory and movement
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <BarChart3 size={19} />
                </div>

                <p className="font-semibold text-sm">
                  Business Insights
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Track sales and performance
                </p>
              </div>

            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck size={17} className="text-emerald-400" />
            Secure role-based access
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">

            <div className="inline-flex w-12 h-12 rounded-xl bg-[#13a47f] text-white items-center justify-center mb-3 shadow-lg shadow-[#13a47f]/20">
              <Truck size={24} />
            </div>

            <h1 className="text-2xl font-black text-slate-900">
              Golden Traders
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Supply Management System
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] p-7 sm:p-9">

            {/* Header */}
            <div className="mb-8">

              <div className="w-11 h-11 rounded-xl bg-[#13a47f]/10 text-[#13a47f] flex items-center justify-center mb-5">
                <LogIn size={21} />
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Sign in to continue to your dashboard.
              </p>

            </div>

            <form onSubmit={submit}>

              {/* Email */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#13a47f] focus:ring-4 focus:ring-[#13a47f]/10"
                />
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#13a47f] focus:ring-4 focus:ring-[#13a47f]/10"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 font-medium">
                  Invalid email or password. Please try again.
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full h-12 rounded-xl bg-[#111827] hover:bg-[#13a47f]/80 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-[#13a47f]/20"
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

            </form>

            {/* Footer */}
            <div className="mt-7 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Authorized users only
              </p>
            </div>

          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © {new Date().getFullYear()} Golden Traders. All rights reserved.
          </p>

        </div>
      </div>
    </div>
  );
}