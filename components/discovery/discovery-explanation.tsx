import type { DiscoveryMatchReason } from "@/types/discovery";

interface DiscoveryExplanationProps {
  reasons: readonly DiscoveryMatchReason[];
  maxReasons?: 1 | 2;
  compact?: boolean;
  className?: string;
}

export function DiscoveryExplanation({
  reasons,
  maxReasons = 2,
  compact = false,
  className = "",
}: DiscoveryExplanationProps) {
  const visibleReasons = reasons.slice(0, maxReasons);
  if (visibleReasons.length === 0) return null;

  return (
    <ul
      className={`flex flex-wrap gap-x-3 gap-y-1 text-slate-400 ${compact ? "mt-1.5 text-[10px] leading-4" : "mt-4 text-xs leading-5"} ${className}`}
    >
      {visibleReasons.map((reason, index) => (
        <li
          key={`${reason.kind}-${reason.source}-${reason.displayValue}`}
          className={index > 0 ? "hidden sm:list-item" : undefined}
        >
          <span className="font-semibold text-slate-300">{reason.label}:</span>{" "}
          <span>{reason.displayValue}</span>
        </li>
      ))}
    </ul>
  );
}
