"use client";
import { useState } from "react";

interface FaqItem { q: string; a: string; }

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {items.map(({ q, a }, i) => (
        <div
          key={i}
          className={`overflow-hidden rounded-xl border transition-colors ${
            open === i ? "border-green-400" : "border-gray-200 bg-white"
          }`}
        >
          <button
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-gray-800"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {q}
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-base transition-all duration-200 ${
                open === i
                  ? "rotate-45 border-green-400 bg-green-50 text-green-500"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              +
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              open === i ? "max-h-48" : "max-h-0"
            }`}
          >
            <p className="border-t border-gray-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-gray-500">
              {a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
