import type { Metadata } from "next";
import AiFull from "./AiFull";

export const metadata: Metadata = {
  title: "AI",
  description: "Lekhoni AI assistant.",
  alternates: { canonical: "/ai" },
  robots: { index: false, follow: false },
};

export default function AiPage() {
  return (
    <div className="narrow">
      <AiFull />
    </div>
  );
}
