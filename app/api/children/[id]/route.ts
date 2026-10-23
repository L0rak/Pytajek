import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// Usuwa dziecko razem z jego kodami i historią rozmów (onDelete: Cascade).
export async function DELETE(request: Request, ctx: RouteContext<"/api/children/[id]">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { count } = await prisma.child.deleteMany({
    where: { id, parentId: session.user.id },
  });
  if (count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
