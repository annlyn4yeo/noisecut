## NoiseCut

NoiseCut extracts the highest-signal insights from long-form articles. Paste a URL, and the app fetches the article, filters weak sentences, ranks the strongest ones with Gemini, and streams the result back to the UI.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- `@mozilla/readability`, `jsdom`, `compromise`
- Gemini via `@google/generative-ai`
- Upstash Redis for cache and locking

## How It Works

1. `POST /api/extract` receives a URL.
2. Redis handles cache hits, negative cache checks, and request locks.
3. The article is fetched, cleaned, segmented, and filtered.
4. Gemini selects the highest-signal sentences.
5. The API streams `meta`, `insight`, `done`, and `error` events to the UI.
