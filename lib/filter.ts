const MIN_WORDS = 6;
const MAX_WORDS = 60;
const BIGRAM_SIMILARITY_THRESHOLD = 0.7;
const CHARS_PER_TOKEN = 4;
const WORD_COUNT_SIMILARITY_RATIO = 0.5;

function countWords(sentence: string): number {
  return sentence.trim().split(/\s+/).filter(Boolean).length;
}

function createCharacterBigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();

  if (normalized.length < 2) {
    return new Set(normalized ? [normalized] : []);
  }

  const bigrams = new Set<string>();

  for (let index = 0; index < normalized.length - 1; index += 1) {
    bigrams.add(normalized.slice(index, index + 2));
  }

  return bigrams;
}

function jaccardExceedsThreshold(
  left: Set<string>,
  right: Set<string>,
  threshold: number,
): boolean {
  if (left.size === 0 && right.size === 0) {
    return true;
  }

  const smaller = left.size <= right.size ? left : right;
  const larger = smaller === left ? right : left;
  const requiredIntersection =
    Math.floor((threshold * (left.size + right.size)) / (1 + threshold)) + 1;
  let processed = 0;
  let intersectionSize = 0;

  for (const item of smaller) {
    processed += 1;

    if (larger.has(item)) {
      intersectionSize += 1;

      if (intersectionSize >= requiredIntersection) {
        return true;
      }
    }

    const maxPossibleIntersection = intersectionSize + (smaller.size - processed);
    if (maxPossibleIntersection < requiredIntersection) {
      return false;
    }
  }

  return false;
}

function wordCountsTooDifferent(left: number, right: number): boolean {
  const larger = Math.max(left, right);
  const smaller = Math.min(left, right);

  return smaller / larger < WORD_COUNT_SIMILARITY_RATIO;
}

export function filterSentences(sentences: string[]): string[] {
  const filtered: string[] = [];
  const seenSentences: Array<{ wordCount: number; bigrams: Set<string> }> = [];

  for (const sentence of sentences) {
    const normalizedSentence = sentence.trim();

    if (!normalizedSentence) {
      continue;
    }

    const wordCount = countWords(normalizedSentence);

    if (wordCount < MIN_WORDS) {
      continue;
    }

    if (wordCount > MAX_WORDS) {
      continue;
    }

    if (normalizedSentence.endsWith("?")) {
      continue;
    }

    const currentBigrams = createCharacterBigrams(normalizedSentence);
    let isNearDuplicate = false;

    for (const existingSentence of seenSentences) {
      if (wordCountsTooDifferent(existingSentence.wordCount, wordCount)) {
        continue;
      }

      if (
        jaccardExceedsThreshold(
          existingSentence.bigrams,
          currentBigrams,
          BIGRAM_SIMILARITY_THRESHOLD,
        )
      ) {
        isNearDuplicate = true;
        break;
      }
    }

    if (isNearDuplicate) {
      continue;
    }

    filtered.push(normalizedSentence);
    seenSentences.push({ wordCount, bigrams: currentBigrams });
  }

  return filtered;
}

export function estimateTokens(sentences: string[]): number {
  const totalCharacters = sentences.reduce(
    (sum, sentence) => sum + sentence.trim().length,
    0,
  );

  return Math.ceil(totalCharacters / CHARS_PER_TOKEN);
}
