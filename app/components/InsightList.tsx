import { memo } from "react";

import { InsightCard } from "./InsightCard";

type InsightListProps = {
  insights: string[];
  title: string;
  density: number | null;
  minutesSaved: number | null;
  fullMinutes: number | null;
};

function InsightListComponent({
  insights,
  title,
  density,
  minutesSaved,
  fullMinutes,
}: InsightListProps) {
  return (
    <section
      className={[
        "pt-12 transition-opacity duration-500",
        insights.length > 0 ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="space-y-3">
        <h2 className="font-playfair text-[26px] italic leading-tight text-ink/50">
          {title}
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {minutesSaved !== null ? (
            <span className="font-mono text-[11px] text-[#aaa] transition-opacity duration-500">
              ~{fullMinutes} min read&nbsp;
              <span className="text-[#1660F5]">{minutesSaved} min saved</span>
            </span>
          ) : null}
          {density !== null ? (
            <div className="shrink-0 rounded-full bg-signal px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-opacity duration-500">
              {Math.round(density * 100)}% signal
            </div>
          ) : null}
        </div>
      </div>
      <hr className="mt-5 border-0 border-t-[1.5px] border-ink" />

      <div>
        {insights.map((insight, index) => (
          <InsightCard
            key={`${index}-${insight.slice(0, 24)}`}
            text={insight}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

export const InsightList = memo(InsightListComponent);
