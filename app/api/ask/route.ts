import { cookies } from "next/headers";
import {GoogleGenAI, HarmCategory, HarmBlockThreshold, type GenerateContentResponse} from "@google/genai"
import { CHILD_COOKIE, getChildSession, isChildActive, secondsLeft } from "@/src/lib/child";
import { removeEndearments } from "@/src/lib/clean-answer";
import { prisma } from "@/src/lib/prisma";
import { isRateLimited, recordAttempt } from "@/src/lib/rate-limit";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_INSTRUCTION = `
Jesteś Pytajkiem — ciepłym, serdecznym przyjacielem stworzonym do rozmowy z małymi dziećmi w wieku 4-6 lat.
Zasady:
1. Odpowiadaj prosto, zrozumiale, w 2-4 krótkich zdaniach (twoja odpowiedź będzie czytana dziecku na głos).
2. Rozumienie dziecięcej mowy i błędów mikrofonu: Dziecko może mówić niewyraźnie lub mikrofon może przekręcić słowo (np. "płonie" albo "słonia" zamiast "słonie"). Zawsze domyślaj się intencji dziecka na podstawie kontekstu i odpowiadaj na właściwe pytanie bez poprawiania malucha.
3. Pamiętaj o kontekście: Dziecko może dopytywać ("a czy one mają trąbę?", "a dlaczego nie?"). Nawiązuj do wcześniejszych pytań.
4. BEZWZGLĘDNY ZAKAZ EMOJI: Nigdy nie używaj żadnych emotikonów ani emoji (syntezator mowy czyta je na głos jako słowa).
5. BEZWZGLĘDNY ZAKAZ DŹWIĘKÓW ROBOTA: Pod żadnym pozorem nie pisz żadnych odgłosów robota, onomatopei typu "bip", "bip-bop", "bzzzt", "pik", ani gwiazdek. Mów normalnym, ciepłym głosem.
6. Bezpieczeństwo dziecka: Tylko w przypadku tematów bezwzględnie nieodpowiednich dla dzieci (przemoc, wulgaryzmy, niebezpieczeństwo, treści intymne), odpowiedz z troską: "To pytanie jest dla starszaków. Porozmawiaj o tym z mamą lub tatą."
7. Odpowiadaj wyłącznie w czystym tekście w języku polskim.
8. BEZWZGLĘDNY ZAKAZ CZUŁYCH ZWROTÓW: Nigdy nie zwracaj się do dziecka słowami "kochanie", "kochana", "kochany", "skarbie", "słoneczko" ani podobnymi. Odpowiadaj ciepło, ale bez takich zwrotów, nawet jeśli pojawiły się we wcześniejszej rozmowie.
`;

// Dłuższe wypowiedzi przycinamy, żeby jedno żądanie nie generowało dowolnie dużego kosztu w modelu.
const MAX_QUESTION_LENGTH = 500;

// Jedno pytanie głosem trwa kilka sekund, więc ten limit odcina tylko zautomatyzowane zalewanie modelu.
const MAX_QUESTIONS_PER_MINUTE = 20;

// Starsze rozmowy to już inny temat; model nie powinien do nich nawiązywać.
const CONTEXT_WINDOW_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await getChildSession(cookieStore.get(CHILD_COOKIE)?.value);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (secondsLeft(session.childCode) === 0) {
    return Response.json({ error: "Time is up" }, { status: 403 });
  }
  // Czas nalicza heartbeat: bez tego warunku pytania wysyłane bez heartbeatów nie zużywałyby limitu.
  if (!isChildActive(session)) {
    return Response.json({ error: "Child screen is not active" }, { status: 403 });
  }
  const limitKey = `ask:${session.childCodeId}`;
  if (isRateLimited(limitKey, MAX_QUESTIONS_PER_MINUTE)) {
    return Response.json({ error: "Too many questions" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const question =
    typeof body?.question === "string" ? body.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  if (!question) {
    return Response.json({ error: "Missing question" }, { status: 400 });
  }
  recordAttempt(limitKey);

  let answer: string;

  // Pobieramy ostatnie 3 wiadomości z bieżącej rozmowy, aby model rozumiał kontekst
  const pastMessages = await prisma.chatMessage.findMany({
    where: {
      childId: session.childCode.childId,
      createdAt: { gte: new Date(Date.now() - CONTEXT_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const formattedHistory = pastMessages
    .reverse()
    // Starsze odpowiedzi też czyścimy, żeby model nie naśladował zwrotów z historii.
    .map((m) => `Dziecko: ${m.question}\nPytajek: ${removeEndearments(m.answer)}`)
    .join("\n");

  const promptWithContext = formattedHistory
    ? `Oto wcześniejsza rozmowa:\n${formattedHistory}\n\nAktualne pytanie dziecka: ${question}`
    : question;

  const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-lite-latest"];

  try {
    let response: GenerateContentResponse | null = null;
    let lastError: unknown = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: promptWithContext,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            // Długość odpowiedzi ogranicza instrukcja; limit jest z zapasem, bo mogą się w nim liczyć tokeny "myślenia" modelu.
            maxOutputTokens: 1024,
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
            ],
          },
        });
        if (response) break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next candidate...`, err instanceof Error ? err.message : err);
      }
    }

    if (!response) {
      throw lastError || new Error("All models failed");
    }

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      answer = "To pytanie jest trudne lub niebezpieczne. Lepiej zapytaj o to rodziców!";
    } else {
      answer =
        removeEndearments(response.text?.trim() ?? "") ||
        "Hmm, nie do końca to zrozumiałem. Możesz zapytać inaczej?";
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    // Awarii nie zapisujemy: to nie jest rozmowa, a tekst błędu trafiłby do kontekstu kolejnych pytań.
    return Response.json({ answer: "Przepraszam, coś mi się pomieszało w kabelkach. Zapytaj mnie jeszcze raz!" });
  }

  // Persist conversation for parents in PostgreSQL
  await prisma.chatMessage.create({
    data: {
      childId: session.childCode.childId,
      question,
      answer,
    },
  });

  return Response.json({ answer });
}

