import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, ReactNode, SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";

export function Dropdown(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const options: { value: string; label: ReactNode; disabled?: boolean }[] = [];
  function collect(children: ReactNode) {
    Children.forEach(children, child => {
      if (!isValidElement<any>(child)) return;
      if (child.type === "option") options.push({ value: String(child.props.value ?? child.props.children), label: child.props.children, disabled: child.props.disabled });
      else collect(child.props.children);
    });
  }
  collect(props.children);
  const selected = String(props.value ?? props.defaultValue ?? options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 240 });
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  function show() {
    const rect = button.current!.getBoundingClientRect();
    const height = Math.min(240, Math.max(100, window.innerHeight - 24));
    const below = window.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;
    const down = below >= Math.min(height, options.length * 40) || below >= above;
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)), top: down ? rect.bottom + 4 : Math.max(8, rect.top - Math.min(height, above, options.length * 40) - 4), width: rect.width, maxHeight: Math.min(height, down ? below : above) });
    setActive(Math.max(0, options.findIndex(o => o.value === selected)));
    setOpen(true);
  }
  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    props.onChange?.({ target: { value: option.value, name: props.name }, currentTarget: { value: option.value, name: props.name } } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    button.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => { if (!button.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false); };
    const scroll = (event: Event) => { if (!menu.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", close);
    document.addEventListener("scroll", scroll, true);
    return () => { document.removeEventListener("pointerdown", close); window.removeEventListener("resize", close); document.removeEventListener("scroll", scroll, true); };
  }, [open]);
  useEffect(() => { menu.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" }); }, [active, open]);
  return <>
    <button ref={button} id={props.id} type="button" role="combobox" aria-label={props["aria-label"]} aria-expanded={open} aria-controls={id} aria-haspopup="listbox" aria-activedescendant={open ? `${id}-${active}` : undefined} disabled={props.disabled} className={`field app-select ${props.className || ""}`} onClick={() => open ? setOpen(false) : show()} onKeyDown={event => {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (!open) { show(); return; }
        const direction = event.key === "ArrowUp" ? -1 : 1;
        let next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : active + direction;
        while (next >= 0 && next < options.length && options[next].disabled) next += direction;
        setActive(Math.max(0, Math.min(options.length - 1, next)));
      } else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open ? choose(active) : show(); }
      else if (event.key === "Escape" || event.key === "Tab") setOpen(false);
      else if (event.key.length === 1) { const index = options.findIndex(o => !o.disabled && String(o.label).toLowerCase().startsWith(event.key.toLowerCase())); if (index >= 0) { if (!open) show(); setActive(index); } }
    }}>{options.find(o => o.value === selected)?.label || "Select"}<span aria-hidden="true">▾</span></button>
    {props.name && <input type="hidden" name={props.name} value={selected} />}
    {open && createPortal(<div ref={menu} id={id} role="listbox" className="app-options" style={position}>{options.map((option, index) => <div id={`${id}-${index}`} key={option.value + index} role="option" aria-selected={option.value === selected} aria-disabled={option.disabled} data-active={index === active} className="app-option" onPointerDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={event => { event.preventDefault(); event.stopPropagation(); choose(index); }}>{option.label}</div>)}</div>, document.body)}
  </>;
}
