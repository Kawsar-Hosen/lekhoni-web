// Lekhoni Kahini public API client (read-only; worker needs no change — CORS is open for public routes).
// Base: Cloudflare Worker. All fetches are cacheable (ISR revalidates).

export const API_BASE = 'https://lekhoni-admin-api.smdkawsar2.workers.dev';

export const REVALIDATE_HOME = 3600; // 1h
export const REVALIDATE_BOOK = 1800; // 30m
export const REVALIDATE_LIST = 3600;

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

export type ApiCategory = { id: string; name: string; icon: string; color: string; cover_url: string | null };

export type ApiWriter = {
  id: string;
  username: string;
  writer_name: string;
  bio?: string;
  avatar_url?: string | null;
  follower_count?: number;
  badge?: string;
};

export type HomeSections = {
  sections: { key: string; title: string; books: ApiBook[] }[];
  writers: ApiWriter[];
};

async function get<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const r = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
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

export const getBooks = () => get<ApiBook[]>('/api/public/books', REVALIDATE_LIST);
export const getChapters = () => get<ApiChapter[]>('/api/public/chapters', REVALIDATE_LIST);
export const getCategories = () => get<ApiCategory[]>('/api/public/categories', REVALIDATE_LIST);
export const getWriters = () => get<ApiWriter[]>('/api/public/writers', REVALIDATE_LIST);
export const getHomeSections = () => get<HomeSections>('/api/home-sections', REVALIDATE_HOME);

export async function getBook(id: string) {
  const b = await get<ApiBook & { chapters: ApiChapter[] }>(`/api/public/books/${id}`, REVALIDATE_BOOK);
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
  body: string
): Promise<{ ok: boolean; needsApproval?: boolean; error?: string }> {
  try {
    const r = await fetch(`${API_BASE}/api/public/books/${bookId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, name: name.slice(0, 50), body: body.slice(0, 1000) }),
    });
    const d = (await r.json().catch(() => null)) as { ok?: boolean; needs_approval?: boolean; error?: string } | null;
    if (!d) return { ok: false, error: "network" };
    return { ok: Boolean(d.ok), needsApproval: d.needs_approval, error: d.error };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function setLike(bookId: string, deviceId: string, value: boolean): Promise<number> {
  try {
    const r = await fetch(`${API_BASE}/api/public/books/${bookId}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, value }),
    });
    const d = (await r.json().catch(() => null)) as { likes?: number } | null;
    return typeof d?.likes === "number" ? d.likes : -1;
  } catch {
    return -1;
  }
}

export async function followWriter(deviceId: string, writerId: string): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/public/follows`, {
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
      `${API_BASE}/api/public/follows/${encodeURIComponent(writerId)}?device_id=${encodeURIComponent(deviceId)}`,
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
      res = await fetch(`${API_BASE}${path}`, { ...init, signal: c.signal });
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

export async function createStory(
  token: string,
  input: { title: string; description: string; category: string; cover_url?: string }
) {
  return callApi<{ id: string; title: string; status: string } & Record<string, unknown>>("/api/writer/stories", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title: input.title, description: input.description, category: input.category, cover_url: input.cover_url || null }),
  });
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
    const r = await fetch(`${API_BASE}/api/media`, { method: "POST", body: fd });
    const d = (await r.json().catch(() => null)) as { url?: string; key?: string; error?: string } | null;
    if (!r.ok || !d?.url) return { error: d?.error || `http-${r.status}` };
    return { url: d.url };
  } catch {
    return { error: "network" };
  }
}
