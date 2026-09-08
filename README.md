# Lekhoni Kahini — Website

Separate public website for Lekhoni Kahini (Bengali stories reading platform).
Independent codebase — the Android app (`/root/Lekhoni`) is never touched by this project.

## Stack
- Next.js 16 (App Router) + TypeScript + plain CSS (no Tailwind)
- Backend: existing production Cloudflare Worker API (no separate backend)
- Hosting target: Cloudflare Pages (deploy only on explicit approval)

## Backend
- Base URL: `https://lekhoni-admin-api.smdkawsar2.workers.dev` (see `lib/api.ts`)
- Public read endpoints only: books, chapters, categories, writers, home-sections,
  book detail, comments (read/post), likes, follows, deletion-requests
- No admin endpoints, no secrets. No `.env` values are required to run.

## Conventions
- Default UI language: English (`lib/i18n.tsx`, persisted `lk-lang`, no auto-detect)
- Theme: light / dark / system (`lib/theme.tsx`, persisted `lk-theme`)
- Guest device id: `lib/device.ts` (localStorage, sent as `device_key`)
- AdSense: `components/AdSlot.tsx` renders nothing (`ADS_ENABLED=false`).
  Enable only after explicit approval + AdSense approval.

## Commands
```bash
npm install
npm run dev      # local dev
npm run build    # production build check (required before any deploy)
```

## Deploy
DO NOT deploy until explicitly approved with "DEPLOY OK".
