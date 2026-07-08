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
