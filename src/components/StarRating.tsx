import { formatCount } from "@/lib/utils";

interface Props {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, count, size = "sm" }: Props) {
  const pct = Math.min(100, Math.max(0, (rating / 5) * 100));
  const starClass = size === "md" ? "text-2xl" : "text-base";

  return (
    <span className="flex items-center gap-1.5">
      {/* 5 sao overlay */}
      <span className={`relative inline-flex ${starClass} leading-none`}>
        <span className="text-gray-200">★★★★★</span>
        <span
          className="absolute inset-0 overflow-hidden text-amber-400"
          style={{ width: `${pct}%` }}
        >
          ★★★★★
        </span>
      </span>
      <span className="font-bold text-gray-800">{rating.toFixed(1)}</span>
      {count != null && count > 0 && (
        <span className="text-gray-500">({formatCount(count)})</span>
      )}
    </span>
  );
}
