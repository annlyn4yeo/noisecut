const MIN_WORDS = 6;
const MAX_WORDS = 60;
const BIGRAM_SIMILARITY_THRESHOLD = 0.7;
const CHARS_PER_TOKEN = 4;

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

function jaccardSimilarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) {
    return 1;
  }

  let intersectionSize = 0;

  left.forEach((item) => {
    if (right.has(item)) {
      intersectionSize += 1;
    }
  });

  const union = new Set<string>();

  left.forEach((item) => {
    union.add(item);
  });

  right.forEach((item) => {
    union.add(item);
  });

  const unionSize = union.size;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

export function filterSentences(sentences: string[]): string[] {
  const filtered: string[] = [];
  const seenBigrams: Set<string>[] = [];

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
    const isNearDuplicate = seenBigrams.some(
      (existingBigrams) =>
        jaccardSimilarity(existingBigrams, currentBigrams) > BIGRAM_SIMILARITY_THRESHOLD,
    );

    if (isNearDuplicate) {
      continue;
    }

    filtered.push(normalizedSentence);
    seenBigrams.push(currentBigrams);
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
