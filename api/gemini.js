/*
 * Best-effort in-memory rate limiter.
 * NOTE: Vercel functions are stateless across cold starts and may run on
 * multiple concurrent instances, so this bucket is per-warm-instance only.
 * It throttles burst abuse cheaply without external services; for a hard,
 * cross-instance guarantee migrate to @upstash/ratelimit (Vercel KV).
 */
const RATE_WINDOW_MS = Number(process.env.RATE_WINDOW_MS || 10800000); // 3 hours
const RATE_MAX = Number(process.env.RATE_MAX || 10); // 10 requests per window per IP, then resets
const rateBuckets = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  // Opportunistic prune of expired buckets to bound memory.
  if (rateBuckets.size > 5000) {
    for (const [key, b] of rateBuckets) {
      if (b.resetAt <= now) rateBuckets.delete(key);
    }
  }
  let bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  return {
    limited: bucket.count > RATE_MAX,
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000)
  };
}

export default async function handler(req, res) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://shabanahmad.github.io,https://shaban-ahmad-github-io.vercel.app")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.origin || "";
  const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const clientIp = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  const rate = checkRateLimit(clientIp);
  if (rate.limited) {
    res.setHeader("Retry-After", String(rate.retryAfter));
    return res.status(429).json({ error: "Too many requests. Please slow down and try again shortly." });
  }

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const apiKey = process.env.GEMINI_API_KEY;
  const maxPromptLength = Number(process.env.MAX_PROMPT_LENGTH || 8000);

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  if (prompt.length > maxPromptLength) {
    return res.status(413).json({ error: `Prompt is too long. Maximum length is ${maxPromptLength} characters.` });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing in Vercel environment variables." });
  }

  try {
    const fetchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200
        }
      })
    });

    const data = await fetchResponse.json();

    if (!fetchResponse.ok) {
      const message = data?.error?.message || "Gemini request failed.";
      return res.status(fetchResponse.status).json({ error: message, details: data });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(502).json({ error: "Gemini returned an unexpected response format.", details: data });
    }

    return res.status(200).json({ text, candidates: data.candidates });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error." });
  }
}
