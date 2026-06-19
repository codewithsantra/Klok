// Tiny event-based toast API — call toast(...) from any client handler.
export type ToastType = "success" | "error" | "info";

export function toast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("klok:toast", { detail: { message, type } }));
}
