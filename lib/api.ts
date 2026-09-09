// Lekhoni Kahini public API client (read-only; worker needs no change — CORS is open for public routes).
// Base: Cloudflare Worker. All fetches are cacheable (ISR revalidates).

export const API_BASE = 'https://lekhoni-admin-api.smdkawsar2.workers.dev';

// Browser uses the same-origin /backend proxy (CORS-safe); server fetches direct.
const base = () => (typeof window === "undefined" ? API_BASE : "/backend");

export const REVALIDATE_HOME = 300; // 5m
export const REVALIDATE_BOOK = 120; // 2m — new chapters appear fast
export const REVALIDATE_LIST = 300;

export type ApiBook = {
  id: string;
  title: string;
  author: string;
  author_name?: string;
  cover_url: string | null;
  status: string;
  views: number | string;
  likes: number | string;
  description?: string;
  category?: string;
  color?: string;
  accent?: string;
  visible_on?: string;
  is_new?: boolean;
  featured?: boolean;
  pdf_url?: string;
  dedication?: string;
  updated_at?: string;
};

export type ApiChapter = {
  id: string;
  book_id: string;
  title: string;
  body: string;
  position: number;
  minutes?: number;
};

export type ApiCategory = { id: string; name: string; icon: string; color: string; cover_url: string | null; visible_on?: string };

export type ApiWriter = {
  id: string;
  username: string;
  writer_name: string;
  bio?: string;
  avatar_url?: string | null;
  follower_count?: number;
  badge?: string;
};

// Visibility: 'app' | 'website' | 'both'. Website shows website+both (app filters after its update).
export type VisibleOn = "app" | "website" | "both";
export const webVisible = <T extends { visible_on?: string }>(x: T) => (x.visible_on || "both") !== "app";

export type HomeSections = {
  sections: { key: string; title: string; books: ApiBook[] }[];
  writers: ApiWriter[];
};

async function get<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const r = await fetch(`${base()}${path}`, { next: { revalidate } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const displayAuthor = (b: Pick<ApiBook, 'author_name' | 'author'>) =>
  (b.author_name && b.author_name.trim()) || b.author || '';

export const bookViews = (b: Pick<ApiBook, 'views'>): number =>
  typeof b.views === 'number' ? b.views : parseInt(String(b.views).replace(/[^0-9]/g, ''), 10) || 0;

export const getBooks = async () => ((await get<ApiBook[]>('/api/public/books?scope=all', REVALIDATE_LIST)) || []).filter(webVisible);
export const getChapters = () => get<ApiChapter[]>('/api/public/chapters?scope=all', REVALIDATE_LIST);
export const getCategories = async () => ((await get<ApiCategory[]>('/api/public/categories?scope=all', REVALIDATE_LIST)) || []).filter(webVisible);
export const getWriters = () => get<ApiWriter[]>('/api/public/writers', REVALIDATE_LIST);
export const getHomeSections = () => get<HomeSections>('/api/home-sections?scope=all', REVALIDATE_HOME);

export async function getBook(id: string) {
  const b = await get<ApiBook & { chapters: ApiChapter[] }>(`/api/public/books/${id}?scope=all`, REVALIDATE_BOOK);
  if (!b) return null;
  const chs = [...(b.chapters || [])].sort((a, c) => a.position - c.position);
  return { ...b, chapters: chs };
}

export async function getWriter(id: string): Promise<ApiWriter | null> {
  if (!id) return null;
  return get<ApiWriter>(`/api/public/writers/${encodeURIComponent(id)}`, REVALIDATE_LIST);
}

export type ApiComment = {
  id: string;
  book_id: string;
  display_name: string;
  body: string;
  status: string;
  created_at: string;
};

export async function getComments(bookId: string): Promise<ApiComment[]> {
  return (await get<ApiComment[]>(`/api/public/books/${bookId}/comments`, 300)) || [];
}

export async function postComment(
  bookId: string,
  deviceId: string,
  name: string,
  body: string,
  avatarUrl?: string
): Promise<{ ok: boolean; needsApproval?: boolean; error?: string }> {
  try {
    const r = await fetch(`${base()}/api/public/books/${bookId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, name: name.slice(0, 50), body: body.slice(0, 1000), avatar_url: (avatarUrl || "").slice(0, 2048) }),
    });
    const d = (await r.json().catch(() => null)) as { ok?: boolean; needs_approval?: boolean; error?: string } | null;
    if (!d) return { ok: false, error: "network" };
    return { ok: Boolean(d.ok), needsApproval: d.needs_approval, error: d.error };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function updateComment(
  bookId: string,
  commentId: string,
  deviceId: string,
  body: string
): Promise<boolean> {
  try {
    const r = await fetch(`${base()}/api/public/books/${bookId}/comments/${commentId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, body: body.slice(0, 1000) }),
    });
    const d = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(d?.ok);
  } catch {
    return false;
  }
}

