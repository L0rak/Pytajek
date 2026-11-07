import { Prisma } from "@/src/generated/prisma/client";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { normalizeChildName } from "@/src/lib/child";

const MAX_NAME_LENGTH = 30;

// Lista dzieci rodzica z liczbą rozmów i datą ostatniej rozmowy.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const children = await prisma.child.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  return Response.json({
    children: children.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      messageCount: c._count.messages,
      lastMessageAt: c.messages[0]?.createdAt ?? null,
    })),
  });
}

// POST { name: string } -> { child }
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";

  if (!name || !normalizeChildName(name)) {
    return Response.json({ error: "Podaj imię dziecka (litery)" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return Response.json({ error: `Imię może mieć najwyżej ${MAX_NAME_LENGTH} znaków` }, { status: 400 });
  }

  // Indeks w bazie rozróżnia wielkość liter, a "Karol" i "karol" to dla rodzica to samo dziecko.
  const duplicate = await prisma.child.findFirst({
    where: { parentId: session.user.id, name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) {
    return Response.json({ error: "Masz już dziecko o tym imieniu" }, { status: 409 });
  }

  try {
    const child = await prisma.child.create({
      data: { name, parentId: session.user.id },
    });
    return Response.json(
      { child: { id: child.id, name: child.name, createdAt: child.createdAt, messageCount: 0, lastMessageAt: null } },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "Masz już dziecko o tym imieniu" }, { status: 409 });
    }
    throw e;
  }
}
