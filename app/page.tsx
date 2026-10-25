import { redirect } from "next/navigation";

// Strona główna nie ma własnej treści — rodzic loguje się, dziecko wchodzi przez /kod (link na stronie logowania).
export default function Home() {
  redirect("/sign-in");
}
