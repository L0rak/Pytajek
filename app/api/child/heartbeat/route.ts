import { cookies } from "next/headers";
import { CHILD_COOKIE, chargeChildTime, getChildSession, secondsLeft } from "@/src/lib/child";

// Wywoływany cyklicznie przez ekran dziecka, gdy jest widoczny. Zwraca pozostały czas.
export async function POST() {
  const cookieStore = await cookies();
  const session = await getChildSession(cookieStore.get(CHILD_COOKIE)?.value);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const childCode = await chargeChildTime(session.id);
  return Response.json({ secondsLeft: secondsLeft(childCode) });
}
