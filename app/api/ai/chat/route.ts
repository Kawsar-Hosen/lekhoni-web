const BASE = "https://codecraftapi.com/v1";
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
  const k = process.env.CODECRAFT_API_KEY || "";
  return k;
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
  const model = (body.model || "muse-spark-1.1").slice(0, 60);
  if (body.mode === "suggest") {
    // Cheap follow-up suggestion generation (short output, minimal context).
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
    const ctx =
      `User: ${(typeof lastUser?.content === "string" ? lastUser.content : "").slice(0, 500)}\n` +
      `Assistant: ${(typeof lastAi?.content === "string" ? lastAi.content : "").slice(0, 800)}`;
    try {
      const r = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${k}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
          {
            role: "system",
            content:
              "You generate follow-up suggestion buttons for a chat UI. RULES: Output EXACTLY 3 short questions a user might ask next. Each on its own line. No story, no explanation, no numbering, no bullets, no quotes. Each under 35 characters. Same language as the user message. Example input 'রোমান্টিক গল্প লিখে দাও' → output:\nপরের অধ্যায় লিখো\nচরিত্রগুলো বলো\nগল্পটা বড় করো",
          },
            { role: "user", content: ctx },
          ],
          max_tokens: 120,
        }),
      });
      const d = await r.json().catch(() => null);
      const raw: string = d?.choices?.[0]?.message?.content || "";
      const out = raw
        .split("\n")
        .map((s) => s.replace(/^[\d\-•*.)\s]+/, "").trim())
        .filter((s) => s.length > 1 && s.length < 80)
        .slice(0, 3);
      if (!out.length) return Response.json({ error: "empty" }, { status: 502 });
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
    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${k}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are Lekhoni AI, a helpful Bengali-first assistant for the Lekhoni Kahini reading/writing platform. Reply in the user's language (Bengali default). Keep answers clear and concise.\n" +
              catalogue +
              "\nRULES: When recommending a book, append its token on its own line like [book:ID]. When mentioning a writer, append [writer:ID]. Use only IDs from the catalogue above. Never invent IDs." +
              storyRules,
          },
          ...messages,
        ],
        max_tokens: 800,
      }),
    });
    const d = await r.json().catch(() => null);
    const text = d?.choices?.[0]?.message?.content?.trim();
    if (!r.ok || !text) return Response.json({ error: "AI failed" }, { status: 502 });
    return Response.json({ text });
  } catch {
    return Response.json({ error: "AI failed" }, { status: 502 });
  }
}

export async function GET() {
  const k = key();
  if (!k) return Response.json({ error: "AI not configured" }, { status: 500 });
  try {
    const r = await fetch(`${BASE}/models`, {
      headers: { Authorization: `Bearer ${k}` },
    });
    const d = await r.json().catch(() => null);
    const models: string[] = (d?.data || []).map((m: { id?: string }) => m.id).filter(Boolean);
    return Response.json({ models });
  } catch {
    return Response.json({ error: "AI failed" }, { status: 502 });
  }
}
