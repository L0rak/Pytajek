import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { CHILD_COOKIE } from "@/src/lib/child";
export async function proxy(request: NextRequest) {
    // Ekran dziecka: wystarczy ciasteczko sesji dziecka; ważność sprawdza API (/api/child/heartbeat).
    if (request.nextUrl.pathname.startsWith("/robot")) {
        if (!request.cookies.has(CHILD_COOKIE)) {
            return NextResponse.redirect(new URL("/kod", request.url));
        }
        return NextResponse.next();
    }
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if(!session) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.next();
}
export const config = {
  matcher: ["/dashboard/:path*", "/robot"], // Specify the routes the middleware applies to
};
