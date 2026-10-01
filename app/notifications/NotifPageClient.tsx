"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import {
  fetchWriterNotifications,
  markNotifsRead,
  clearNotifs,
  type WriterNotif,
} from "@/lib/api";
import { notifIcon, notifTimeAgo, notifLink } from "@/components/notif-shared";

export default function NotifPageClient() {
  const { t, lang } = useLang();
  const { session } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WriterNotif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [perm, setPerm] = useState("default");
  const token = session?.token || "";

  const load = useCallback(async () => {
    try {
      if ("Notification" in window) setPerm(Notification.permission);
    } catch {}
    if (!token) {
      setLoading(false);
      return;
    }
    const r = await fetchWriterNotifications(token);
    if (r.data && "notifications" in r.data) {
      setItems(r.data.notifications);
      setUnread(r.data.unread);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const id = window.setInterval(load, 90000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [load]);

  const enablePush = async () => {
    try {
      if (!("Notification" in window)) return;
      const p = await Notification.requestPermission();
      setPerm(p);
    } catch {}
  };

  const openRow = async (n: WriterNotif) => {
    if (!n.is_read && token) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markNotifsRead(token, false, [n.id]);
    }
    const href = notifLink(n);
    if (href) router.push(href);
  };

  const markAll = async () => {
    if (!token) return;
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
    markNotifsRead(token, true);
  };

  const clear = async () => {
    if (!token) return;
    setItems([]);
    setUnread(0);
    clearNotifs(token);
  };

  return (
    <div className="npage">
      <div className="npage-head">
        <button className="icon-plain" onClick={() => router.back()} aria-label="Back">
          <Icon name="x" size={20} />
        </button>
        <div className="notif-head-tx">
          <strong>{t("notifTitle")}</strong>
          {unread > 0 && (
            <span>
              {unread}
              {t("notifNew")}
            </span>
          )}
        </div>
        <button className="icon-plain" onClick={clear} aria-label="Clear">
          <Icon name="trash" size={18} />
        </button>
      </div>

      {!token ? (
        <div className="notif-empty">
          <span className="notif-empty-ic">
            <Icon name="bell" size={26} />
          </span>
          <p>{t("notifLogin")}</p>
          <Link href="/login?next=/notifications" className="btn btn-premium" style={{ textDecoration: "none" }}>
            {t("signIn")}
          </Link>
        </div>
      ) : loading ? (
        <div className="loading-wrap" style={{ padding: 40 }}>
          <span className="spinner" />
        </div>
      ) : (
        <>
          {perm === "default" && (
            <div className="npage-perm">
              <span className="notif-ic">
                <Icon name="bell" size={18} />
              </span>
              <span className="notif-tx">
                <strong>{t("notifEnable")}</strong>
                <span className="notif-bd">{t("notifEnableSub")}</span>
              </span>
              <button className="btn btn-premium npage-perm-btn" onClick={enablePush}>
                {t("notifEnableBtn")}
              </button>
            </div>
          )}
          {unread > 0 && (
            <button className="notif-readall" onClick={markAll}>
              ✓ {t("notifMarkAll")}
            </button>
          )}
          {items.length ? (
            <div className="notif-list npage-list">
              {items.map((n) => (
                <button
                  key={n.id}
                  className={`notif-row${n.is_read ? "" : " unread"}`}
                  onClick={() => openRow(n)}
                >
                  <span className="notif-ic">
                    <Icon name={notifIcon(n.type)} size={17} />
                  </span>
                  <span className="notif-tx">
                    <span className="notif-tt">
                      {n.title}
                      {!n.is_read && <span className="notif-dot" />}
                    </span>
                    <span className="notif-bd">{n.body}</span>
                    <span className="notif-tm">{notifTimeAgo(n.created_at, lang)}</span>
                  </span>
                  {notifLink(n) ? <Icon name="chevR" size={16} /> : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="notif-empty">
              <span className="notif-empty-ic">
                <Icon name="bell" size={26} />
              </span>
              <strong>{t("notifEmpty")}</strong>
              <p>{t("notifEmptySub")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
