import type { User } from "./types";

export function can(user: User | null, permission: string) {
  return user?.role === "admin" || Boolean(user?.permissions?.includes(permission));
}

export function toDateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" });
}
