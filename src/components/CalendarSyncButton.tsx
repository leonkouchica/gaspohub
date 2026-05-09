import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar as CalIcon } from "lucide-react";
import { CalendarEvent, downloadIcs, googleCalendarUrl } from "@/lib/calendar";

interface Props { event: CalendarEvent; label?: string; }

export function CalendarSyncButton({ event, label = "Add to calendar" }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline"><CalIcon className="h-4 w-4 mr-2" />{label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => window.open(googleCalendarUrl(event), "_blank")}>Google Calendar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadIcs(`booking-${event.id}`, [event])}>Download .ics (Apple/Outlook)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}