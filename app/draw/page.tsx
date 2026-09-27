import type { Metadata } from "next";
import DrawClient from "./DrawClient";

export const metadata: Metadata = {
  title: "Drawing Board",
  description: "Draw together with friends in realtime.",
  alternates: { canonical: "/draw" },
  robots: { index: false, follow: false },
};

export default async function DrawPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const sp = await searchParams;
  return <DrawClient room={(sp.room || "").toUpperCase().slice(0, 8)} />;
}
