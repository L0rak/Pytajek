import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

const MAX_MESSAGES = 500;

// Historia rozmów dziecka (najnowsze MAX_MESSAGES), od najstarszej do najnowszej.
export async function GET(request: Request, ctx: RouteContext<"/api/children/[id]/chats">) {
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
    orderBy: { createdAt: "desc" },
    take: MAX_MESSAGES + 1,
    select: { id: true, question: true, answer: true, createdAt: true },
  });

  return Response.json({
    child,
    messages: messages.slice(0, MAX_MESSAGES).reverse(),
    hasMore: messages.length > MAX_MESSAGES,
  });
}
