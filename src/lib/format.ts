// Stała strefa: eksport rozmów formatuje daty na serwerze, a panel w przeglądarce, i oba muszą się zgadzać.
const TIME_ZONE = "Europe/Warsaw";

const dateTimeFormat = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormat = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const dayFormat = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value));
}

export function formatTime(value: string | Date): string {
  return timeFormat.format(new Date(value));
}

export function formatDay(value: string | Date): string {
  return dayFormat.format(new Date(value));
}
