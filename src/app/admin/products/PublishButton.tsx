"use client";

import { useState, useTransition } from "react";
import { toggleProductStatus } from "./actions";

export function PublishButton({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  function handleToggle() {
    startTransition(async () => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      await toggleProductStatus(id, newStatus);
      setCurrentStatus(newStatus);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        currentStatus === "published"
          ? "bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400"
          : "bg-gray-800 text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400"
      }`}
      title={currentStatus === "published" ? "Unpublish (ẩn khỏi web)" : "Publish (hiển thị trên web)"}
    >
      {isPending ? "..." : currentStatus === "published" ? "Published" : "Draft"}
    </button>
  );
}
