import { memo } from "react";

type InsightCardProps = {
  text: string;
  index: number;
};

function InsightCardComponent({ text, index }: InsightCardProps) {
  return (
    <div
      className="animate-insight-in flex gap-4 border-b border-faint py-5 opacity-0"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="min-w-[18px] pt-[2px] font-playfair text-[13px] italic tabular-nums text-ink/20">
        {index + 1}
      </div>
      <div className="font-playfair text-[16px] leading-relaxed text-ink">
        {text}
      </div>
    </div>
  );
}

export const InsightCard = memo(InsightCardComponent);
