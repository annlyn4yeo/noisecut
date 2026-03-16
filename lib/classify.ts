import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = [
  "You are selecting the highest-signal sentences from an article.",
  "Return ONLY a JSON array of up to 10 sentence strings from the input.",
  "Choose sentences with factual data, statistics, novel insights, or actionable information.",
  "Do not include commentary, markdown, explanations, or any text outside the JSON array.",
].join(" ");

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  return new GoogleGenerativeAI(apiKey);
}

function buildPrompt(sentences: string[]): string {
  return ["Input sentences:", JSON.stringify(sentences)].join("\n");
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```[a-zA-Z0-9_-]*\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
}

function parseSentenceArray(rawText: string): string[] {
  const cleaned = stripCodeFences(rawText);
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");

  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
    throw new Error("Gemini response did not contain a JSON array.");
  }

  const jsonSlice = cleaned.slice(arrayStart, arrayEnd + 1);

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonSlice);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid JSON";
    throw new Error(`Failed to parse Gemini JSON response: ${message}.`);
  }

  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === "string")
  ) {
    throw new Error("Gemini response was not a JSON array of strings.");
  }

  return parsed.map((sentence) => sentence.trim()).filter(Boolean);
}

export async function classifySentences(
  sentences: string[],
): Promise<string[]> {
  const model = getGeminiClient().getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION,
  });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildPrompt(sentences) }] }],
  });

  return parseSentenceArray(result.response.text());
}

export async function* classifyStream(
  sentences: string[],
): AsyncGenerator<string, string[], void> {
  const model = getGeminiClient().getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION,
  });
  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: buildPrompt(sentences) }] }],
  });

  let fullText = "";

  for await (const chunk of result.stream) {
    const token = chunk.text();

    if (!token) {
      continue;
    }

    fullText += token;
    yield token;
  }

  return parseSentenceArray(fullText);
}
