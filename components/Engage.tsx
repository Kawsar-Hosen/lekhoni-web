"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { setLike, followWriter, unfollowWriter, fetchFollowed } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { useLang } from "@/lib/i18n";
import { fmtCount } from "./BookCard";

export function LikeButton({ bookId, initialLikes }: { bookId: string; initialLikes: number | string }) {
  const { t } = useLang();
  const [likes, setLikes] = useState(() =>
    typeof initialLikes === "number" ? initialLikes : parseInt(String(initialLikes).replace(/[^0-9]/g, ""), 10) || 0
  );
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((v) => Math.max(0, v + (next ? 1 : -1)));
    const server = await setLike(bookId, getDeviceId(), next);
    if (server >= 0) setLikes(server);
    else {
      setLiked(!next);
      setLikes((v) => Math.max(0, v + (next ? -1 : 1)));
    }
    setBusy(false);
  };

  return (
    <button
      className={`icon-btn like-btn${liked ? " liked" : ""}`}
      onClick={toggle}
      aria-pressed={liked}
      style={liked ? { borderColor: "#ef4444", color: "#ef4444" } : undefined}
    >
      <span key={String(liked)} className="like-ic">
        <Icon name="heart" size={15} />
      </span>{" "}
      {fmtCount(likes)} · {liked ? t("unlike") : t("like")}
    </button>
  );
}

export function FollowButton({ writerId, writerName }: { writerId: string | null; writerName: string }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load real follow state (was always starting at "Follow" — the glitch).
  useEffect(() => {
    if (!writerId) return;
    const dev = getDeviceId();
    fetchFollowed(dev)
      .then((list) => {
        if (list.some((w) => w.id === writerId)) setDone(true);
      })
      .catch(() => {});
  }, [writerId]);

  if (!writerId) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const ok = done
      ? await unfollowWriter(getDeviceId(), writerId)
      : await followWriter(getDeviceId(), writerId);
    if (ok) setDone(!done);
    setBusy(false);
  };

  return (
    <button
      className={`follow-pill${done ? " on" : ""}`}
      onClick={toggle}
      disabled={busy}
      title={writerName}
    >
      <Icon name={done ? "userCheck" : "userPlus"} size={14} />{" "}
      {done ? t("unfollow") : t("follow")}
    </button>
  );
}
