import { describe, it, expect } from "vitest";
import { buildIcs, googleCalendarUrl } from "./calendar";

describe("calendar", () => {
  const evt = {
    id: "abc",
    title: "Wedding shoot",
    description: "Outdoor",
    location: "Lagos",
    start: new Date("2026-06-01T10:00:00Z"),
    durationHours: 2,
  };

  it("builds a valid ics string", () => {
    const ics = buildIcs([evt]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Wedding shoot");
    expect(ics).toContain("DTSTART:20260601T100000Z");
    expect(ics).toContain("DTEND:20260601T120000Z");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("builds a Google Calendar url", () => {
    const url = googleCalendarUrl(evt);
    expect(url).toContain("calendar.google.com");
    expect(url).toContain("text=Wedding+shoot");
  });
});