"use client";

import { useEffect, useState } from "react";
import { getComments, postComment, updateComment, deleteComment, type ApiComment } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import Icon from "@/components/Icon";

const MINE_KEY = "lk-my-comments";
type MineSig = { bookId: string; name: string; body: string };

function loadMine(): MineSig[] {
  try {
    return JSON.parse(window.localStorage.getItem(MINE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Comments({ bookId }: { bookId: string }) {
  const { t, lang } = useLang();
  const { session } = useAuth();
  const [items, setItems] = useState<ApiComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [mine, setMine] = useState<MineSig[]>(() =>
    typeof window === "undefined" ? [] : loadMine()
  );
  const [menuId, setMenuId] = useState("");
  const [editId, setEditId] = useState("");
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    let on = true;
    getComments(bookId).then((c) => {
      if (on) setItems(c);
    });
    return () => {
      on = false;
    };
  }, [bookId]);

  const isMine = (c: ApiComment) =>
    mine.some((m) => m.bookId === bookId && m.name === c.display_name && m.body === c.body);

  const remember = (sig: MineSig) => {
    const next = [...loadMine(), sig].slice(-60);
    try {
      window.localStorage.setItem(MINE_KEY, JSON.stringify(next));
    } catch {}
    setMine(next);
  };

  const forget = (c: ApiComment) => {
    const next = loadMine().filter((m) => !(m.bookId === bookId && m.name === c.display_name && m.body === c.body));
    try {
      window.localStorage.setItem(MINE_KEY, JSON.stringify(next));
    } catch {}
    setMine(next);
  };

  useEffect(() => {
    let on = true;
    getComments(bookId).then((c) => {
      if (on) setItems(c);
    });
    return () => {
      on = false;
    };
  }, [bookId]);

  const submit = async () => {
    const useName = session ? session.writer.writer_name : name.trim();
    const useAvatar = session?.writer.avatar_url || undefined;
    if (!useName || !body.trim() || busy) return;
    if (mine.some((m) => m.bookId === bookId)) {
      setMsg(t("alreadyCommented"));
      return;
    }
    setBusy(true);
    setMsg("");
    const r = await postComment(bookId, getDeviceId(), useName, body.trim(), useAvatar);
    setBusy(false);
    if (r.ok) {
      setBody("");
      setMsg(t("commentPending"));
      remember({ bookId, name: useName, body: body.trim() });
      getComments(bookId).then(setItems);
    } else if (r.error === "already_commented") {
      remember({ bookId, name: useName, body: body.trim() });
      setMsg(t("alreadyCommented"));
    } else {
      setMsg(t("commentFailed"));
    }
  };

  const alreadyDone = mine.some((m) => m.bookId === bookId);

  const startEdit = (c: ApiComment) => {
    setEditId(c.id);
    setEditBody(c.body);
    setMenuId("");
  };

  const saveEdit = async (c: ApiComment) => {
    if (!editBody.trim() || busy) return;
    setBusy(true);
    const ok = await updateComment(bookId, c.id, getDeviceId(), editBody.trim());
    setBusy(false);
    if (ok) {
      forget(c);
      remember({ bookId, name: c.display_name, body: editBody.trim() });
      setEditId("");
      setMsg(t("commentUpdated"));
      getComments(bookId).then(setItems);
    } else {
      setMsg(t("commentFailed"));
    }
  };

  const doDelete = async (c: ApiComment) => {
    if (busy) return;
    if (!window.confirm(`${t("confirmDelete")}`)) return;
    setBusy(true);
    const ok = await deleteComment(bookId, c.id, getDeviceId());
    setBusy(false);
    setMenuId("");
    if (ok) {
      forget(c);
      setItems((prev) => prev.filter((x) => x.id !== c.id));
    } else {
      setMsg(t("commentFailed"));
    }
  };

  return (
    <section className="section" id="comments">
      <div className="section-head">
        <h2>
          {t("comments")} ({items.length})
        </h2>
      </div>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        {session ? (
          <div className="cmt-as">
            {session.writer.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.writer.avatar_url} alt="" className="cmt-ava" style={{ objectFit: "cover", padding: 0 }} />
            ) : (
              <span className="cmt-ava">{session.writer.writer_name[0]?.toUpperCase()}</span>
            )}
            <span className="cmt-name">{session.writer.writer_name}</span>
          </div>
        ) : (
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("yourName")}
            maxLength={50}
            style={{ marginBottom: 8 }}
            aria-label={t("yourName")}
          />
        )}
        <textarea
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("writeComment")}
          maxLength={1000}
          aria-label={t("writeComment")}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
          <button
            className="btn"
            onClick={submit}
            disabled={busy || !body.trim() || (!session && !name.trim()) || alreadyDone}
          >
            {t("post")}
          </button>
          {msg && <span style={{ fontSize: 13, color: "var(--muted)" }}>{msg}</span>}
        </div>
      </div>
      {items.map((c) => {
        const own = isMine(c);
        return (
          <div key={c.id} className="card cmt-card">
            <div className="cmt-ava">{c.display_name[0]?.toUpperCase()}</div>
            <div className="cmt-main">
              <div className="cmt-head">
                <span className="cmt-name">{c.display_name}</span>
                <span className="cmt-date">
                  {new Date(c.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US")}
                </span>
                {own && (
                  <span className="cmt-menu-wrap">
                    <button
                      className="cmt-dots"
                      onClick={() => setMenuId(menuId === c.id ? "" : c.id)}
                      aria-label="More"
                    >
                      <Icon name="dots" size={14} />
                    </button>
                    {menuId === c.id && (
                      <>
                        <span className="cmt-veil" onClick={() => setMenuId("")} />
                        <span className="card cmt-menu">
                          <button onClick={() => startEdit(c)}>{t("editCmt")}</button>
                          <button className="danger" onClick={() => doDelete(c)}>
                            {t("deleteBtn")}
                          </button>
                        </span>
                      </>
                    )}
                  </span>
                )}
              </div>
              {editId === c.id ? (
                <div className="cmt-edit">
                  <textarea
                    className="textarea"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    maxLength={1000}
                    rows={3}
                  />
                  <div className="cmt-edit-btns">
                    <button className="mini-btn" onClick={() => saveEdit(c)} disabled={busy}>
                      {t("save")}
                    </button>
                    <button className="mini-btn" onClick={() => setEditId("")}>
                      {t("cancelBtn")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cmt-body">{c.body}</div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
