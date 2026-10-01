"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { fetchWriterNotifications } from "@/lib/api";

export default function NotifBell() {
  const { t } = useLang();
  const { session } = useAuth();
  const [unread, setUnread] = useState(0);
  const token = session?.token || "";

  const load = useCallback(async () => {
    if (!token) return;
    const r = await fetchWriterNotifications(token);
    if (r.data && "unread" in r.data) setUnread(r.data.unread);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const first = window.setTimeout(load, 0);
    const id = window.setInterval(load, 90000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [token, load]);

  const un = token ? unread : 0;
  return (
    <Link
      className="icon-plain notif-btn"
      aria-label={t("notifTitle")}
      title={t("notifTitle")}
      href={token ? "/notifications" : "/login?next=/notifications"}
    >
      <Icon name="bell" size={19} />
      {un > 0 && <span className="notif-badge">{un > 9 ? "9+" : un}</span>}
    </Link>
  );
}
