// Original hand-drawn stroke icon set (no emoji, no icon font).
// 24x24 grid, currentColor, 2px rounded strokes.
import type { ReactNode } from "react";

export type IconName =
  | "sun"
  | "moon"
  | "system"
  | "user"
  | "menu"
  | "x"
  | "eye"
  | "heart"
  | "book"
  | "chevL"
  | "chevR"
  | "download"
  | "userPlus"
  | "userCheck"
  | "search"
  | "edit"
  | "eyeOff"
  | "dots"
  | "globe";

const PATHS: Record<IconName, ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  system: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  heart: <path d="M12 20.7C6.5 16.9 3 13.6 3 9.7 3 7.2 5 5.2 7.5 5.2c1.7 0 3.3.9 4.5 2.5 1.2-1.6 2.8-2.5 4.5-2.5 2.5 0 4.5 2 4.5 4.5 0 3.9-3.5 7.2-9 11z" />,
  book: <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />,
  chevL: <path d="M15 18l-6-6 6-6" />,
  chevR: <path d="M9 18l6-6-6-6" />,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.6 10.6 0 0 1 12 19c-6.5 0-10-7-10-7a17.6 17.6 0 0 1 4.06-4.94M9.9 4.24A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <path d="M2 2l20 20" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.4 2.9-6 6.5-6s6.5 2.6 6.5 6" />
      <path d="M18.5 8v6M15.5 11h6" />
    </>
  ),
  userCheck: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.4 2.9-6 6.5-6s6.5 2.6 6.5 6" />
      <path d="M15.5 11l2 2 4-4" />
    </>
  ),
  dots: (
    <>
      <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
};

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