export async function trackView(bookId: string, deviceId: string): Promise<void> {
  try {
    await fetch(`${base()}/api/public/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, book_id: bookId, event_type: "view" }),
    });
  } catch {}
}

export async function deleteComment(bookId: string, commentId: string, deviceId: string): Promise<boolean> {
  try {
    const r = await fetch(`${base()}/api/public/books/${bookId}/comments/${commentId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_id: deviceId }),
    });
    const d = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(d?.ok);
  } catch {
    return false;
  }
}

export async function setLike(bookId: string, deviceId: string, value: boolean): Promise<number> {  try {
    const r = await fetch(`${base()}/api/public/books/${bookId}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, value }),
    });
    const d = (await r.json().catch(() => null)) as { likes?: number | string } | null;
    const n = typeof d?.likes === "number" ? d.likes : parseInt(String(d?.likes ?? ""), 10);
    return Number.isFinite(n) ? n : -1;
  } catch {
    return -1;
  }
}

export async function followWriter(deviceId: string, writerId: string): Promise<boolean> {
  try {
    const r = await fetch(`${base()}/api/public/follows`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, writer_id: writerId }),
    });
    const d = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(d?.ok);
  } catch {
    return false;
  }
}

export async function writerGoogleAuth(credential: string) {
  return callApi<{ writer: WriterSession; token: string } | { error: string }>(
    "/api/public/writers/google",
    { method: "POST", headers: jsonHeaders, body: JSON.stringify({ credential }) },
    15000
  );
}

export async function unfollowWriter(deviceId: string, writerId: string): Promise<boolean> {
  try {
    const r = await fetch(
      `${base()}/api/public/follows/${encodeURIComponent(writerId)}?device_id=${encodeURIComponent(deviceId)}`,
      { method: "DELETE" }
    );
    const d = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(d?.ok);
  } catch {
    return false;
  }
}

export function chaptersByBook(chapters: ApiChapter[]): Record<string, ApiChapter[]> {
  const m: Record<string, ApiChapter[]> = {};
  for (const c of chapters) (m[c.book_id] ||= []).push(c);
  for (const k of Object.keys(m)) m[k].sort((a, b) => a.position - b.position);
  return m;
}

// --- New books: published within the last 30 days (uses updated_at, the only
// book date the public API exposes). Books never disappear — they just leave
// this section; categories and other lists are unaffected.
const NEW_DAYS = 30;
export function isNewBook(b: Pick<ApiBook, "updated_at">, now: number = Date.now()): boolean {
  if (!b.updated_at) return false;
  const t = new Date(b.updated_at).getTime();
  if (Number.isNaN(t)) return false;
  const diff = now - t;
  return diff >= 0 && diff <= NEW_DAYS * 24 * 3600 * 1000;
}

// --- Popular: strictly more than 1,000 views (live data, automatic) ---
export const POPULAR_VIEWS = 1000;
export function isPopularBook(b: Pick<ApiBook, "views">): boolean {
  return bookViews(b) > POPULAR_VIEWS;
}

// --- Writer auth + studio (same contracts as the Android app) ---
export type WriterSession = {
  id: string;
  username: string;
  writer_name: string;
  bio?: string;
  avatar_url?: string | null;
  follower_count?: number;
  badge?: string;
};

type ApiResult<T> = { data: T | null; status: number; error?: string };

async function callApi<T>(path: string, init: RequestInit, timeoutMs = 25000): Promise<ApiResult<T>> {
  try {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${base()}${path}`, { ...init, signal: c.signal });
    } finally {
      clearTimeout(timer);
    }
    const body = (await res.json().catch(() => null)) as T & { error?: string };
    if (!res.ok) return { data: null, status: res.status, error: (body as { error?: string } | null)?.error || `http-${res.status}` };
    return { data: body as T, status: res.status };
  } catch {
    return { data: null, status: 0, error: "network" };
  }
}

const jsonHeaders = { "content-type": "application/json" };
const authHeaders = (token: string) => ({ ...jsonHeaders, Authorization: `Bearer ${token}` });

export type WriterAuthOk = { writer: WriterSession; token: string };
export type WriterAuthFail = { error: string };
type SignupRes = WriterAuthOk | { needs_verification: true; email: string; mail_sent?: boolean } | WriterAuthFail;
type VerifyRes = WriterAuthOk | WriterAuthFail;
type LoginRes = WriterAuthOk | { unverified: true; email: string } | WriterAuthFail;
type SimpleRes = { ok: boolean; mail_sent?: boolean; retry_after?: number } | WriterAuthFail;

export async function writerSignup(input: { username: string; writerName: string; email: string; password: string }): Promise<SignupRes | null> {
  const r = await callApi<SignupRes & { error?: string }>("/api/public/writers/signup", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ username: input.username, writer_name: input.writerName, email: input.email, password: input.password }),
  });
  return r.data;
}

export async function verifyWriterCode(email: string, code: string): Promise<VerifyRes | null> {
  const r = await callApi<VerifyRes & { error?: string }>(
    "/api/public/writers/verify-code",
    { method: "POST", headers: jsonHeaders, body: JSON.stringify({ email, code }) },
    15000
  );
  return r.data;
}

