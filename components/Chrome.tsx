"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";

// Routes that render fullscreen without site chrome (header/footer/bottom-nav).
const BARE = ["/ai"];

export default function Chrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const bare = BARE.some((p) => path === p || path.startsWith(`${p}/`));
  if (bare) {
    return <main>{children}</main>;
  }
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
