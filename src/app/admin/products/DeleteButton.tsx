"use client";

import { useTransition } from "react";
import { deleteProduct } from "./actions";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Xóa "${name}"? Hành động này không thể hoàn tác.`)) return;
    startTransition(() => deleteProduct(id));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {pending ? "…" : "Xóa"}
    </button>
  );
}
