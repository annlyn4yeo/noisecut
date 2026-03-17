import { memo } from "react";

export type PipelineMeta = {
  sentences?: number;
  filtered?: number;
  ms?: number;
};

type PipelineProps = {
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  meta: PipelineMeta;
};

const STEP_LABELS = [
  "fetching article",
  "segmenting sentences",
  "filtering noise",
  "extracting signal",
  "complete",
] as const;

function CheckIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] transition-opacity duration-300">
      <svg
        className="h-3 w-3 text-white"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ActiveIcon() {
  return (
    <span className="h-5 w-5 rounded-full border-2 border-[var(--divider)] border-t-[var(--accent)] animate-spin" />
  );
}

function IdleIcon() {
  return <span className="h-5 w-5 rounded-full border border-[var(--divider)]" />;
}

function formatMeta(index: number, meta: PipelineMeta, stage: number): string {
  if (index === 0 && meta.ms !== undefined) {
    return `${meta.ms}ms`;
  }

  if (index === 1 && meta.sentences !== undefined) {
    return `${meta.sentences} sentences`;
  }

  if (index === 2 && meta.filtered !== undefined) {
    return `${meta.filtered} kept`;
  }

  if (index === 3 && meta.filtered !== undefined && stage >= 3) {
    return stage === 5 ? "scored" : `${meta.filtered} candidates`;
  }

  if (index === 4 && stage === 5) {
    return "ready";
  }

  return "";
}

function getStepState(index: number, stage: number): "idle" | "active" | "done" {
  if (stage === 5) {
    return "done";
  }

  const activeIndex =
    stage <= 1 ? 0 : stage === 2 ? 1 : stage === 3 ? 2 : stage === 4 ? 3 : 0;

  if (index < activeIndex) {
    return "done";
  }

  if (index === activeIndex) {
    return "active";
  }

  return "idle";
}

function PipelineComponent({ stage, meta }: PipelineProps) {
  return (
    <section
      className={[
        "transition-opacity duration-500",
        stage > 0 ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {STEP_LABELS.map((label, index) => {
        const state = getStepState(index, stage);

        return (
          <div
            key={label}
            className="flex items-center gap-4 border-b border-[var(--divider)] py-4"
          >
            {state === "done" ? <CheckIcon /> : state === "active" ? <ActiveIcon /> : <IdleIcon />}
            <span
              className={[
                "font-mono text-[13px] transition-all duration-300",
                state === "done"
                  ? "text-[var(--ink-muted)] line-through"
                  : state === "active"
                    ? "font-medium text-[var(--ink)]"
                    : "text-[var(--ink-muted)]",
              ].join(" ")}
            >
              {label}
            </span>
            <span className="ml-auto font-mono text-[11px] text-[var(--ink-muted)]">
              {formatMeta(index, meta, stage)}
            </span>
          </div>
        );
      })}
    </section>
  );
}

export const Pipeline = memo(
  PipelineComponent,
  (prevProps, nextProps) => prevProps.stage === nextProps.stage,
);
