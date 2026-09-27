import { X } from "lucide-react";

export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/30 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2><button className="grid h-9 w-9 place-items-center rounded-md hover:bg-slate-100" onClick={onClose}><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
