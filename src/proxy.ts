import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, isUnlocked } from "@/lib/gate";

// Password gate for the whole site (see lib/gate.ts). Locked visitors are sent to /unlock;
// locked API calls get a 401. The lead API (/api/v1) has its own key check and stays open.
export async function proxy(request: NextRequest) {
  if (await isUnlocked(request.cookies.get(GATE_COOKIE)?.value)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "This workspace is locked. Enter the site password first." }, { status: 401 });
  }
  const url = new URL("/unlock", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!unlock|api/v1|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt).*)"],
};
