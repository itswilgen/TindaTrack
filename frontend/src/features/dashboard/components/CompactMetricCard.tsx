import { ArrowUpRight, type LucideIcon } from "lucide-react";

type Tone = "leaf" | "sage" | "amber" | "rose" | "sky";

const toneStyles: Record<
  Tone,
  { icon: string; detail: string; border: string }
> = {
  leaf: {
    icon: "bg-leaf/10 text-leaf-dark",
    detail: "text-sage",
    border: "hover:border-leaf/30",
  },
  sage: {
    icon: "bg-sage/10 text-sage-dark",
    detail: "text-sage",
    border: "hover:border-sage/35",
  },
  amber: {
    icon: "bg-amber/10 text-amber",
    detail: "text-amber",
    border: "hover:border-amber/35",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    detail: "text-rose-600",
    border: "hover:border-rose-200",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600",
    detail: "text-sky-600",
    border: "hover:border-sky-200",
  },
};

function CompactMetricCard({
  detail,
  icon: Icon,
  label,
  tone = "leaf",
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone?: Tone;
  value: string;
}) {
  const styles = toneStyles[tone];

  return (
    <div
      className={`grid min-h-[6.35rem] grid-cols-[2.75rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-lg border border-ink-line bg-white px-4 py-3.5 transition ${styles.border} hover:shadow-[0_12px_26px_rgba(15,111,87,0.08)]`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-lg ${styles.icon}`}
      >
        <Icon size={20} strokeWidth={2} />
      </span>

      <div className="min-w-0 self-center">
        <p className="truncate text-[0.78rem] font-bold leading-4 text-ink-soft">
          {label}
        </p>
        <p className="mt-0.5 truncate font-display text-[1.45rem] font-bold leading-7 text-pine">
          {value}
        </p>
        <p
          className={`mt-0.5 truncate text-[0.68rem] font-bold leading-4 ${styles.detail}`}
        >
          {detail}
        </p>
      </div>

      <ArrowUpRight
        className="self-start text-ink-soft"
        size={18}
        strokeWidth={2}
      />
    </div>
  );
}

export default CompactMetricCard;
