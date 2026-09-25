const GEMINI = "https://generativelanguage.googleapis.com/v1beta";

// Curated working models only (verified live).
const ALLOWED_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3-flash-preview",
];
const DEFAULT_MODEL = "gemini-3.5-flash";

const pickModel = (m: string) => (ALLOWED_MODELS.includes(m) ? m : DEFAULT_MODEL);
const API = "https://lekhoni-admin-api.smdkawsar2.workers.dev";

async function buildCatalogue(): Promise<string> {
  try {
    const [b, w] = await Promise.all([
      fetch(`${API}/api/public/books?scope=all`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/api/public/writers`).then((r) => (r.ok ? r.json() : [])),
    ]);
    const books = (Array.isArray(b) ? b : []).slice(0, 80).map((x: Record<string, unknown>) =>
      `- "${x.title}" by ${x.author_name || x.author} [${x.category || "?"}] id=${x.id}`
    );
    const writers = (Array.isArray(w) ? w : []).slice(0, 60).map((x: Record<string, unknown>) =>
      `- ${x.writer_name} (@${x.username}) id=${x.id}`
    );
    return (
      "LIVE CATALOGUE of Lekhoni Kahini website (use exact titles/names):\nBOOKS:\n" +
      books.join("\n") +
      "\nWRITERS:\n" +
      writers.join("\n") +
      "\nPAGES: Home(/) Books(/books) Writers(/writers) Categories(/categories) Search(/search) Write(/write) Account(/account) Dashboard(/dashboard) About(/about) Contact(/contact) Privacy(/privacy)."
    );
  } catch {
    return "Lekhoni Kahini: Bengali stories website with books, writers, categories, search, writing studio, accounts, dashboard.";
  }
}

function key() {
  return process.env.GEMINI_API_KEY || "";
}

type GPart = { text?: string; inlineData?: { mimeType: string; data: string } };
type GMsg = { role: string; parts: GPart[] };

function toGemini(
  messages: { role: string; content: string | unknown[]; image?: string }[],
  system: string
): { system_instruction: { parts: GPart[] }; contents: GMsg[] } {
  const contents: GMsg[] = [];
  for (const m of messages.slice(-20)) {
    const role = m.role === "user" ? "user" : "model";
    if (Array.isArray(m.content)) {
      const parts: GPart[] = [];
      for (const p of (m.content as unknown[]).slice(0, 4)) {
        const part = p as { type?: string; text?: string; image_url?: { url?: string } };
        if (part?.type === "text" && part.text) parts.push({ text: String(part.text).slice(0, 6000) });
        else if (part?.image_url?.url) {
          const mm = String(part.image_url.url).match(/^data:(image\/[a-z+]+);base64,(.+)$/);
          if (mm) parts.push({ inlineData: { mimeType: mm[1], data: mm[2].slice(0, 1500000) } });
        }
      }
      if (parts.length) contents.push({ role, parts });
      continue;
    }
    const text = typeof m.content === "string" ? m.content.slice(0, 6000) : "";
    if (role === "user" && m.image && typeof m.image === "string" && m.image.startsWith("data:image/")) {
      const mm = m.image.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
      contents.push({
        role,
        parts: [
          { text: text || "Describe this image in detail." },
          ...(mm ? [{ inlineData: { mimeType: mm[1], data: mm[2].slice(0, 1500000) } }] : []),
        ],
      });
      continue;
    }
    if (text) contents.push({ role, parts: [{ text }] });
  }
  return { system_instruction: { parts: [{ text: system }] }, contents };
}

async function gemini(model: string, system: string, contents: GMsg[], maxTokens: number) {
  const k = key();
  const r = await fetch(
    `${GEMINI}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(k)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
      }),
    }
  );
  const d = await r.json().catch(() => null);
  const text = d?.candidates?.[0]?.content?.parts
    ?.map((p: GPart) => p.text || "")
    .join("")
    .trim();
  return { ok: r.ok, text, raw: d };
}

