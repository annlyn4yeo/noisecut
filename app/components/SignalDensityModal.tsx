"use client";

import { memo, useEffect, useMemo } from "react";

type SignalDensityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalSentences: number;
  insightCount: number;
  signalPositions: number[];
};

type SampleBar = {
  index: number;
  isSignal: boolean;
  height: string;
};

function seededHeight(index: number, isSignal: boolean): string {
  const value = Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1;
  const min = isSignal ? 60 : 10;
  const max = isSignal ? 95 : 30;
  return `${min + value * (max - min)}%`;
}

function interpretSignal(signalPositions: number[], totalSentences: number) {
  if (totalSentences <= 0 || signalPositions.length === 0) {
    return {
      prefix: "",
      highlight: "signal is evenly distributed throughout",
      suffix: "",
    };
  }

  let firstThird = 0;
  let middleThird = 0;
  let lastThird = 0;

  signalPositions.forEach((position) => {
    const ratio = position / Math.max(totalSentences - 1, 1);

    if (ratio < 1 / 3) {
      firstThird += 1;
      return;
    }

    if (ratio < 2 / 3) {
      middleThird += 1;
      return;
    }

    lastThird += 1;
  });

  const maxCount = Math.max(firstThird, middleThird, lastThird);
  const winners = [firstThird, middleThird, lastThird].filter(
    (count) => count === maxCount,
  ).length;

  if (winners > 1) {
    return {
      prefix: "",
      highlight: "signal is evenly distributed throughout",
      suffix: "",
    };
  }

  if (firstThird === maxCount) {
    return {
      prefix: "",
      highlight: "signal is front-loaded",
      suffix: " — conclusion is mostly filler",
    };
  }

  if (middleThird === maxCount) {
    return {
      prefix: "",
      highlight: "signal peaks in the middle third",
      suffix: " — intro and conclusion are mostly filler",
    };
  }

  return {
    prefix: "",
    highlight: "signal is buried",
    suffix: " — article buries the lead",
  };
}

function buildBars(totalSentences: number, signalPositions: number[]): SampleBar[] {
  if (totalSentences <= 0) {
    return [];
  }

  const signalSet = new Set(
    signalPositions.filter(
      (position) => Number.isInteger(position) && position >= 0 && position < totalSentences,
    ),
  );
  const bars: SampleBar[] = [];

  for (let sentenceIndex = 0; sentenceIndex < totalSentences; sentenceIndex += 1) {
    const isSignal = signalSet.has(sentenceIndex);

    bars.push({
      index: sentenceIndex,
      isSignal,
      height: seededHeight(sentenceIndex, isSignal),
    });
  }

  return bars;
}

function SignalDensityModalComponent({
  isOpen,
  onClose,
  title,
  totalSentences,
  insightCount,
  signalPositions,
}: SignalDensityModalProps) {
  const bars = useMemo(
    () => buildBars(totalSentences, signalPositions),
    [signalPositions, totalSentences],
  );
  const interpretation = useMemo(
    () => interpretSignal(signalPositions, totalSentences),
    [signalPositions, totalSentences],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-6 opacity-100 animate-[insightFadeUp_300ms_ease_forwards]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] overflow-hidden rounded-lg border-[1.5px] border-[#1a1a1a] bg-white opacity-100 animate-[modalReveal_350ms_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative px-8 py-7">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#aaa]">
            signal density breakdown
          </p>
          <h2 className="mt-2 pr-12 font-playfair text-[20px] text-[#1a1a1a]">
            Where the <span className="italic text-[#1660F5]">signal</span> lives
            in this article
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-5 flex h-7 w-7 items-center justify-center rounded border border-[#ede9e1] font-mono text-[12px] text-[#888]"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 border-y border-[#ede9e1]">
          <div className="px-4 py-4 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#aaa]">
              total sentences
            </div>
            <div className="mt-2 font-playfair text-[20px] text-[#1a1a1a]">
              {totalSentences}
            </div>
          </div>
          <div className="border-x border-[#ede9e1] px-4 py-4 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#aaa]">
              signal found
            </div>
            <div className="mt-2 font-playfair text-[20px] italic text-[#1660F5]">
              {insightCount}
            </div>
          </div>
          <div className="px-4 py-4 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#aaa]">
              noise removed
            </div>
            <div className="mt-2 font-playfair text-[20px] text-[#1a1a1a]">
              {Math.max(totalSentences - insightCount, 0)}
            </div>
          </div>
        </div>

        <div className="border-b border-[#ede9e1] px-8 py-7">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#aaa]">
            article signal map
          </div>

          <div className="mt-4 flex h-[120px] items-end gap-[4px] rounded bg-[#f5f2ed] p-[8px]">
            {bars.map((bar, index) => (
              <div
                key={`${bar.index}-${index}`}
                className={[
                  "min-w-0 flex-1 origin-bottom rounded-[1px]",
                  bar.isSignal ? "bg-[#1660F5]" : "bg-[#e0dbd2]",
                  "animate-[barRise_300ms_ease_forwards]",
                ].join(" ")}
                style={{
                  height: bar.height,
                  transform: "scaleY(0)",
                  animationDelay: `${index * 20}ms`,
                }}
              />
            ))}
          </div>

          <div className="mt-3 flex justify-between font-mono text-[9px] text-[#bbb]">
            <span>intro</span>
            <span>middle</span>
            <span>end</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-[1px] bg-[#1660F5]" />
              <span className="font-mono text-[10px] text-[#888]">
                signal sentence
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-[1px] bg-[#e0dbd2]" />
              <span className="font-mono text-[10px] text-[#888]">
                noise removed
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-[#ede9e1] bg-[#faf8f4] px-[18px] py-3 font-mono text-[11px] text-[#888]">
          {interpretation.prefix}
          <span className="text-[#1660F5]">{interpretation.highlight}</span>
          {interpretation.suffix}
        </div>

        <div className="flex items-center justify-between px-8 py-[14px]">
          <div className="font-mono text-[10px] text-[#ccc]">esc to close</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] bg-[#1a1a1a] px-4 py-2 font-mono text-[11px] text-white"
          >
            done
          </button>
        </div>
      </div>
    </div>
  );
}

export const SignalDensityModal = memo(SignalDensityModalComponent);
