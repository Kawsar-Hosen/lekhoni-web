import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Lekhoni Kahini writer dashboard — stats and stories.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <div className="wrap">
      <div className="section">
        <DashboardClient />
      </div>
    </div>
  );
}
