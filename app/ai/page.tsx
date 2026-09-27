import type { Metadata, Viewport } from "next";
import AiFull from "./AiFull";

export const metadata: Metadata = {
  title: "AI",
  description: "Lekhoni AI assistant.",
  alternates: { canonical: "/ai" },
  robots: { index: false, follow: false },
};

// Keyboard resizes layout instead of panning the page,
// so the AI top bar stays visible while typing.
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

export default function AiPage() {
  return (
    <div className="narrow">
      <AiFull />
    </div>
  );
}
