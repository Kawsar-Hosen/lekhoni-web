"use client";

type Props = {
  /** Placement identifier, e.g. "home-feed" | "books-grid" | "book-detail". */
  slot: string;
};

/**
 * AdSense-ready ad slot. DISABLED by default: renders nothing until the
 * project owner explicitly enables it (and only after AdSense approval).
 * When enabled in future, this renders a clearly-labeled ad container —
 * ads must never mimic content.
 */
const ADS_ENABLED = false;

export default function AdSlot({ slot }: Props) {
  if (!ADS_ENABLED) return null;
  return (
    <div data-ad-slot={slot} style={{ margin: "24px 0", textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Advertisement</div>
      <div
        style={{
          minHeight: 90,
          border: "1px dashed var(--line)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        Ad space ({slot})
      </div>
    </div>
  );
}
