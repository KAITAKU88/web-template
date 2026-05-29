"use client";

import { deleteCategory, reorderCategory } from "./actions";
import { useTransition } from "react";

interface Props {
  id: string;
  name: string;
  isFirst: boolean;
  isLast: boolean;
}

export default function CategoryActions({ id, name, isFirst, isLast }: Props) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Xóa danh mục "${name}"?`)) return;
    startTransition(() => deleteCategory(id));
  }

  return (
    <div className="flex gap-1">
      <button
        disabled={isFirst || pending}
        onClick={() => startTransition(() => reorderCategory(id, "up"))}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700 hover:text-white disabled:opacity-20"
        title="Lên"
      >↑</button>
      <button
        disabled={isLast || pending}
        onClick={() => startTransition(() => reorderCategory(id, "down"))}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700 hover:text-white disabled:opacity-20"
        title="Xuống"
      >↓</button>
      <button
        disabled={pending}
        onClick={handleDelete}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-20"
        title="Xóa"
      >✕</button>
    </div>
  );
}
