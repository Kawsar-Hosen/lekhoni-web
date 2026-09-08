import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Bengali books, writers and categories.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>Search</h2>
        </div>
        <SearchClient />
      </div>
    </div>
  );
}
