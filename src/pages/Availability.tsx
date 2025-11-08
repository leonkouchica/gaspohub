import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { Calendar } from "lucide-react";

const Availability = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Calendar className="h-8 w-8" />
          Availability Management
        </h1>
        <p className="text-muted-foreground">
          Set your available time slots for client bookings
        </p>
      </div>

      <AvailabilityCalendar />
    </div>
  );
};

export default Availability;
