import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import { isRateLimited, recordAttempt } from "@/src/lib/rate-limit";
import {
  CHILD_COOKIE,
  CHILD_COOKIE_MAX_AGE,
  newSessionToken,
  normalizeCode,
  secondsLeft,
} from "@/src/lib/child";

// Kod ma tylko 9000 wariantów na imię, więc liczba błędnych prób musi być ograniczona.
// Drugi limit (na imię z kodu) działa nawet wtedy, gdy ktoś podmienia nagłówek x-forwarded-for.
const MAX_FAILURES_PER_IP = 10;
const MAX_FAILURES_PER_NAME = 30;

// POST { code: "KAROL-5545" } -> ustawia ciasteczko sesji dziecka
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? normalizeCode(body.code) : "";

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipKey = `child-login:ip:${ip}`;
  const nameKey = `child-login:name:${code.split("-")[0]}`;
  if (isRateLimited(ipKey, MAX_FAILURES_PER_IP) || isRateLimited(nameKey, MAX_FAILURES_PER_NAME)) {
    return Response.json({ error: "Za dużo prób. Spróbuj ponownie za chwilę." }, { status: 429 });
  }

  const childCode = code ? await prisma.childCode.findUnique({ where: { code } }) : null;
  if (!childCode) {
    recordAttempt(ipKey);
    recordAttempt(nameKey);
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