export async function POST(req: Request) {
  const k = key();
  if (!k) return Response.json({ error: "AI not configured" }, { status: 500 });
  let body: { messages?: { role: string; content: string | unknown[]; image?: string }[]; model?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const messages = (body.messages || []).slice(-20).map((m) => {
    if (Array.isArray(m.content)) {
      return { role: m.role === "user" ? "user" : "assistant", content: m.content.slice(0, 4) };
    }
    const text = typeof m.content === "string" ? m.content.slice(0, 6000) : "";
    if (m.role === "user" && m.image && typeof m.image === "string" && m.image.startsWith("data:image/")) {
      return {
        role: "user",
        content: [
          { type: "text", text: text || "Describe this image in detail." },
          { type: "image_url", image_url: { url: m.image.slice(0, 1500000) } },
        ],
      };
    }
    return { role: m.role === "user" ? "user" : "assistant", content: text };
  });
  if (!messages.length) return Response.json({ error: "Empty" }, { status: 400 });
  const model = pickModel((body.model || "").slice(0, 80));
  if (body.mode === "suggest") {
    // Cheap follow-up suggestion generation (short output, minimal context).
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
    const ctx =
      `User: ${(typeof lastUser?.content === "string" ? lastUser.content : "").slice(0, 500)}\n` +
      `Assistant: ${(typeof lastAi?.content === "string" ? lastAi.content : "").slice(0, 800)}`;
    try {
      const g = await gemini(
        model,
        "You output EXACTLY 3 follow-up suggestion buttons, nothing else. RULES: 3 separate lines, one suggestion per line. Never output fewer than 3 lines. No story, no explanation, no numbering, no bullets, no quotes. Each line under 35 characters. Same language as the user message. Example (3 lines):\nপরের অধ্যায় লিখো\nচরিত্রগুলো বলো\nগল্পটা বড় করো",
        [{ role: "user", parts: [{ text: ctx }] }],
        150
      );
      const raw: string = g.text || "";
      const out = raw
        .split("\n")
        .map((s) => s.replace(/^[\d\-•*.)\s]+/, "").trim())
        .filter((s) => s.length > 1 && s.length < 80)
        .slice(0, 3);
      if (!g.ok || !out.length) return Response.json({ error: "empty" }, { status: 502 });
      return Response.json({ suggestions: out });
    } catch {
      return Response.json({ error: "AI failed" }, { status: 502 });
    }
  }
  const catalogue = await buildCatalogue();
  const lastUserText =
    [...messages].reverse().find((m) => m.role === "user" && typeof m.content === "string")
      ?.content || "";
  const isStoryReq =
    /গল্প|উপন্যাস|কাহিনি|story|stories|novel|কবিতা|poem|ছড়া|নাটক/i.test(
      typeof lastUserText === "string" ? lastUserText : ""
    );
  const storyRules = isStoryReq
    ? "\nSTORY MODE (user wants creative writing): Write a COMPLETELY ORIGINAL story — never copy any existing story, article, novel, blog or Wikipedia text. If the request involves real history/places/people, use your knowledge for context but invent original characters and events; add one line at the end if fictionalized: state it's a fictional story inspired by history. Format: start with '# <original title>' on its own line, then story paragraphs (blank line between). Use **bold** sparingly, '— ' for dialogue lines. For long/novel requests use '## অধ্যায় ১', '## অধ্যায় ২' headings. If too long, end with a brief note that the next chapter can continue. Honor style words (ছোট/বড়/রোমান্টিক/ভৌতিক/রহস্য/ইসলামিক/ঐতিহাসিক/সংলাপ বেশি/twist etc.). If user asks to edit/continue a previous story in this conversation, modify THAT story, don't start unrelated."
    : "";
  try {
    const sys =
      "You are Lekhoni AI, a helpful Bengali-first assistant for the Lekhoni Kahini reading/writing platform. Reply in the user's language (Bengali default). Keep answers clear and concise.\n" +
      catalogue +
      "\nRULES: When recommending a book, append its token on its own line like [book:ID]. When mentioning a writer, append [writer:ID]. Use only IDs from the catalogue above. Never invent IDs." +
      storyRules;
    const g = await gemini(model, sys, toGemini(messages, "").contents, 900);
    if (!g.ok || !g.text) return Response.json({ error: "AI failed" }, { status: 502 });
    return Response.json({ text: g.text });
  } catch {
    return Response.json({ error: "AI failed" }, { status: 502 });
  }
}

export async function GET() {
  const k = key();
  if (!k) return Response.json({ error: "AI not configured" }, { status: 500 });
  try {
    const r = await fetch(
      `${GEMINI}/models?key=${encodeURIComponent(k)}&pageSize=50`
    );
    const d = await r.json().catch(() => null);
    return Response.json({ models: ALLOWED_MODELS });
  } catch {
    return Response.json({ error: "AI failed" }, { status: 502 });
  }
}
