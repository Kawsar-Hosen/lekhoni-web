import { NextRequest, NextResponse } from "next/server";

const APEX_HOST = "xyteee.com";
const CANONICAL_HOST = "www.xyteee.com";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "")
    .split(":")[0]
    .toLowerCase();

  // Keep the AdMob file available directly on the apex domain. Every other
  // apex request continues to use the canonical www domain.
  if (host === APEX_HOST && request.nextUrl.pathname !== "/app-ads.txt") {
    const destination = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      `https://${CANONICAL_HOST}`,
    );
    return NextResponse.redirect(destination, 307);
  }

  return NextResponse.next();
}
