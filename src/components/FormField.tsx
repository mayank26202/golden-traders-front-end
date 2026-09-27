import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-bold text-slate-700">
        {label} {required && <span className="text-tomato">*</span>}
      </span>
      {children}
      {error && <span className="text-xs font-semibold text-tomato">{error}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field ${props.className || ""}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`field ${props.className || ""}`} />;
}

export function parseAmount(value: string) {
  if (value.trim() === "") return { value: 0 };
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return { error: "Enter a valid number" };
  return { value: Number(value) };
}
