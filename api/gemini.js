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

/*
 * Model resolution.
 * Gemini models get retired or lose their free-tier quota over time, so a
 * single hardcoded model eventually returns HTTP 429 (limit: 0) or 404 for
 * everyone. Instead we try a preference list, but first intersect it with the
 * models this API key can actually call (discovered via ListModels), and fall
 * back through the list until one succeeds. Override the order/candidates with
 * the GEMINI_MODELS env var (comma-separated) without touching code.
 */
const PREFERRED_MODELS = (process.env.GEMINI_MODELS ||
  "gemini-2.5-flash,gemini-2.5-flash-lite,gemini-flash-latest,gemini-2.0-flash-lite,gemini-2.0-flash,gemini-1.5-flash-8b,gemini-1.5-flash")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Cache the discovered model list on the warm instance to avoid a ListModels
// call on every request.
let modelCache = { list: null, at: 0 };
const MODEL_CACHE_MS = 10 * 60 * 1000; // 10 minutes

async function discoverModels(apiKey) {
  const now = Date.now();
  if (modelCache.list && now - modelCache.at < MODEL_CACHE_MS) return modelCache.list;
  try {
    const r = await fetch(`${GEMINI_BASE}/models?key=${apiKey}&pageSize=1000`);
    if (!r.ok) return [];
    const j = await r.json();
    const list = (j.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map(m => (m.name || "").replace(/^models\//, ""))
      .filter(Boolean);
    modelCache = { list, at: now };
    return list;
  } catch {
    return [];
  }
}

// Ordered list of models to attempt: preferred ones the key exposes first, then
// any other lightweight text models the key exposes as a safety net.
function orderCandidates(available) {
  if (!available.length) return PREFERRED_MODELS.slice();
  const set = new Set(available);
  const ordered = PREFERRED_MODELS.filter(m => set.has(m));
  const extras = available
    .filter(m => !ordered.includes(m))
    .filter(m => /flash|lite/i.test(m) && !/vision|embedding|aqa|imagen|tts|image|audio/i.test(m));
  const candidates = [...ordered, ...extras];
  // If discovery matched nothing sensible, still try the raw preference list.
  return candidates.length ? candidates : PREFERRED_MODELS.slice();
}

async function callModel(model, prompt, apiKey) {
  const resp = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`, {
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
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
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
    return res.status(429).json({ error: "Too many requests. Please slow down and try again shortly.", scope: "local-limiter" });
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

  const candidates = orderCandidates(await discoverModels(apiKey));
  const tried = [];
  let lastErr = null;

  for (const model of candidates) {
    tried.push(model);
    let result;
    try {
      result = await callModel(model, prompt, apiKey);
    } catch (error) {
      lastErr = { status: 502, message: error.message || "Network error contacting Gemini." };
      continue; // transient/network -> try next model
    }

    const { ok, status, data } = result;
    if (ok) {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        res.setHeader("X-Gemini-Model", model);
        return res.status(200).json({ text, model, candidates: data.candidates });
      }
      lastErr = { status: 502, message: "Model returned an unexpected response format.", details: data };
      continue;
    }

    lastErr = { status, message: data?.error?.message || "Gemini request failed.", details: data };
    // Quota exhausted (429), model retired (404) or rejected (400) -> try the next model.
    if ([400, 404, 429].includes(status)) continue;
    // Auth/permission/server errors won't be fixed by another model -> stop.
    break;
  }

  const allQuota = lastErr && lastErr.status === 429;
  return res.status(lastErr?.status || 502).json({
    error: allQuota
      ? "Every available Gemini model is out of free-tier quota for this API key. Enable billing on the Google AI Studio project, swap in a different key, or set the GEMINI_MODELS env var to a model you have quota for."
      : (lastErr?.message || "Gemini request failed."),
    triedModels: tried,
    details: lastErr?.details
  });
}
