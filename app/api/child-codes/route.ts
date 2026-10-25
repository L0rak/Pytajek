import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { MAX_SECONDS_LIMIT, generateUniqueCode, normalizeChildName } from "@/src/lib/child";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const codes = await prisma.childCode.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { child: { select: { id: true, name: true } } },
  });
  return Response.json({ codes });
}

// POST { childId: string, seconds: number } -> { code }
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const childId = typeof body?.childId === "string" ? body.childId : "";
  const seconds = Number(body?.seconds);

  const child = childId
    ? await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } })
    : null;
  if (!child) {
    return Response.json({ error: "Wybierz dziecko" }, { status: 400 });
  }
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > MAX_SECONDS_LIMIT) {
    return Response.json(
      { error: `Liczba sekund musi być od 1 do ${MAX_SECONDS_LIMIT}` },
      { status: 400 }
    );
  }

  const code = await prisma.childCode.create({
    data: {
      code: await generateUniqueCode(normalizeChildName(child.name)),
      childId: child.id,
      secondsLimit: seconds,
      parentId: session.user.id,
    },
    include: { child: { select: { id: true, name: true } } },
  });
  return Response.json({ code }, { status: 201 });
}
