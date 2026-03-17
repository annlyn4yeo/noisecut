"use client";

import { memo, useCallback, useState } from "react";

import { InsightCard } from "./InsightCard";

type InsightListProps = {
  insights: string[];
  title: string;
  density: number | null;
  minutesSaved: number | null;
  fullMinutes: number | null;
  shareId: string | null;
  done: boolean;
};

function InsightListComponent({
  insights,
  title,
  density,
  minutesSaved,
  fullMinutes,
  shareId,
  done,
}: InsightListProps) {
  const [copyLinkLabel, setCopyLinkLabel] = useState("share these insights");

  const handleCopyLink = useCallback(async () => {
    if (!shareId) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}/r/${shareId}`);
    setCopyLinkLabel("link copied ✓");
    window.setTimeout(() => {
      setCopyLinkLabel("share these insights");
    }, 2000);
  }, [shareId]);

  return (
    <section
      className={[
        "pt-12 transition-opacity duration-500",
        insights.length > 0 ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="space-y-3">
        <h2 className="font-playfair text-[26px] italic leading-tight text-[var(--ink-muted)]">
          {title}
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {minutesSaved !== null ? (
            <span className="font-mono text-[11px] text-[var(--ink-muted)] transition-opacity duration-500">
              ~{fullMinutes} min read&nbsp;
              <span className="text-[var(--accent)]">{minutesSaved} min saved</span>
            </span>
          ) : null}
          {density !== null ? (
            <div className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-opacity duration-500">
              {Math.round(density * 100)}% signal
            </div>
          ) : null}
        </div>
      </div>
      <hr className="mt-5 border-0 border-t-[1.5px] border-[var(--ink)]" />

      <div>
        {insights.map((insight, index) => (
          <InsightCard
            key={`${index}-${insight.slice(0, 24)}`}
            text={insight}
            index={index}
            shareId={shareId}
          />
        ))}
      </div>

      {shareId !== null && done === true ? (
        <div
          className="animate-insight-in mt-4 border-t border-[var(--divider)] pt-8 text-center opacity-0"
          style={{ animationDelay: "400ms" }}
        >
          <div className="font-playfair text-[20px] text-[var(--ink)]">
            {insights.length} <span className="italic text-[var(--accent)]">signals</span>{" "}
            from a {fullMinutes} min read
          </div>
          <div className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
            signal density {Math.round((density ?? 0) * 100)}%
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="mx-auto mt-4 flex items-center gap-2 rounded-[4px] bg-[var(--accent)] px-5 py-2.5 font-mono text-[12px] text-white"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.5 4.5h-2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 3.5h3.5V7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 3.5 7 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {copyLinkLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export const InsightList = memo(InsightListComponent);
