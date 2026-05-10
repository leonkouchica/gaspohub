import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

interface Team { id: string; name: string; }
interface Member { id: string; user_id: string; member_role: string; status: string; invited_email: string | null; }

export default function StudioTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<(Member & { profile?: { first_name?: string; last_name?: string; email?: string } })[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("assistant");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data: t } = await supabase.from("studio_teams" as any).select("*").eq("owner_id", user.id).maybeSingle();
    setTeam((t as any) || null);
    if (t) {
      const { data: m } = await supabase.from("studio_members" as any).select("*").eq("team_id", (t as any).id);
      const ms = (m as any[]) || [];
      const userIds = ms.map((x) => x.user_id);
      const { data: profs } = userIds.length ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds) : { data: [] as any[] };
      setMembers(ms.map((x) => ({ ...x, profile: (profs || []).find((p: any) => p.id === x.user_id) })));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const createTeam = async () => {
    if (!user || !name) return;
    const { error } = await supabase.from("studio_teams" as any).insert({ owner_id: user.id, name });
    if (error) return toast.error(error.message);
    toast.success("Team created"); setName(""); load();
  };

  const invite = async () => {
    if (!team || !email) return;
    const { data: prof } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!prof) return toast.error("No registered user with that email. Ask them to sign up first.");
    const { error } = await supabase.from("studio_members" as any).insert({ team_id: team.id, user_id: (prof as any).id, member_role: role, invited_email: email });
    if (error) return toast.error(error.message);
    toast.success("Member added"); setEmail(""); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("studio_members" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <>
      <SEO title="Studio Team" description="Manage your studio team and assistants." />
      <div className="container mx-auto p-6 max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Studio Team</h1>
        {!team ? (
          <Card>
            <CardHeader><CardTitle>Create your studio team</CardTitle><CardDescription>Group assistants under one studio.</CardDescription></CardHeader>
            <CardContent className="flex gap-2">
              <Input placeholder="Studio name" value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={createTeam}>Create</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle>{team.name}</CardTitle><CardDescription>Invite members by email.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="member@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={invite}><UserPlus className="h-4 w-4 mr-2" />Add</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Members ({members.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {members.length === 0 ? <p className="text-muted-foreground text-sm">No members yet.</p> : members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{m.profile?.first_name} {m.profile?.last_name}</p>
                      <p className="text-sm text-muted-foreground">{m.profile?.email || m.invited_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{m.member_role}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}