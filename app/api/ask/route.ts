import { cookies } from "next/headers";
import { CHILD_COOKIE, getChildSession, secondsLeft } from "@/src/lib/child";
import { prisma } from "@/src/lib/prisma";

// MOCK: do czasu podpięcia backendu/modelu zwraca przykładową odpowiedź.
// Kontrakt: POST { question: string } -> { answer: string }
// Dostępne tylko dla zalogowanego dziecka, któremu został czas.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await getChildSession(cookieStore.get(CHILD_COOKIE)?.value);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (secondsLeft(session.childCode) === 0) {
    return Response.json({ error: "Time is up" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) {
    return Response.json({ error: "Missing question" }, { status: 400 });
  }

  // TODO (model): zastąpić poniższą atrapę wywołaniem modelu; resztę pliku zostawić bez zmian.
  await new Promise((resolve) => setTimeout(resolve, 800));
  const answer = `Zapytałeś: ${question}. To jest przykładowa odpowiedź. Wkrótce odpowiem naprawdę!`;

  // Historia rozmów widoczna dla rodzica w panelu ("Rozmowy").
  await prisma.chatMessage.create({
    data: { childId: session.childCode.childId, question, answer },
  });

  return Response.json({ answer });
}