export async function resendWriterCode(email: string): Promise<SimpleRes | null> {
  const r = await callApi<SimpleRes & { error?: string; retry_after?: number }>(
    "/api/public/writers/resend-code",
    { method: "POST", headers: jsonHeaders, body: JSON.stringify({ email }) }
  );
  return r.data;
}

export async function writerLogin(
  emailOrUsername: string,
  password: string
): Promise<LoginRes | null> {
  const r = await callApi<LoginRes & { error?: string }>(
    "/api/public/writers/login",
    { method: "POST", headers: jsonHeaders, body: JSON.stringify({ email_or_username: emailOrUsername, password }) },
    15000
  );
  if (!r.data) return null;
  const d = r.data;
  if ("writer" in d) return d;
  if ("unverified" in d) return d;
  if ("error" in d && d.error) return { error: d.error };
  return null;
}

export async function verifyWriterToken(token: string) {
  return callApi<{ writer: WriterSession } | { error: string }>(
    "/api/public/writers/verify",
    { method: "POST", headers: jsonHeaders, body: JSON.stringify({ token }) },
    10000
  );
}

export type WriterStory = {
  id: string;
  title: string;
  description: string;
  status: string;
  cover_url: string | null;
  category: string;
  views: number;
  likes: number;
  chapters_count: number;
  created_at: string;
  updated_at: string;
};

export async function fetchMyStories(token: string) {
  return callApi<WriterStory[]>("/api/writer/stories", { headers: authHeaders(token) }, 15000);
}

export type WriterDashboard = {
  stories: number;
  totalViews: number;
  followers: number;
  published: number;
  pending: number;
  totalLikes?: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
};

export async function fetchWriterDashboard(token: string) {
  return callApi<WriterDashboard>("/api/writer/dashboard", { headers: authHeaders(token) }, 15000);
}

export async function submitStoryForReview(token: string, storyId: string) {
  return callApi<{ ok: boolean; status?: string } | { error: string }>(
    `/api/writer/stories/${storyId}/submit`,
    { method: "POST", headers: authHeaders(token) },
    15000
  );
}

export async function deleteStory(token: string, storyId: string) {
  return callApi<{ ok: boolean } | { error: string }>(
    `/api/writer/stories/${storyId}`,
    { method: "DELETE", headers: authHeaders(token) },
    15000
  );
}

export type StoryDetail = {
  id: string;
  title: string;
  description?: string;
  status: string;
  category?: string;
  cover_url?: string | null;
  chapters?: { id: string; title: string; body?: string; position: number }[];
};

export async function fetchStoryDetail(token: string, storyId: string) {
  return callApi<StoryDetail>(`/api/writer/stories/${storyId}`, { headers: authHeaders(token) }, 15000);
}

export async function updateStory(
  token: string,
  storyId: string,
  input: { title?: string; description?: string; category?: string; cover_url?: string; visible_on?: VisibleOn }
) {
  return callApi<{ ok: boolean } | { error: string }>(
    `/api/writer/stories/${storyId}`,
    { method: "PUT", headers: authHeaders(token), body: JSON.stringify({ ...input, hide_title_on_cover: true }) },
    15000
  );
}

export async function addStoryChapter(token: string, storyId: string, input: { title: string; body: string }) {
  return callApi<{ id: string } | { error: string }>(
    `/api/writer/stories/${storyId}/chapters`,
    { method: "POST", headers: authHeaders(token), body: JSON.stringify(input) },
    15000
  );
}

export async function updateWriterProfile(
  token: string,
  input: { writer_name?: string; username?: string; bio?: string; avatar_url?: string }
) {
  return callApi<{ ok: boolean } | { error: string }>(
    "/api/writer/profile",
    { method: "PUT", headers: authHeaders(token), body: JSON.stringify(input) },
    15000
  );
}

export async function createStory(
  token: string,
  input: { title: string; description: string; category: string; cover_url?: string; visible_on?: VisibleOn }
) {
  return callApi<{ id: string; title: string; status: string } & Record<string, unknown>>("/api/writer/stories", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title: input.title, description: input.description, category: input.category, cover_url: input.cover_url || null, visible_on: input.visible_on || "both", hide_title_on_cover: true }),
  });
}

export async function createCategory(token: string, name: string) {
  return callApi<{ id: string; name: string } | { error: string }>(
    "/api/writer/categories",
    { method: "POST", headers: authHeaders(token), body: JSON.stringify({ name }) },
    15000
  );
}

export async function createChapter(token: string, storyId: string, input: { title: string; body: string }) {
  return callApi<{ id: string; title: string } & Record<string, unknown>>(`/api/writer/stories/${storyId}/chapters`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title: input.title, body: input.body }),
  }, 15000);
}

export async function uploadCover(file: File): Promise<{ url?: string; error?: string }> {
  try {
    if (file.size > 10 * 1024 * 1024) return { error: "too-large" };
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${base()}/api/media`, { method: "POST", body: fd });
    const d = (await r.json().catch(() => null)) as { url?: string; key?: string; error?: string } | null;
    if (!r.ok || !d?.url) return { error: d?.error || `http-${r.status}` };
    return { url: d.url };
  } catch {
    return { error: "network" };
  }
}
