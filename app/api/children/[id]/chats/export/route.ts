import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { formatDateTime, formatDay, formatTime } from "@/src/lib/format";

// Cała historia rozmów dziecka jako plik Markdown do pobrania przez rodzica.
export async function GET(request: Request, ctx: RouteContext<"/api/children/[id]/chats/export">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const child = await prisma.child.findFirst({
    where: { id, parentId: session.user.id },
    select: { id: true, name: true },
  });
  if (!child) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { childId: child.id },
    orderBy: { createdAt: "asc" },
    select: { question: true, answer: true, createdAt: true },
  });

  const now = new Date();
  const lines = [
    `# Rozmowy: ${child.name} i Pytajek`,
    "",
    `Wyeksportowano: ${formatDateTime(now)} · liczba pytań: ${messages.length}`,
  ];

  let currentDay = "";
  for (const m of messages) {
    const day = formatDay(m.createdAt);
    if (day !== currentDay) {
      currentDay = day;
      lines.push("", `## ${day}`);
    }
    lines.push(
      "",
      `**${formatTime(m.createdAt)} · ${child.name}:** ${m.question}`,
      "",
      `**Pytajek:** ${m.answer}`,
    );
  }
  if (messages.length === 0) {
    lines.push("", "_Brak rozmów._");
  }

  const fileName = `rozmowy-${slugify(child.name)}-${now.toISOString().slice(0, 10)}.md`;
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}

// "Łucja Żak" -> "lucja-zak", żeby nazwa pliku była bezpieczna w nagłówku.
function slugify(name: string): string {
  return (
    name
      .replace(/ł/g, "l")
      .replace(/Ł/g, "L")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dziecko"
  );
}
