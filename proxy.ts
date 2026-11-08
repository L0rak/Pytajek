import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { CHILD_COOKIE } from "@/src/lib/child";
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // Ekran dziecka: wystarczy ciasteczko sesji dziecka; ważność sprawdza API (/api/child/heartbeat).
    if (pathname.startsWith("/robot")) {
        if (!request.cookies.has(CHILD_COOKIE)) {
            return NextResponse.redirect(new URL("/kod", request.url));
        }
        return NextResponse.next();
    }
    const session = await auth.api.getSession({ headers: request.headers });
    // Zalogowany rodzic nie ma czego szukać na ekranach logowania i rejestracji.
    if (pathname === "/sign-in" || pathname === "/sign-up") {
        return session
            ? NextResponse.redirect(new URL("/dashboard", request.url))
            : NextResponse.next();
    }
    if (!session) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.next();
}
export const config = {
  matcher: ["/dashboard/:path*", "/robot", "/sign-in", "/sign-up"], // Specify the routes the middleware applies to
};
