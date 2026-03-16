"use client";

import { ChangeEvent, FormEvent, memo, useEffect, useState } from "react";

const DEFAULT_HELPER_TEXT =
  "extracts only the highest-signal lines and caches the result.";

type HeroInputProps = {
  url: string;
  onSubmit: () => void;
  onUrlChange: (value: string) => void;
  loading: boolean;
  error: string;
  errorKey: number;
};

function HeroInputComponent({
  url,
  onSubmit,
  onUrlChange,
  loading,
  error,
  errorKey,
}: HeroInputProps) {
  const [helperText, setHelperText] = useState(DEFAULT_HELPER_TEXT);
  const [helperClassName, setHelperClassName] = useState("text-[#bbb]");
  const [helperAnimationClass, setHelperAnimationClass] = useState("");

  useEffect(() => {
    if (!error) {
      return;
    }

    setHelperAnimationClass("animate-helper-rotate-out");

    const showErrorTimeoutId = window.setTimeout(() => {
      setHelperText(error);
      setHelperClassName("text-signal");
      setHelperAnimationClass("animate-helper-rotate-in");
    }, 180);

    const hideErrorTimeoutId = window.setTimeout(() => {
      setHelperAnimationClass("animate-helper-rotate-out");
    }, 1180);

    const restoreHelperTimeoutId = window.setTimeout(() => {
      setHelperText(DEFAULT_HELPER_TEXT);
      setHelperClassName("text-[#bbb]");
      setHelperAnimationClass("animate-helper-rotate-in");
    }, 1360);

    const clearAnimationTimeoutId = window.setTimeout(() => {
      setHelperAnimationClass("");
    }, 1720);

    return () => {
      window.clearTimeout(showErrorTimeoutId);
      window.clearTimeout(hideErrorTimeoutId);
      window.clearTimeout(restoreHelperTimeoutId);
      window.clearTimeout(clearAnimationTimeoutId);
    };
  }, [error, errorKey]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onUrlChange(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="pt-10">
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
        <p
          className={[
            "mt-3 origin-center font-mono text-[11px] transition-colors duration-200",
            helperClassName,
            helperAnimationClass,
          ].join(" ")}
        >
          {helperText}
        </p>
      </form>
    </section>
  );
}

export const HeroInput = memo(HeroInputComponent);
