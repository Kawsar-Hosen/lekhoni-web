"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import { fetchMyStories, fetchWriterDashboard, getBooks, submitStoryForReview, deleteStory, type ApiBook, type WriterDashboard, type WriterStory } from "@/lib/api";
import { fmtCount } from "@/components/BookCard";

export default function DashboardClient() {
  const { t } = useLang();
  const { session, ready } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<WriterStory[]>([]);
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [dash, setDash] = useState<WriterDashboard | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState("");
  const [deleting, setDeleting] = useState("");
  const [subMsg, setSubMsg] = useState("");

  const reload = () => {
    if (!session) return;
    Promise.all([fetchMyStories(session.token), fetchWriterDashboard(session.token)]).then(([st, db]) => {
      if (st.data) setStories(st.data);
      if (db.data && "stories" in db.data) setDash(db.data);
    });
  };

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    let on = true;
    Promise.all([fetchMyStories(session.token), fetchWriterDashboard(session.token), getBooks()]).then(([st, db, bk]) => {
      if (!on) return;
      if (st.data) setStories(st.data);
      if (db.data && "stories" in db.data) setDash(db.data);
      if (bk) setBooks(bk);
      setLoaded(true);
    });
    return () => {
      on = false;
    };
  }, [ready, session, router]);

  const doDelete = async (id: string, title: string) => {
    if (!session || deleting) return;
    if (!window.confirm(`${t("confirmDelete")}\n\n"${title}"`)) return;
    setDeleting(id);
    setSubMsg("");
    const r = await deleteStory(session.token, id);
    setDeleting("");
    if (r.data && "ok" in r.data) {
      setSubMsg(t("deletedMsg"));
      reload();
    } else {
      setSubMsg(t("authFailed"));
    }
  };
  const doSubmit = async (id: string) => {
    if (!session || submitting) return;
    setSubmitting(id);
    setSubMsg("");
    const r = await submitStoryForReview(session.token, id);
    setSubmitting("");
    if (r.data && "ok" in r.data) {
      setSubMsg(t("submittedMsg"));
      reload();
    } else {
      setSubMsg(t("authFailed"));
    }
  };
  const num = (v: unknown) => (typeof v === "number" ? v : parseInt(String(v ?? "0").replace(/[^0-9]/g, ""), 10) || 0);
  const bookStats = useMemo(() => {
    const m: Record<string, { views: number; likes: number }> = {};
    for (const b of books) {
      const key = (b.title || "").trim();
      if (!key || m[key]) continue;
      m[key] = { views: num(b.views), likes: num(b.likes) };
    }
    return m;
  }, [books]);

  const realViews = (s: WriterStory) => Math.max(num(s.views), bookStats[s.title.trim()]?.views ?? 0);
  const realLikes = (s: WriterStory) => Math.max(num(s.likes), bookStats[s.title.trim()]?.likes ?? 0);

  if (!ready || !session) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
        {t("loading")}
      </div>
    );
  }

  const storiesViews = stories.reduce((s, x) => s + realViews(x), 0);
  const storiesLikes = stories.reduce((s, x) => s + realLikes(x), 0);
  const views = Math.max(dash?.totalViews ?? 0, storiesViews);
  const likes = Math.max(dash?.totalLikes ?? 0, storiesLikes);
  const followers = Math.max(dash?.followers ?? 0, session.writer.follower_count ?? 0);
  const eligible = followers >= 500 && views >= 5000;
  const balance = Math.floor(views / 1000) * 100;
  const monthBal = Math.floor((dash?.monthViews ?? 0) / 1000) * 100;

  const stats = [
    { icon: "book" as const, n: dash?.stories ?? stories.length, l: t("publishedBooks") },
    { icon: "eye" as const, n: fmtCount(views), l: t("totalReads") },
    { icon: "heart" as const, n: fmtCount(likes), l: t("totalLikes") },
    { icon: "user" as const, n: fmtCount(followers), l: t("followers") },
  ];

  return (
    <>
      <div className="dash-head">
        <span className="dash-title-ic">
          <Icon name="edit" size={18} />
        </span>
        <h2>{t("dashboard")}</h2>
        <Link href="/write" className="btn btn-premium dash-new-btn">
          + {t("newStory")}
        </Link>
      </div>
      {!loaded ? (
        <div className="loading-wrap">
          <span className="spinner" />
          {t("loading")}
        </div>
      ) : (
        <>
          <div className="dash-bal">
            <div className="dash-bal-top">
              <span className="dash-bal-title">{t("estEarnings")}</span>
              <span className={eligible ? "dash-pill on" : "dash-pill off"}>
                {eligible ? t("activeBadge") : t("lockedBadge")}
              </span>
            </div>
            <div className="dash-bal-amt">৳{balance.toLocaleString("en-US")}</div>
            <div className="dash-bal-row">
              <div>
                <div className="dash-bal-l">{t("thisMonth")}</div>
                <div className="dash-bal-v">৳{monthBal.toLocaleString("en-US")}</div>
              </div>
              <div>
                <div className="dash-bal-l">{t("todayViews")}</div>
                <div className="dash-bal-v">{fmtCount(dash?.todayViews ?? 0)}</div>
              </div>
              <div>
                <div className="dash-bal-l">{t("weekViews")}</div>
                <div className="dash-bal-v">{fmtCount(dash?.weekViews ?? 0)}</div>
              </div>
              <div>
                <div className="dash-bal-l">{t("totalReads")}</div>
                <div className="dash-bal-v">{fmtCount(views)}</div>
              </div>
            </div>
            {!eligible && <p className="dash-unlock">{t("unlockMsg")}</p>}
          </div>
          <div className="dash-grid">
            {stats.map((s) => (
              <div key={s.l} className="card dash-card">
                <span className="dash-ic">
                  <Icon name={s.icon} size={18} />
                </span>
                <span>
                  <div className="dash-n">{s.n}</div>
                  <div className="dash-l">{s.l}</div>
                </span>
              </div>
            ))}
          </div>
          <div className="section-head" style={{ marginTop: 28 }}>
            <h2>
              {t("myStories")} ({stories.length})
            </h2>
            <Link href="/account">{t("account")} →</Link>
          </div>
          {subMsg && <p className="dash-msg">{subMsg}</p>}
          {stories.length ? (
            <div className="acct-stories">
              {stories.map((s) => (
                <div key={s.id} className="card acct-story">
                  {s.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.cover_url} alt={s.title} className="acct-cover" loading="lazy" />
                  ) : (
                    <div className="acct-cover acct-cover-fb">{s.title[0]?.toUpperCase()}</div>
                  )}
                  <div className="acct-story-info">
                    {s.status === "published" ? (
                      <Link href={`/book/${s.id}`} style={{ fontSize: 15, fontWeight: 800 }}>
                        {s.title}
                      </Link>
                    ) : (
                      <strong>{s.title}</strong>
                    )}
                    <span className="acct-story-meta">
                      <span className={`pill st-${s.status}`}>
                        {s.status === "pending" ? t("pendingLabel") : s.status}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Icon name="eye" size={12} /> {fmtCount(realViews(s))}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Icon name="heart" size={12} /> {fmtCount(realLikes(s))}
                      </span>
                      {s.status === "draft" && (
                        <button
                          className="mini-btn"
                          onClick={() => doSubmit(s.id)}
                          disabled={submitting === s.id}
                        >
                          {submitting === s.id ? t("loading") : t("submitReview")}
                        </button>
                      )}
                      <button
                        className="mini-btn danger"
                        onClick={() => doDelete(s.id, s.title)}
                        disabled={deleting === s.id}
                      >
                        {deleting === s.id ? t("loading") : t("deleteBtn")}
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">{t("noStories")}</div>
          )}
        </>
      )}
    </>
  );
}
