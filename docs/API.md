# Pytajek – opis API

Opis endpointów, z których korzysta frontend (stan na 23.10.2026).
Wszystkie endpointy to Route Handlery Next.js w `app/api/` i działają pod tym samym adresem co strona (`http://localhost:2337`).

- **Adam (backend)** – możesz przejąć te pliki albo przepisać je po swojemu. Frontend zależy tylko od adresów, ciał zapytań i formatów odpowiedzi opisanych poniżej.
- **Karol (model)** – Twoja część to tylko `POST /api/ask`, patrz [Podłączenie modelu](#podłączenie-modelu-karol).

---

## Logowanie i sesje

Są dwa rodzaje użytkowników, każdy z własnym ciasteczkiem:

| Kto | Jak się loguje | Ciasteczko | Czym sprawdzane w API |
|---|---|---|---|
| **Rodzic** | e-mail + hasło (Better Auth, `/api/auth/*`) | sesja Better Auth | `auth.api.getSession({ headers: request.headers })` |
| **Dziecko** | kod od rodzica, np. `KAROL-5545` (`POST /api/child/login`) | `pytajek_child` (httpOnly, 30 dni) | `getChildSession(token)` z `src/lib/child.ts` |

Ciasteczka wysyła przeglądarka sama, więc frontend nie przekazuje żadnych tokenów w nagłówkach.

`proxy.ts` pilnuje stron:
- `/dashboard/*` – bez sesji rodzica przekierowuje na `/sign-in`,
- `/robot` – bez ciasteczka dziecka przekierowuje na `/kod`.

Każdy endpoint i tak sam sprawdza sesję. Rodzic widzi i zmienia wyłącznie swoje dzieci i kody.

---

## Model danych

Plik: `prisma/schema.prisma`. Tabele `user`, `session`, `account`, `verification` pochodzą z Better Auth i nie były zmieniane.

```
user (rodzic)
 ├── child            – dziecko rodzica (imię unikalne w obrębie rodzica)
 │    ├── child_code   – kod dostępu z limitem czasu
 │    │    └── child_session – urządzenie dziecka zalogowane tym kodem
 │    └── chat_message – pytanie + odpowiedź robota
 └── child_code (parentId – dla szybkiego sprawdzania właściciela)
```

| Tabela | Najważniejsze pola |
|---|---|
| `child` | `id`, `name`, `parentId`, `createdAt` |
| `child_code` | `id`, `code` (unikalny, np. `KAROL-5545`), `childId`, `parentId`, `secondsLimit`, `secondsUsed`, `createdAt`, `updatedAt` |
| `child_session` | `id`, `token` (wartość ciasteczka), `childCodeId`, `lastSeenAt` |
| `chat_message` | `id`, `childId`, `question`, `answer`, `createdAt` |

Usuwanie jest kaskadowe:
- usunięcie dziecka usuwa jego kody, sesje i historię rozmów,
- usunięcie kodu usuwa sesje zalogowane tym kodem, więc dziecko zostaje wylogowane; historia rozmów zostaje, bo należy do dziecka.

---

## Endpointy – podsumowanie

| Metoda | Adres | Kto | Do czego |
|---|---|---|---|
| `GET` | `/api/children` | rodzic | lista dzieci |
| `POST` | `/api/children` | rodzic | dodanie dziecka |
| `DELETE` | `/api/children/{id}` | rodzic | usunięcie dziecka (z kodami i historią) |
| `GET` | `/api/children/{id}/chats` | rodzic | historia rozmów dziecka |
| `GET` | `/api/child-codes` | rodzic | lista kodów |
| `POST` | `/api/child-codes` | rodzic | wygenerowanie kodu dla dziecka |
| `DELETE` | `/api/child-codes/{id}` | rodzic | usunięcie kodu |
| `POST` | `/api/child/login` | dziecko | logowanie kodem |
| `POST` | `/api/child/heartbeat` | dziecko | naliczanie czasu, zwraca pozostały czas |
| `POST` | `/api/ask` | dziecko | pytanie do robota → odpowiedź |

Błędy mają zawsze postać `{ "error": "opis" }` z odpowiednim kodem HTTP. Komunikaty przy `400`, `403` i `409` są po polsku, bo frontend pokazuje je użytkownikowi.

---

## Endpointy rodzica

### `GET /api/children`

Lista dzieci od najstarszego wpisu.

```json
{
  "children": [
    {
      "id": "cm…",
      "name": "Karol",
      "createdAt": "2026-10-23T13:00:00.000Z",
      "messageCount": 12,
      "lastMessageAt": "2026-10-23T15:35:00.000Z"
    }
  ]
}
```

`lastMessageAt` ma wartość `null`, gdy dziecko nie ma jeszcze rozmów.

### `POST /api/children`

```json
{ "name": "Karol" }
```

- `201` → `{ "child": { …jak wyżej, messageCount: 0, lastMessageAt: null } }`
- `400` – brak imienia, imię bez liter albo dłuższe niż 30 znaków
- `409` – rodzic ma już dziecko o tym imieniu

### `DELETE /api/children/{id}`

- `204` – usunięto (razem z kodami i historią)
- `404` – nie ma takiego dziecka albo nie należy do tego rodzica

### `GET /api/children/{id}/chats`

Ostatnie 500 rozmów, posortowane od najstarszej do najnowszej.

```json
{
  "child": { "id": "cm…", "name": "Karol" },
  "messages": [
    {
      "id": "cm…",
      "question": "Dlaczego niebo jest niebieskie?",
      "answer": "…",
      "createdAt": "2026-10-23T15:35:00.000Z"
    }
  ]
}
```

- `404` – nie ma takiego dziecka albo nie należy do tego rodzica

Panel rodzica odpytuje ten endpoint co 5 s.

### `GET /api/child-codes`

Wszystkie kody rodzica, od najnowszego.

```json
{
  "codes": [
    {
      "id": "cm…",
      "code": "KAROL-5545",
      "childId": "cm…",
      "parentId": "…",
      "secondsLimit": 300,
      "secondsUsed": 42,
      "createdAt": "…",
      "updatedAt": "…",
      "child": { "id": "cm…", "name": "Karol" }
    }
  ]
}
```

Panel rodzica odpytuje ten endpoint co 1 s, żeby licznik „Zostało … z …” był na bieżąco.

### `POST /api/child-codes`

```json
{ "childId": "cm…", "seconds": 300 }
```

- `201` → `{ "code": { …jak w liście, z polem child } }`
- `400` – brak dziecka lub cudze dziecko („Wybierz dziecko”), `seconds` spoza zakresu 1–86400

Format kodu: `IMIĘ-NNNN`, gdzie:
- `IMIĘ` to pierwsze słowo imienia, wielkimi literami, bez polskich znaków („Łucja Kowalska” → `LUCJA`),
- `NNNN` to losowe cyfry 1000–9999.

Kod jest unikalny w całej bazie.

### `DELETE /api/child-codes/{id}`

- `204` – usunięto (dziecko zalogowane tym kodem zostaje wylogowane)
- `404` – nie ma takiego kodu albo nie należy do tego rodzica

---

## Endpointy dziecka

### `POST /api/child/login`

```json
{ "code": "karol-5545" }
```

Wielkość liter i spacje dookoła nie mają znaczenia.

- `200` → `{ "ok": true }` i ustawia ciasteczko `pytajek_child`
- `401` – „Nieprawidłowy kod”
- `403` – „Czas dla tego kodu się skończył”

### `POST /api/child/heartbeat`

Bez ciała. Ekran dziecka wysyła go **co 1 s, gdy karta jest widoczna**.

- `200` → `{ "secondsLeft": 258 }`
- `401` – brak lub nieważna sesja (np. rodzic usunął kod); frontend przekierowuje wtedy na `/kod`

Zasady naliczania czasu (`chargeChildTime` w `src/lib/child.ts`):
- Do `secondsUsed` dolicza się czas od poprzedniego heartbeatu tej sesji, w pełnych sekundach.
- Przerwa dłuższa niż **5 s** (ukryta karta, uśpiony tablet, brak sieci) nie jest liczona, a liczenie zaczyna się od nowa.
- `secondsUsed` nigdy nie przekracza `secondsLimit`.

Gdy `secondsLeft` spadnie do 0, ekran dziecka blokuje przycisk i pokazuje „Pytajek odpoczywa!”.

### `POST /api/ask`

```json
{ "question": "Dlaczego niebo jest niebieskie?" }
```

- `200` → `{ "answer": "…" }`
- `400` – puste pytanie
- `401` – brak lub nieważna sesja dziecka
- `403` – czas się skończył

Pytanie pochodzi z rozpoznawania mowy w przeglądarce (`pl-PL`), a odpowiedź jest **czytana na głos** (`speechSynthesis`). Dopóki API nie odpowie, dziecko widzi „Myślę…”.

Po każdej odpowiedzi para pytanie–odpowiedź jest zapisywana w `chat_message`. Rodzic widzi ją w zakładce „Rozmowy”.

---

## Podłączenie modelu (Karol)

Obecnie `app/api/ask/route.ts` zwraca **atrapę** („Zapytałeś: … To jest przykładowa odpowiedź…”).

Wystarczy podmienić fragment oznaczony `TODO (model)`:

```ts
// TODO (model): zastąpić poniższą atrapę wywołaniem modelu; resztę pliku zostawić bez zmian.
await new Promise((resolve) => setTimeout(resolve, 800));
const answer = `Zapytałeś: ${question}. …`;
```

na wywołanie modelu, które zwraca tekst w zmiennej `answer`.

Pozostałe części pliku zostają bez zmian:
- **sprawdzanie sesji i limitu czasu** na początku pliku,
- **zapis do `chat_message`** pod spodem; bez niego rodzic nie zobaczy rozmów.

Wskazówki do promptu i odpowiedzi:
- Odpowiedź jest czytana na głos dziecku, więc powinna być **krótka, prosta i po polsku**, bez markdownu, list, emoji i linków.
- Klucz API trzymaj w `.env` (np. `MODEL_API_KEY=…`) i czytaj przez `process.env`, nie wpisuj go w kod.
- Przy błędzie modelu zwróć np. `502` z `{ "error": "…" }`. Ekran dziecka pokaże wtedy „Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.”, a rozmowa nie zostanie zapisana.

Jak przetestować bez mikrofonu (PowerShell). Najpierw wygeneruj kod w panelu rodzica i wstaw go zamiast `KAROL-5545`:

```powershell
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Method Post -Uri http://localhost:2337/api/child/login -WebSession $s -ContentType "application/json" -Body '{"code":"KAROL-5545"}'
$r = Invoke-WebRequest -UseBasicParsing -Method Post -Uri http://localhost:2337/api/ask -WebSession $s -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes('{"question":"Ile nóg ma pająk?"}'))
[Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
```

Ostatnia linia dekoduje odpowiedź jako UTF-8. Windows PowerShell 5.1 sam z siebie pokazuje polskie znaki błędnie, chociaż w bazie zapisują się poprawnie.
Testowe pytania trafiają do historii dziecka, do którego należy kod.

---

## Migracje

Po pobraniu zmian (`git pull`) każdy musi zaktualizować u siebie bazę i klienta Prismy:

```powershell
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

Migracje dodane przez frontend:
- `20261023122509_child_codes` – tabele `child_code` i `child_session`,
- `20261023160000_children_and_chats` – tabele `child` i `chat_message`; istniejące kody zostały automatycznie przypięte do dzieci utworzonych z ich imion.

## Mapa plików

| Plik | Co zawiera |
|---|---|
| `src/lib/child.ts` | stałe (ciasteczko, limity), normalizacja imion i kodów, generowanie kodów, sesje dziecka, naliczanie czasu |
| `app/api/children/**` | dzieci i historia rozmów |
| `app/api/child-codes/**` | kody dostępu |
| `app/api/child/login`, `app/api/child/heartbeat` | logowanie i czas dziecka |
| `app/api/ask/route.ts` | pytanie → odpowiedź (miejsce na model) |
| `proxy.ts` | ochrona stron `/dashboard/*` i `/robot` |
