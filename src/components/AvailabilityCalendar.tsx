import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, Trash2 } from "lucide-react";

interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string;
}

export const AvailabilityCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [daySlots, setDaySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    start_time: "09:00",
    end_time: "17:00",
    notes: ""
  });

  useEffect(() => {
    if (user) {
      fetchAvailability();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      filterDaySlots();
    }
  }, [selectedDate, slots]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('photographer_availability')
        .select('*')
        .eq('photographer_id', user?.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      toast({
        title: "Error loading availability",
        description: "Failed to fetch your availability slots",
        variant: "destructive",
      });
    }
  };

  const filterDaySlots = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const filtered = slots.filter(slot => slot.date === dateStr);
    setDaySlots(filtered);
  };

  const handleAddSlot = async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('photographer_availability')
        .insert({
          photographer_id: user.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          notes: newSlot.notes,
          is_available: true
        });

      if (error) throw error;

      toast({
        title: "Availability added",
        description: "Your availability slot has been created",
      });

      setNewSlot({ start_time: "09:00", end_time: "17:00", notes: "" });
      setDialogOpen(false);
      fetchAvailability();
    } catch (error) {
      toast({
        title: "Failed to add availability",
        description: "Could not create availability slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('photographer_availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Availability removed",
        description: "Your availability slot has been deleted",
      });

      fetchAvailability();
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "Could not remove availability slot",
        variant: "destructive",
      });
    }
  };

  const getDatesWithAvailability = () => {
    return slots
      .filter(slot => slot.is_available)
      .map(slot => new Date(slot.date));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Select Date</span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!selectedDate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Add Availability for {selectedDate && format(selectedDate, "PPP")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={newSlot.notes}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any special notes about this time slot..."
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleAddSlot} disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add Availability"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            modifiers={{
              available: getDatesWithAvailability()
            }}
            modifiersClassNames={{
              available: "bg-primary/10 text-primary font-bold"
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "PPPP") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {daySlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No availability set for this day</p>
              <p className="text-sm mt-2">Click "Add Slot" to add your availability</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4" />
                      {slot.start_time} - {slot.end_time}
                    </div>
                    {slot.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{slot.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSlot(slot.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
