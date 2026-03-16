import { createHash } from "node:crypto";

import { Redis } from "@upstash/redis";

type CacheData = {
  title: string;
  signal_density: number;
  insights: string[];
  full_minutes: number;
  minutes_saved: number;
};

type NegativeCacheData = {
  error: true;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

if (!redisUrl || !redisToken) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set.",
  );
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

function cacheKey(url: string): string {
  return `cache:${hashUrl(url)}`;
}

function lockKey(url: string): string {
  return `lock:${hashUrl(url)}`;
}

function negativeCacheKey(url: string): string {
  return `neg:${hashUrl(url)}`;
}

export async function getCached(url: string): Promise<CacheData | null> {
  const cached = await redis.get<CacheData | NegativeCacheData>(cacheKey(url));

  if (
    !cached ||
    "error" in cached ||
    typeof cached.title !== "string" ||
    typeof cached.signal_density !== "number" ||
    !Array.isArray(cached.insights) ||
    typeof cached.full_minutes !== "number" ||
    typeof cached.minutes_saved !== "number"
  ) {
    return null;
  }

  return cached;
}

export async function setCached(
  url: string,
  data: CacheData,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(cacheKey(url), data, { ex: ttlSeconds });
}

export async function acquireLock(url: string): Promise<boolean> {
  const result = await redis.set(lockKey(url), "1", { nx: true, ex: 30 });
  return result === "OK";
}

export async function releaseLock(url: string): Promise<void> {
  await redis.del(lockKey(url));
}

export async function setNegativeCache(url: string): Promise<void> {
  await redis.set(negativeCacheKey(url), { error: true }, { ex: 300 });
}

export async function isNegativelyCached(url: string): Promise<boolean> {
  const cached = await redis.get<NegativeCacheData | null>(negativeCacheKey(url));
  return cached?.error === true;
}
