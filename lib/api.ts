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
