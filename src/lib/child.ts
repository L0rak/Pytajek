import { randomBytes, randomInt } from "crypto";
import { prisma } from "./prisma";

export const CHILD_COOKIE = "pytajek_child";
export const CHILD_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Klient wysyła heartbeat co 1 s. Przerwa dłuższa niż MAX_GAP_S (ukryta karta, uśpiony tablet,
// zerwane połączenie) nie jest liczona — liczenie zaczyna się od nowa.
const MAX_GAP_S = 5;

// Pytania przyjmujemy tylko od otwartego ekranu dziecka, czyli takiego, który wysyła heartbeaty i zużywa czas.
const ACTIVE_WINDOW_MS = 10_000;

export const MAX_SECONDS_LIMIT = 24 * 60 * 60;
const MAX_NAME_LENGTH = 20;

// "Łucja Kowalska" -> "LUCJA"; bierzemy pierwsze słowo i tylko litery A-Z, żeby kod dało się łatwo wpisać.
export function normalizeChildName(name: string): string {
  return (name.trim().split(/\s+/)[0] ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/gi, "L")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, MAX_NAME_LENGTH);
}

export function normalizeCode(code: string): string {
  const [name = "", digits = ""] = code.trim().split("-");
  return `${normalizeChildName(name)}-${digits.replace(/\D/g, "")}`;
}

export async function generateUniqueCode(childName: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `${childName}-${randomInt(1000, 10000)}`;
    const exists = await prisma.childCode.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("Nie udało się wygenerować unikalnego kodu");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function secondsLeft(code: { secondsLimit: number; secondsUsed: number }): number {
  return Math.max(0, code.secondsLimit - code.secondsUsed);
}

export async function getChildSession(token: string | undefined) {
  if (!token) return null;
  const session = await prisma.childSession.findUnique({
    where: { token },
    include: { childCode: true },
  });
  // Wiek ciasteczka pilnuje tylko przeglądarka, więc skopiowany token musi wygasać także tutaj.
  if (!session || Date.now() - session.createdAt.getTime() > CHILD_COOKIE_MAX_AGE * 1000) return null;
  return session;
}

export function isChildActive(session: { lastSeenAt: Date | null }): boolean {
  return !!session.lastSeenAt && Date.now() - session.lastSeenAt.getTime() <= ACTIVE_WINDOW_MS;
}

// Dolicza czas od ostatniego heartbeatu tej sesji i zwraca aktualny stan kodu.
export async function chargeChildTime(sessionId: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.childSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { childCode: true },
    });
    const now = new Date();
    const elapsed = session.lastSeenAt
      ? Math.floor((now.getTime() - session.lastSeenAt.getTime()) / 1000)
      : 0;

    let charge = 0;
    let lastSeenAt = now;
    if (session.lastSeenAt && elapsed >= 0 && elapsed <= MAX_GAP_S) {
      charge = Math.min(elapsed, secondsLeft(session.childCode));
      // Przesuwamy znacznik tylko o pełne naliczone sekundy, żeby ułamki nie ginęły przy częstych heartbeatach.
      lastSeenAt = new Date(session.lastSeenAt.getTime() + elapsed * 1000);
    }

    // Warunek na poprzedni lastSeenAt: z równoległych heartbeatów ten sam czas nalicza tylko pierwszy.
    const { count } = await tx.childSession.updateMany({
      where: { id: sessionId, lastSeenAt: session.lastSeenAt },
      data: { lastSeenAt },
    });
    if (count === 0 || charge === 0) return session.childCode;
    return tx.childCode.update({
      where: { id: session.childCodeId },
      data: { secondsUsed: { increment: charge } },
    });
  });
}
