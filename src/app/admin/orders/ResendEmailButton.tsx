"use client";

import { useState } from "react";

export default function ResendEmailButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function handleClick() {
    setState("sending");
    const res = await fetch(`/api/admin/resend-order-email?orderId=${orderId}`, { method: "POST" });
    setState(res.ok ? "ok" : "err");
    if (res.ok) setTimeout(() => setState("idle"), 3000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "sending" || state === "ok"}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
        state === "ok"  ? "bg-emerald-500/20 text-emerald-400 cursor-default" :
        state === "err" ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" :
        state === "sending" ? "bg-gray-700 text-gray-500 cursor-wait" :
        "bg-gray-700 text-gray-300 hover:bg-gray-600"
      }`}
    >
      {state === "sending" ? "…" : state === "ok" ? "✓ Đã gửi" : state === "err" ? "Lỗi" : "Gửi lại"}
    </button>
  );
}
