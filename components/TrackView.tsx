"use client";

import { useEffect } from "react";
import { trackView } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

export default function TrackView({ bookId }: { bookId: string }) {
  useEffect(() => {
    try {
      const key = `lk-viewed-${bookId}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {}
    trackView(bookId, getDeviceId());
  }, [bookId]);
  return null;
}
