// Czułe zwroty do dziecka. Dopasowujemy tylko użycie jako zwrot (przy przecinku lub końcu zdania),
// żeby nie psuć zdań w rodzaju "kochanie zwierząt jest ważne".
const ENDEARMENT = String.raw`(?:(?:moje|moja|mój)\s+)?(?:kochanie|kochana|kochany|skarbie)`;

const AT_SENTENCE_START = new RegExp(String.raw`(^|[.!?]\s+)${ENDEARMENT}\s*[,!]\s*(\p{L})`, "giu");
const INSIDE_SENTENCE = new RegExp(String.raw`,?\s+${ENDEARMENT}(?=\s*[.,!?]|\s*$)`, "giu");

// Instrukcja w prompcie nie daje gwarancji, więc zwroty usuwamy też z gotowej odpowiedzi modelu.
export function removeEndearments(text: string): string {
  return text
    .replace(AT_SENTENCE_START, (_, start: string, letter: string) => start + letter.toUpperCase())
    .replace(INSIDE_SENTENCE, "");
}
