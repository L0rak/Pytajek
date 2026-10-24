const dateTimeFormat = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormat = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });

const dayFormat = new Intl.DateTimeFormat("pl-PL", {
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
