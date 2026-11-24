import { reachChartCopy } from "@/data/i18n/reach-dashboard";
import type { PublicReachPeriod } from "@/lib/analytics/reach-periods";
import type { Locale } from "@/lib/i18n/config";

export function ReachGrowthChart({ data, locale, daily }: {
  data: Extract<PublicReachPeriod, { status: "available" }>; locale: Locale; daily: string;
}) {
  const [metric, gaps] = reachChartCopy[locale];
  const series = data.growth;
  const start = Date.parse(data.from);
  const lastDay = Math.max(start, Date.parse(data.to) - 86400000);
  const duration = Math.max(86400000, lastDay - start);
  const maximum = Math.max(...series.map(({ pageViews }) => pageViews), 1);
  const targetStep = Math.max(1, maximum / 4);
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const step = [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= targetStep) ?? Math.ceil(targetStep);
  const top = step * 4;
  const ticks = [top, step * 3, step * 2, step, 0];
  const number = new Intl.NumberFormat(locale);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const points = series.map(({ day, pageViews }) => ({
    time: Date.parse(day), x: 4 + 592 * (Date.parse(day) - start) / duration, y: 8 + 144 * (1 - pageViews / top),
  }));
  const line = points.map(({ time, x, y }, i) => `${i > 0 && time - points[i - 1].time === 86400000 ? "L" : "M"}${x},${y}`).join(" ");
  return <>
    <p className="mt-2 text-sm text-slate-300">{metric}</p>
    <div className="reach-chart" aria-hidden="true">
      <div className="reach-chart-y">{ticks.map((tick) => <span key={tick}>{number.format(tick)}</span>)}</div>
      <svg viewBox="0 0 600 160" preserveAspectRatio="none">
        <path d="M4 8H596 M4 44H596 M4 80H596 M4 116H596 M4 152H596" stroke="#52778a" strokeDasharray="4 6" />
        <path d={line} fill="none" stroke="#8bd9e9" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {points.map(({ x, y, time }) => <path key={time} d={`M${x},${y}h.01`} stroke="#baf4ff" strokeWidth="4"
          strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
      </svg>
      <div className="reach-chart-dates"><span>{date.format(start)}</span><span>{date.format(lastDay)}</span></div>
    </div>
    {points.length < (lastDay - start) / 86400000 + 1 && <p className="mt-2 text-sm text-slate-300">{gaps}</p>}
    <details className="mt-3"><summary>{daily} · {metric}</summary><dl>{series.map(({ day, pageViews }) =>
      <div className="flex justify-between gap-3" key={day}><dt><time dateTime={day}>{date.format(new Date(day))}</time></dt><dd>{number.format(pageViews)}</dd></div>)}</dl></details>
  </>;
}