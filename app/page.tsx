"use client";

import { useCallback, useState } from "react";

import { HeroInput } from "./components/HeroInput";
import { InsightList } from "./components/InsightList";
import { NavBar } from "./components/NavBar";
import { Pipeline, type PipelineMeta } from "./components/Pipeline";

type StreamEvent =
  | { type: "meta"; title: string; total_sentences: number }
  | { type: "insight"; text: string }
  | {
      type: "done";
      signal_density: number;
      full_minutes: number;
      minutes_saved: number;
      share_id: string;
    }
  | {
      type: "cached";
      title: string;
      signal_density: number;
      insights: string[];
      full_minutes: number;
      minutes_saved: number;
      shareId: string;
    }
  | { type: "error"; message: string };

function PageShell() {
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [insights, setInsights] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [density, setDensity] = useState<number | null>(null);
  const [minutesSaved, setMinutesSaved] = useState<number | null>(null);
  const [fullMinutes, setFullMinutes] = useState<number | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pipelineMeta, setPipelineMeta] = useState<PipelineMeta>({});
  const [cachedHit, setCachedHit] = useState(false);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
  }, []);

  const reportError = useCallback((message: string) => {
    setError(message);
    setErrorKey((current) => current + 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    const normalizedUrl = url.trim();

    if (!normalizedUrl) {
      reportError("Enter a valid article URL.");
      return;
    }

    const submitStartedAt = Date.now();
    let firstInsightSeen = false;
    let totalSentences = 0;
    let filteredCount = 0;

    setError("");
    setTitle("");
    setInsights([]);
    setDensity(null);
    setMinutesSaved(null);
    setFullMinutes(null);
    setShareId(null);
    setCachedHit(false);
    setLoading(true);
    setStage(1);
    setPipelineMeta({});

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok && !contentType.includes("application/x-ndjson")) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Request failed.");
      }

      if (!contentType.includes("application/x-ndjson")) {
        const payload = (await response.json()) as StreamEvent;

        if (payload.type === "cached") {
          setTitle(payload.title);
          setInsights(payload.insights);
          setDensity(payload.signal_density);
          setMinutesSaved(payload.minutes_saved);
          setFullMinutes(payload.full_minutes);
          setShareId(payload.shareId);
          setCachedHit(true);
          setStage(5);
          return;
        }

        if (payload.type === "error") {
          throw new Error(payload.message);
        }

        throw new Error("Unexpected response from server.");
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Response stream is unavailable.");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      const handlePayload = (payload: StreamEvent) => {
        if (payload.type === "meta") {
          const elapsedMs = Date.now() - submitStartedAt;
          totalSentences = payload.total_sentences;
          filteredCount = payload.total_sentences;

          setStage(2);
          setTitle(payload.title);
          setPipelineMeta({
            ms: elapsedMs,
            sentences: totalSentences,
            filtered: totalSentences - Math.max(totalSentences - filteredCount, 0),
          });
          setStage(3);
          return;
        }

        if (payload.type === "insight") {
          if (!firstInsightSeen) {
            firstInsightSeen = true;
            setStage(4);
          }

          setInsights((previous) => [...previous, payload.text]);
          return;
        }

        if (payload.type === "done") {
          setDensity(payload.signal_density);
          setMinutesSaved(payload.minutes_saved);
          setFullMinutes(payload.full_minutes);
          setShareId(payload.share_id);
          setStage(5);
          return;
        }

        if (payload.type === "error") {
          throw new Error(payload.message);
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (!trimmedLine) {
            continue;
          }

          handlePayload(JSON.parse(trimmedLine) as StreamEvent);
        }
      }

      const finalLine = buffer.trim();

      if (finalLine) {
        handlePayload(JSON.parse(finalLine) as StreamEvent);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Something went wrong.";

      reportError(message);
      setStage(0);
      setCachedHit(false);
    } finally {
      setLoading(false);
    }
  }, [reportError, url]);

  const showPipeline = !cachedHit && stage > 0;
  const showResults = cachedHit || insights.length > 0 || density !== null;
  const showGhostInsight = loading && !cachedHit && stage >= 4 && density === null;

  return (
    <div className="mx-auto max-w-[600px] px-7 pb-24">
      <section className="mb-16 mt-20">
        <HeroInput
          url={url}
          onSubmit={handleSubmit}
          onUrlChange={handleUrlChange}
          loading={loading}
          error={error}
          errorKey={errorKey}
        />
      </section>

      <div className="space-y-10">
        {showPipeline ? (
          <section>
            <hr className="my-12 border-0 border-t-2 border-[var(--divider)]" />
            <Pipeline stage={stage} meta={pipelineMeta} />
          </section>
        ) : null}

        {showResults ? (
          <section>
            <InsightList
              insights={insights}
              title={title}
              density={density}
              minutesSaved={minutesSaved}
              fullMinutes={fullMinutes}
              shareId={shareId}
              done={stage === 5}
            />

            {showGhostInsight ? (
              <div className="flex gap-4 border-b border-[var(--divider)] py-5">
                <div className="min-w-[18px] pt-[2px] font-playfair text-[13px] italic text-[color:color-mix(in_srgb,var(--ink)_20%,transparent)]">
                  {insights.length + 1}
                </div>
                <div className="font-mono text-[12px] italic text-[var(--ink-muted)]">
                  reading...
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <NavBar />
      <PageShell />
    </main>
  );
}
