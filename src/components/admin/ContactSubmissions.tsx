import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail, MailOpen, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function ContactSubmissions() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: "Failed to load submissions", variant: "destructive" });
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const toggleRead = async (sub: ContactSubmission, isRead: boolean) => {
    const { error } = await supabase
      .from("contact_submissions")
      .update({ is_read: isRead })
      .eq("id", sub.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      return;
    }
    setSubmissions((prev) => prev.map((s) => (s.id === sub.id ? { ...s, is_read: isRead } : s)));
  };

  const openSubmission = async (sub: ContactSubmission) => {
    setSelected(sub);
    if (!sub.is_read) {
      await toggleRead(sub, true);
    }
  };

  const deleteSubmission = async (id: string) => {
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete submission", variant: "destructive" });
      return;
    }
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setConfirmDeleteId(null);
    toast({ title: "Deleted", description: "Submission removed" });
  };

  const unreadCount = submissions.filter((s) => !s.is_read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Submissions
            </CardTitle>
            <CardDescription>
              Messages received via the public contact form
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount} unread</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No contact submissions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id} className={!sub.is_read ? "font-medium" : ""}>
                  <TableCell>
                    {sub.is_read ? (
                      <Badge variant="secondary" className="gap-1">
                        <MailOpen className="h-3 w-3" />
                        Read
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1">
                        <Mail className="h-3 w-3" />
                        New
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{sub.name}</span>
                      <span className="text-xs text-muted-foreground">{sub.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{sub.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(sub.created_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openSubmission(sub)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleRead(sub, !sub.is_read)}
                    >
                      Mark {sub.is_read ? "unread" : "read"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDeleteId(sub.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.subject}</DialogTitle>
                <DialogDescription>
                  From {selected.name} &lt;{selected.email}&gt; ·{" "}
                  {format(new Date(selected.created_at), "PPP p")}
                </DialogDescription>
              </DialogHeader>
              <div className="bg-muted rounded-md p-4 whitespace-pre-wrap text-sm">
                {selected.message}
              </div>
              <DialogFooter>
                <Button asChild variant="outline">
                  <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}>
                    Reply via Email
                  </a>
                </Button>
                <Button onClick={() => setSelected(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && deleteSubmission(confirmDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
