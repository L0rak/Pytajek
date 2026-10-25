// Polskie komunikaty dla kodów błędów Better Auth (serwer zwraca je po angielsku).
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Nieprawidłowy e-mail lub hasło.",
  INVALID_EMAIL: "Nieprawidłowy adres e-mail.",
  INVALID_PASSWORD: "Nieprawidłowe hasło.",
  PASSWORD_TOO_SHORT: "Hasło jest za krótkie.",
  PASSWORD_TOO_LONG: "Hasło jest za długie.",
  USER_ALREADY_EXISTS: "Konto z tym adresem e-mail już istnieje.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Konto z tym adresem e-mail już istnieje. Użyj innego adresu.",
  FAILED_TO_CREATE_USER: "Nie udało się utworzyć konta.",
  EMAIL_NOT_VERIFIED: "Adres e-mail nie został potwierdzony.",
};

export function authErrorMessage(
  error: { code?: string; status?: number },
  fallback: string
): string {
  if (error.status === 429) return "Za dużo prób. Spróbuj ponownie za chwilę.";
  return (error.code && MESSAGES[error.code]) || fallback;
}
