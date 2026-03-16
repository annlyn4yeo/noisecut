"use client";

import { ChangeEvent, FormEvent, memo } from "react";

type HeroInputProps = {
  url: string;
  onSubmit: () => void;
  onUrlChange: (value: string) => void;
  loading: boolean;
  error: string;
};

function HeroInputComponent({
  url,
  onSubmit,
  onUrlChange,
  loading,
  error,
}: HeroInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onUrlChange(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="pt-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#aaa]">
        article intelligence
      </p>
      <h1 className="mb-12 mt-16 font-playfair text-[42px] leading-tight text-ink">
        Read less. <span className="italic text-signal">Know more.</span>
      </h1>
      <p className="max-w-[540px] font-sans text-[16px] font-light leading-8 text-[#888]">
        Paste a long article and extract only the sentences with signal:
        statistics, claims, insights, and facts worth keeping.
      </p>

      <form onSubmit={handleSubmit} className="pt-14">
        <div className="flex w-full overflow-hidden rounded-[4px] border border-ink/15 bg-white/40">
          <input
            type="url"
            value={url}
            onChange={handleChange}
            placeholder="paste an article url..."
            className="min-w-0 flex-1 bg-transparent px-5 py-4 font-mono text-[13px] text-ink outline-none placeholder:text-[#b7b0a6]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-signal px-6 py-4 font-sans text-[14px] font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-wait disabled:opacity-80"
          >
            Extract signal →
          </button>
        </div>
        <p className="mt-3 font-mono text-[11px] text-[#bbb]">
          extracts only the highest-signal lines and caches the result.
        </p>
        {error ? (
          <p className="mt-3 font-mono text-[12px] text-signal">{error}</p>
        ) : null}
      </form>
    </section>
  );
}

export const HeroInput = memo(HeroInputComponent);
