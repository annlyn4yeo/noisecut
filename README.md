## NoiseCut

NoiseCut extracts the highest-signal insights from long-form articles. Paste a URL, and the app fetches the article, filters weak sentences, ranks the strongest ones with Gemini, and streams the result.

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
4. Gemini selects the highest-signal sentences from the filtered set.
5. The API streams `meta`, `insight`, `done`, and `error` events to the client.
6. Completed results are cached with signal density, estimated reading-time savings, and a share ID.

## Shared Results

- Each completed extraction generates a short `shareId`.
- Results are stored in Redis under both the source URL hash and `share:{shareId}`.
- Shared result pages are served from `app/r/[id]/page.tsx`.
- If a shared result has expired, the shared route renders an expired-state page instead of failing.
