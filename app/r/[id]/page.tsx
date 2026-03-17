import type { Metadata } from "next";
import Link from "next/link";

import { InsightCard } from "@/app/components/InsightCard";
import { NavBar } from "@/app/components/NavBar";
import { getByShareId } from "@/lib/cache";

type SharedPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({
  params,
}: SharedPageProps): Promise<Metadata> {
  const result = await getByShareId(params.id);

  if (!result) {
    return {
      title: "Signal Expired | NoiseCut",
      description: "This shared NoiseCut result has expired.",
    };
  }

  return {
    title: result.title,
    description: result.insights[0] ?? "Shared insights from NoiseCut.",
    openGraph: {
      title: result.title,
      description: result.insights[0] ?? "Shared insights from NoiseCut.",
    },
  };
}

export default async function SharedResultPage({ params }: SharedPageProps) {
  const result = await getByShareId(params.id);

  if (!result) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        <NavBar />
        <div className="mx-auto flex min-h-[70vh] max-w-[600px] items-center justify-center px-7">
          <div className="text-center">
            <h1 className="font-playfair text-[34px] italic text-[var(--ink)]">
              This signal has expired.
            </h1>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              results are cached for 24 hours
            </p>
            <Link
              href="/"
              className="mt-6 inline-block font-mono text-[12px] text-[var(--accent)]"
            >
              return to noisecut
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <NavBar />
      <div className="mx-auto max-w-[600px] px-7 pb-24">
        <section className="pt-16">
          <div className="space-y-3">
            <h1 className="font-playfair text-[26px] italic leading-tight text-[var(--ink-muted)]">
              {result.title}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                ~{result.full_minutes} min read&nbsp;
                <span className="text-[var(--accent)]">
                  {result.minutes_saved} min saved
                </span>
              </span>
              <div className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                {Math.round(result.signal_density * 100)}% signal
              </div>
            </div>
          </div>

          <hr className="mt-5 border-0 border-t-[1.5px] border-[var(--ink)]" />

          <div>
            {result.insights.map((insight, index) => (
              <InsightCard
                key={`${index}-${insight.slice(0, 24)}`}
                text={insight}
                index={index}
                shareId={null}
              />
            ))}
          </div>

          <p className="mt-12 font-mono text-[11px] text-[var(--ink-muted)]">
            extracted by noisecut{" "}
            <Link href="/" className="text-[var(--accent)]">
              /
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
