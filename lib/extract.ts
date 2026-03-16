import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import nlp from "compromise";

const REQUEST_TIMEOUT_MS = 5_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
const LEADING_TIMESTAMP_PATTERN =
  /^\s*(?:updated\s+)?(?:\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s+(?:minutes?|hours?|days?)\s+ago|[A-Z][a-z]+\s+\d{1,2},\s+\d{4})\s*/i;
const LEADING_BYLINE_PATTERN =
  /^\s*(?:by\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+(?:(?:senior|chief|deputy)\s+)?(?:correspondent|reporter|editor|writer|producer|analyst|columnist)\s*/i;
const LEADING_CREDIT_PATTERN =
  /^\s*(?:getty(?:\s+images)?|reuters|associated\s+press|ap|bbc(?:\s+news)?|image\s+source|image\s+caption)\s*/i;

function normalizeLeadingSpacing(text: string): string {
  const lead = text.slice(0, 400).replace(/([a-z])([A-Z])/g, "$1 $2");
  return `${lead}${text.slice(400)}`;
}

function isLikelySentenceStart(chunk: string): boolean {
  const wordCount = chunk.split(/\s+/).filter(Boolean).length;
  const verbCount = nlp(chunk).verbs().out("array").length;
  const endsLikeSentence = /[.?!]["']?$/.test(chunk);

  return wordCount >= 8 && (verbCount > 0 || endsLikeSentence);
}

function cleanLeadingMetadata(text: string): string {
  let normalizedText = normalizeLeadingSpacing(text.replace(/\r\n/g, "\n")).trim();

  if (!normalizedText) {
    return "";
  }

  let previousValue: string;

  do {
    previousValue = normalizedText;
    normalizedText = normalizedText.replace(LEADING_TIMESTAMP_PATTERN, "").trimStart();
    normalizedText = normalizedText.replace(LEADING_BYLINE_PATTERN, "").trimStart();
    normalizedText = normalizedText.replace(LEADING_CREDIT_PATTERN, "").trimStart();
  } while (normalizedText !== previousValue);

  const chunks = normalizedText
    .split(/\n+|(?<=[.?!]["']?)\s+/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const firstContentChunkIndex = chunks.findIndex((chunk) => isLikelySentenceStart(chunk));

  if (firstContentChunkIndex <= 0) {
    return normalizedText;
  }

  return chunks.slice(firstContentChunkIndex).join(" ").trim();
}

export async function extractArticle(url: string): Promise<{
  title: string;
  textContent: string;
  excerpt: string;
}> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Failed to extract article: invalid URL "${url}".`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let html: string;

  try {
    const response = await fetch(parsedUrl, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`received HTTP ${response.status} ${response.statusText}`);
    }

    html = await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Failed to fetch article from "${parsedUrl.toString()}": request timed out after ${REQUEST_TIMEOUT_MS}ms.`,
      );
    }

    const message = error instanceof Error ? error.message : "unknown fetch error";
    throw new Error(`Failed to fetch article from "${parsedUrl.toString()}": ${message}.`);
  } finally {
    clearTimeout(timeout);
  }

  try {
    const dom = new JSDOM(html, { url: parsedUrl.toString() });
    const article = new Readability(dom.window.document).parse();

    if (!article) {
      throw new Error("Readability could not identify a main article in the document");
    }

    if (!article.title?.trim() || !article.textContent?.trim()) {
      throw new Error("Readability returned incomplete article content");
    }

    return {
      title: article.title.trim(),
      textContent: cleanLeadingMetadata(article.textContent),
      excerpt: article.excerpt?.trim() ?? "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`Failed to parse article from "${parsedUrl.toString()}": ${message}.`);
  }
}

export function segmentSentences(text: string): string[] {
  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/([.?!]["'“”]?)(?=[A-Z0-9])/g, "$1 ")
    .trim();

  if (!normalizedText) {
    return [];
  }

  const chunks = normalizedText
    .split(/\n\s*\n/g)
    .flatMap((chunk) => chunk.split(/(?<=[.?!]["'“”]?)\s+/g))
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.flatMap((chunk) =>
    nlp(chunk)
      .sentences()
      .json()
      .map((sentence: { text?: string }) => sentence.text?.trim() ?? "")
      .filter(Boolean),
  );
}
