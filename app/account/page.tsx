import type { Metadata } from "next";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "My account",
  description: "Your Lekhoni Kahini writer account.",
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return (
    <div className="narrow">
      <div className="section">
        <AccountClient />
      </div>
    </div>
  );
}
