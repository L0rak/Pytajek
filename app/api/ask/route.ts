import { cookies } from "next/headers";
import {GoogleGenAI, HarmCategory, HarmBlockThreshold} from "@google/genai"
import { CHILD_COOKIE, getChildSession, secondsLeft } from "@/src/lib/child";
import { prisma } from "@/src/lib/prisma";

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
6. Bezpieczeństwo dziecka: Tylko w przypadku tematów bezwzględnie nieodpowiednich dla dzieci (przemoc, wulgaryzmy, niebezpieczeństwo, treści intymne), odpowiedz z troską: "To pytanie jest dla starszaków, kochanie. Porozmawiaj o tym z mamą lub tatą."
7. Odpowiadaj wyłącznie w czystym tekście w języku polskim.
`;

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

  let answer: string;

  // Pobieramy ostatnie 3 wiadomości, aby model rozumiał kontekst rozmowy
  const pastMessages = await prisma.chatMessage.findMany({
    where: { childId: session.childCode.childId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const formattedHistory = pastMessages
    .reverse()
    .map((m) => `Dziecko: ${m.question}\nPytajek: ${m.answer}`)
    .join("\n");

  const promptWithContext = formattedHistory
    ? `Oto wcześniejsza rozmowa:\n${formattedHistory}\n\nAktualne pytanie dziecka: ${question}`
    : question;

  const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-lite-latest"];

  try {
    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: promptWithContext,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            maxOutputTokens: 250,
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
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next candidate...`, err?.message || err);
      }
    }

    if (!response) {
      throw lastError || new Error("All models failed");
    }

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      answer = "To pytanie jest trudne lub niebezpieczne. Lepiej zapytaj o to rodziców!";
    } else {
      answer = response.text?.trim() || "Hmm, nie do końca to zrozumiałem. Możesz zapytać inaczej?";
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    answer = "Przepraszam, coś mi się pomieszało w kabelkach. Zapytaj mnie jeszcze raz!";
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

