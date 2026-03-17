"use client";

import { memo, useCallback, useState } from "react";

type InsightCardProps = {
  text: string;
  index: number;
  shareId: string | null;
};

function InsightCardComponent({ text, index, shareId }: InsightCardProps) {
  const [shareLabel, setShareLabel] = useState("share ↗");

  const handleShare = useCallback(async () => {
    if (!shareId) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}/r/${shareId}`);
    setShareLabel("copied ✓");
    window.setTimeout(() => {
      setShareLabel("share ↗");
    }, 2000);
  }, [shareId]);

  return (
    <div
      className="group animate-insight-in flex gap-4 border-b border-[var(--divider)] py-5 opacity-0"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="min-w-[18px] pt-[2px] font-playfair text-[13px] italic tabular-nums text-[color:color-mix(in_srgb,var(--ink)_20%,transparent)]">
        {index + 1}
      </div>
      <div className="flex-1 font-playfair text-[16px] leading-relaxed text-[var(--ink)]">
        {text}
      </div>
      {shareId !== null ? (
        <button
          type="button"
          onClick={handleShare}
          className="self-start rounded-[3px] border border-[#c8d8ff] bg-[#f0f4ff] px-2 py-1 font-mono text-[10px] text-[#1660F5] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          {shareLabel}
        </button>
      ) : null}
    </div>
  );
}

export const InsightCard = memo(InsightCardComponent);
