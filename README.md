# Lekhoni Kahini — Website (`lekhoni-web`)

Public Bengali stories reading/writing platform. Live at **https://xyteee.com**.
Private GitHub repo: `Kawsar-Hosen/lekhoni-web` (branch `main`).

> Future AI: this file is your onboarding. Read it before changing anything.
> Rule #1: never commit, push, or deploy without the user's explicit approval.

## Stack
- **Next.js 16** (App Router) + TypeScript + plain CSS (`app/globals.css`, no Tailwind)
- React 19, `mqtt` (realtime quiz/draw via public EMQX broker)
- Hosting: **Vercel**, connected to GitHub → **push to `main` = auto-deploy**
- Local dev: `npm run dev` → http://localhost:3000

## Backend (Cloudflare Worker, separate repo `/root/LekhoniAdmin`)
- Base URL: `https://lekhoni-admin-api.smdkawsar2.workers.dev` (see `lib/api.ts` → `base()`)
- `next.config.ts` rewrites `/backend/:path*` → worker (same-origin proxy, avoids CORS)
- Auth: writer JWT (`Authorization: Bearer`), persisted session `lk-writer-session`
- Guest device id: `lib/device.ts` (localStorage, sent as `device_key`)
- Key endpoints: books, chapters, categories, writers, comments, likes, follows,
  referral, affiliate, **quiz** (`quiz/questions|submit|leaderboard`, submit = JWT-only),
  **writer notifications** (`/api/writer/notifications`, JWT-only)
- Book IDs: short 8-char `short_id` in URLs (`/book/abc123de`); backend also resolves
  legacy UUIDs. Always link with `bid(book)` from `lib/api.ts` (falls back to `id`).
- DB migrations run via worker endpoints (e.g. `/api/admin/migrate-shortid`) with
  `ADMIN_SECRET` Bearer — secret lives only in Cloudflare, never in code.
  NOTE: full `/api/admin/migrate` hits Cloudflare subrequest limits — use small
  single-purpose migrate endpoints instead.

## Environment (`.env.local`, never commit)
- `GEMINI_API_KEY` — server-side only, used by `app/api/ai/chat/route.ts`
- No `NEXT_PUBLIC_*` secrets. Never log keys, never put them in code.

## AI chat (`/ai`, `app/ai/AiFull.tsx`)
- Fullscreen, **no site header/footer** (`components/Chrome.tsx` hides chrome on `/ai*`)
- API: `app/api/ai/chat/route.ts` (Gemini). **Provider architecture**: to add a new
  API → write provider fn → register in `PROVIDERS` → add to `MODEL_REGISTRY`.
  Website context (catalogue, `SITE_FEATURES`, `HOWTO`, `OWNER`) injects centrally,
  so every model answers well. Failed models auto-fallback to the next.
- Typed errors (`AiError` in `lib/ai.ts`): `offline | slow | quota | overloaded | server`
  → user-facing `aiErr*` dict strings. 60s client timeout.
- Features: voice-to-voice mode (`VoiceMode.tsx`, Web Speech STT + TTS loop),
  typewriter placeholder, 3-dot menu (new/share/download/add-to-home/delete),
  Code Preview Box (`components/CodeBlock.tsx`: highlight + sandboxed HTML preview +
  line numbers + download + fullscreen), story cards (`[book:id]`/`[writer:id]` tokens),
  owner knowledge (Kawsar Hosen — reveal only when asked; never mention education).
- AI responses render via `renderAiMd` + `splitAiCode` (`components/RichText.tsx`).

## Quiz (`/gift/quiz`, hub `/gift`, draw `/draw`)
- **Login required** — no guests. Gate UI → `/login?next=/gift/quiz` (login/register/
  Google all honor `?next=` via `safeNext()` in `GoogleButton.tsx`).
- Submit sends writer JWT; correct = green + chime, wrong = red + buzz (Web Audio).
- Leaderboard tabs day/week/month/all; realtime refresh via MQTT topic
  `lekhoni/quiz/scores`; legacy `dev-*` rows filtered client-side too.
- Quiz bank lives in the worker (`QUIZ_BANK`); 10 questions per category.

## Conventions
- i18n: `lib/dict.ts` (keys typed as `DictKey`), default lang **bn**, persisted
  `lk-lang` cookie + localStorage, no auto-detect. Server: `getLang()`; client: `useLang()`.
- Theme: light default / dark / system (`lib/theme.tsx`, `lk-theme`). Maroon `#7B1E2B`,
  gold `#C9972B`. Fonts: Tiro Bangla + Hind Siliguri (BN), Inter + Fraunces (EN).
- Brand contacts: `lekhoni-kahini@xyteee.com`; owner: Kawsar Hosen, +8801703169708.
- AdSense: verification script only, `ADS_ENABLED=false`, no ad units; `public/app-ads.txt` is for AdMob.
- Animations: native CSS only, always respect `prefers-reduced-motion`.
- No emojis in code comments; minimal emojis in UI only where already used.

## Routes (all under `app/`)
`/` home (hero, NewBooks rail, writers, recent) · `/books` + filters ·
`/book/[id]` (centered hero, stats, chapters, comments) · `/read/[id]/[chapter]`
(immersive + fullscreen + TTS + autoscroll, saves `lk-read-{id}` progress) ·
`/search` · `/categories` · `/writers` · `/writer/[id]` (follow) ·
`/write` + `/stories/[id]/edit` (studio, drafts, 500-char minimums) ·
`/dashboard` (views/likes/balance/referral) · `/account` · `/login` · `/register`
(+ verify flow) · `/forgot` · `/ai` · `/gift` (letters) · `/gift/quiz` · `/draw` ·
`/affiliate` · `/notifications` (JWT bell page) · `/about` `/contact` `/privacy`
· `/delete-request` · SEO: sitemap/robots/OG (`/og.png`)/JSON-LD, auth pages noindex.

## Key files
- `app/layout.tsx` — fonts, theme/lang/auth providers, `Chrome`
- `components/`: `Header` (+`NotifBell`, search, share), `BottomNav`, `Footer`,
  `BookCard` (3D shelf), `ChapterRows` (read-state), `Comments`, `Engage`
  (Like/Follow), `TrackView`, `CodeBlock`, `Chrome`, `GiftIcon`, `ShareMenu`
- `lib/`: `api.ts` (all backend calls), `dict.ts`, `auth.tsx`, `ai.ts`,
  `device.ts`, `recent.ts`, `gift-templates.ts`
- `app/api/ai/chat/route.ts` — the AI backend (see section above)

## Verify before asking for deploy approval
```bash
npx tsc --noEmit && npm run lint && npm run build
```
Zero errors/warnings required. Test flows on localhost (dev server dies between
sessions — restart with `setsid nohup npm run dev > /tmp/dev.log 2>&1 < /dev/null & disown`).
Push `main` only after approval; confirm live with curl (`/` `/books` `/ai` → 200).
