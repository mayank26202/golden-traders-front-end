import { useEffect, useRef } from "react";
import type { Dispatch, KeyboardEvent, SetStateAction } from "react";

export function useBulkKeyboard(rows: any[], setRows: Dispatch<SetStateAction<any[]>>, empty: Record<string, string>) {
  const pending = useRef<number | null>(null);
  const handleAdd = () => {
    const id = Math.max(Date.now(), ...rows.map(row => row.id + 1));
    pending.current = id;
    setRows(previous => [...previous, { id, ...empty }]);
  };
  useEffect(() => {
    if (pending.current === null) return;
    const input = document.getElementById(`bulk-name-${pending.current}`);
    input?.focus();
    input?.scrollIntoView({ block: "nearest" });
    pending.current = null;
  }, [rows]);
  const handleKeyDown = (event: KeyboardEvent, id: number) => {
    if (event.key !== "Enter" || event.repeat || event.nativeEvent.isComposing || event.defaultPrevented) return;
    event.preventDefault();
    const index = rows.findIndex(row => row.id === id);
    const next = rows[index + 1];
    if (next) { const input = document.getElementById(`bulk-name-${next.id}`); input?.focus(); input?.scrollIntoView({ block: "nearest" }); }
    else handleAdd();
  };
  return { handleAdd, handleKeyDown };
}
