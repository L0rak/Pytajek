import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import {
  CHILD_COOKIE,
  CHILD_COOKIE_MAX_AGE,
  newSessionToken,
  normalizeCode,
  secondsLeft,
} from "@/src/lib/child";

// POST { code: "KAROL-5545" } -> ustawia ciasteczko sesji dziecka
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? normalizeCode(body.code) : "";

  const childCode = code ? await prisma.childCode.findUnique({ where: { code } }) : null;
  if (!childCode) {
    return Response.json({ error: "Nieprawidłowy kod" }, { status: 401 });
  }
  if (secondsLeft(childCode) === 0) {
    return Response.json({ error: "Czas dla tego kodu się skończył" }, { status: 403 });
  }

  const token = newSessionToken();
  await prisma.childSession.create({ data: { token, childCodeId: childCode.id } });

  const cookieStore = await cookies();
  cookieStore.set(CHILD_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHILD_COOKIE_MAX_AGE,
  });

  return Response.json({ ok: true });
}
