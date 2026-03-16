import { extractArticle, segmentSentences } from "@/lib/extract";
import { filterSentences } from "@/lib/filter";
import { classifyStream } from "@/lib/classify";
import {
  acquireLock,
  getCached,
  isNegativelyCached,
  releaseLock,
  setCached,
  setNegativeCache,
} from "@/lib/cache";

export const runtime = "nodejs";

const POLL_INTERVAL_MS = 300;
const POLL_TIMEOUT_MS = 8_000;
const MAX_SENTENCES = 100;
const MIN_WORD_COUNT = 150;
const AVG_WORDS_PER_SENTENCE = 20;
const WPM = 238;

type CachedExtract = {
  title: string;
  signal_density: number;
  insights: string[];
  full_minutes: number;
  minutes_saved: number;
};

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getTTL(signalDensity: number): number {
  if (signalDensity >= 0.2) {
    return 86_400;
  }

  if (signalDensity >= 0.1) {
    return 21_600;
  }

  return 3_600;
}

function streamLine(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  payload: unknown,
): void {
  controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
}

async function pollCached(url: string): Promise<CachedExtract | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const cached = await getCached(url);

    if (cached) {
      return cached;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return null;
}

async function collectInsights(sentences: string[]): Promise<string[]> {
  const stream = classifyStream(sentences);
  let result = await stream.next();

  while (!result.done) {
    result = await stream.next();
  }

  return result.value;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body." }, 400);
  }

  const url = typeof body === "object" && body !== null ? (body as { url?: unknown }).url : null;

  if (typeof url !== "string" || !url.trim()) {
    return jsonResponse({ error: 'Request body must include a non-empty "url" string.' }, 400);
  }

  const normalizedUrl = url.trim();

  if (await isNegativelyCached(normalizedUrl)) {
    return jsonResponse({ error: "URL is negatively cached." }, 400);
  }

  const cached = await getCached(normalizedUrl);

  if (cached) {
    return jsonResponse({ type: "cached", ...cached });
  }

  const hasLock = await acquireLock(normalizedUrl);

  if (!hasLock) {
    const awaitedCached = await pollCached(normalizedUrl);

    if (awaitedCached) {
      return jsonResponse({ type: "cached", ...awaitedCached });
    }

    return jsonResponse({ error: "Timed out waiting for existing extraction." }, 409);
  }

  const cachedAfterLock = await getCached(normalizedUrl);

  if (cachedAfterLock) {
    await releaseLock(normalizedUrl);
    return jsonResponse({ type: "cached", ...cachedAfterLock });
  }

  let article: Awaited<ReturnType<typeof extractArticle>>;

  try {
    article = await extractArticle(normalizedUrl);
  } catch (error) {
    await setNegativeCache(normalizedUrl);
    await releaseLock(normalizedUrl);

    const message = error instanceof Error ? error.message : "Failed to extract article.";
    return jsonResponse({ error: message }, 400);
  }

  if (countWords(article.textContent) < MIN_WORD_COUNT) {
    await setNegativeCache(normalizedUrl);
    await releaseLock(normalizedUrl);
    return jsonResponse({ error: "Article content is too short to process." }, 400);
  }

  const filteredSentences = filterSentences(segmentSentences(article.textContent));
  const sentences = filteredSentences.slice(0, MAX_SENTENCES);
  const totalSentences = sentences.length;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        streamLine(controller, encoder, {
          type: "meta",
          title: article.title,
          total_sentences: totalSentences,
        });

        const insights = await collectInsights(sentences);

        for (const insight of insights) {
          streamLine(controller, encoder, { type: "insight", text: insight });
        }

        const rawSignalDensity =
          totalSentences === 0 ? 0 : insights.length / totalSentences;
        const signal_density = Math.round(rawSignalDensity * 100) / 100;
        const fullMinutes = parseFloat(
          ((totalSentences * AVG_WORDS_PER_SENTENCE) / WPM).toFixed(1),
        );
        const signalMinutes = parseFloat(
          ((insights.length * AVG_WORDS_PER_SENTENCE) / WPM).toFixed(1),
        );
        const minutesSaved = parseFloat(
          (fullMinutes - signalMinutes).toFixed(1),
        );

        await setCached(
          normalizedUrl,
          {
            title: article.title,
            signal_density,
            insights,
            full_minutes: fullMinutes,
            minutes_saved: minutesSaved,
          },
          getTTL(signal_density),
        );

        streamLine(controller, encoder, {
          type: "done",
          signal_density,
          full_minutes: fullMinutes,
          minutes_saved: minutesSaved,
        });
      } catch (error) {
        await setNegativeCache(normalizedUrl);

        const message =
          error instanceof Error ? error.message : "Pipeline execution failed.";

        streamLine(controller, encoder, { type: "error", message });
      } finally {
        await releaseLock(normalizedUrl);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
