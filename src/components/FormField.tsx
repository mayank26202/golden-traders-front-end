import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dropdown } from "./Dropdown";

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
  if (props.list) return <SuggestedInput {...props} />;
  return <input {...props} className={`field ${props.className || ""}`} />;
}

function SuggestedInput({ list, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const input = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 200 });
  const id = useId();
  useEffect(() => {
    if (!options.length) return;
    const close = (event: Event) => { if (!menu.current?.contains(event.target as Node)) setOptions([]); };
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [options.length]);
  useEffect(() => { menu.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" }); }, [active]);
  function suggest(value: string) {
    const choices = Array.from((document.getElementById(list!) as HTMLDataListElement | null)?.options || []).map(option => option.value);
    setOptions([...new Set(choices)].filter(option => option.toLowerCase().includes(value.toLowerCase())));
    setActive(-1);
    const rect = input.current!.getBoundingClientRect();
    const down = window.innerHeight - rect.bottom > 160;
    setPosition({ left: rect.left, top: down ? rect.bottom + 4 : Math.max(8, rect.top - 204), width: rect.width, maxHeight: down ? Math.min(200, window.innerHeight - rect.bottom - 8) : Math.min(200, rect.top - 8) });
  }
  function choose(value: string) {
    const target = input.current!;
    target.value = value;
    props.onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLInputElement>);
    setOptions([]);
  }
  return <><input {...props} ref={input} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={options.length > 0} aria-controls={id} aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} className={`field ${props.className || ""}`} onFocus={event => { suggest(event.target.value); props.onFocus?.(event); }} onBlur={event => { setOptions([]); props.onBlur?.(event); }} onChange={event => { props.onChange?.(event); suggest(event.target.value); }} onKeyDown={event => {
    if (options.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setActive(index => Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))); }
    else if (event.key === "Enter" && active >= 0 && options[active]) { event.preventDefault(); choose(options[active]); }
    else if (event.key === "Escape") { event.preventDefault(); setOptions([]); }
    props.onKeyDown?.(event);
  }} />{options.length > 0 && createPortal(<div ref={menu} id={id} role="listbox" className="app-options" style={position}>{options.map((option, index) => <div id={`${id}-${index}`} key={option} role="option" aria-selected={index === active} data-active={index === active} className="app-option" onPointerDown={event => { event.preventDefault(); choose(option); }}>{option}</div>)}</div>, document.body)}</>;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <Dropdown {...props} />;
}

export function parseAmount(value: string) {
  if (value.trim() === "") return { value: 0 };
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return { error: "Enter a valid number" };
  return { value: Number(value) };
}
