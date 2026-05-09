// Calendar export utilities (iCal + Google Calendar URL)

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toICalDate(d: Date) {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  durationHours?: number;
}

export function buildIcs(events: CalendarEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GaspoHub//Bookings//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const e of events) {
    const end = new Date(e.start.getTime() + (e.durationHours ?? 1) * 3600 * 1000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@gaspohub`,
      `DTSTAMP:${toICalDate(new Date())}`,
      `DTSTART:${toICalDate(e.start)}`,
      `DTEND:${toICalDate(end)}`,
      `SUMMARY:${(e.title || "").replace(/\n/g, " ")}`,
      `DESCRIPTION:${(e.description || "").replace(/\n/g, "\\n")}`,
      `LOCATION:${(e.location || "").replace(/\n/g, " ")}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, events: CalendarEvent[]) {
  const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const end = new Date(e.start.getTime() + (e.durationHours ?? 1) * 3600 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toICalDate(e.start).replace(/[-:]/g, "")}/${toICalDate(end).replace(/[-:]/g, "")}`,
    details: e.description ?? "",
    location: e.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}