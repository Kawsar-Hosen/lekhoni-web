// Verified/profile badges — mirrors the app's BadgeIcon (verified / popular / top).
// Pure SVG, no assets, works in server and client components.
export default function VerifiedBadge({ badge, size }: { badge?: string; size?: number }) {
  if (!badge || badge === "none") return null;
  const s = size || 16;
  const style = { width: s, height: s, flexShrink: 0, display: "inline-block", verticalAlign: "-2px" } as const;

  if (badge === "verified") {
    return (
      <svg viewBox="0 0 24 24" style={style} aria-label="Verified" role="img">
        <circle cx="12" cy="12" r="10" fill="#1D9BF0" opacity="0.18" />
        <path
          d="M12 2l2.2 2.2 3-.7.8 3 3 1.4-1.4 3L21 14l-2.9 1.5.5 3.1-3.1.5L13 21.5l-2.5-2-3.1.5-.5-3.1L4 15.4l1.4-3-3-1.4 1.4-3 3-1.4.8-3 3 .7z"
          fill="#1D9BF0"
        />
        <path
          d="M8.5 12.2l2.4 2.4 4.6-5"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (badge === "popular") {
    return (
      <svg viewBox="0 0 24 24" style={style} aria-label="Popular" role="img">
        <circle cx="12" cy="12" r="10.5" fill="#C9972B" opacity="0.28" />
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill="#C9972B"
          stroke="#fff"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (badge === "top") {
    return (
      <svg viewBox="0 0 24 24" style={style} aria-label="Top writer" role="img">
        <path
          d="M12 2l2.4 2.4L18 3.2l.8 3.6 3.2 1.6-1.6 3.2L22 15l-3.2 1.6-.8 3.6-3.6-.8L12 22l-2.4-2.4L6 20.8l-.8-3.6L2 15.6l1.6-3.2L2 9l3.2-1.6.8-3.6L10.4 4.4z"
          fill="#1B5E20"
        />
        <path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return null;
}
