"use client";

import { useEffect, useState } from "react";

type Item = { id: number; message: string; type: "success" | "error" | "info" };

const ICON = {
  success: "fa-circle-check",
  error: "fa-circle-exclamation",
  info: "fa-circle-info",
} as const;

export default function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let n = 0;
    function onToast(e: Event) {
      const detail = (e as CustomEvent).detail as { message: string; type: Item["type"] };
      const id = ++n;
      setItems((prev) => [...prev, { id, message: detail.message, type: detail.type || "success" }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
    }
    window.addEventListener("klok:toast", onToast);
    return () => window.removeEventListener("klok:toast", onToast);
  }, []);

  return (
    <div className="toaster" aria-live="polite" aria-atomic="true">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status">
          <i className={`fa-solid ${ICON[t.type]}`}></i>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
