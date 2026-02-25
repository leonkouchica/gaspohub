import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MessagesSkeleton } from "@/components/PageSkeleton";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SEO } from "@/components/SEO";
import { MessageSquare, Send, ArrowLeft, Plus, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  booking_id: string | null;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  partnerId: string;
  partner: Profile;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bookingId = searchParams.get('booking');

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // Fetch a single profile if missing
  const ensureProfile = useCallback(async (userId: string) => {
    if (profiles.has(userId)) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', userId)
      .single();
    if (data) {
      setProfiles((prev) => {
        const next = new Map(prev);
        next.set(data.id, data);
        return next;
      });
    }
  }, [profiles]);

  useEffect(() => {
    if (user) {
      fetchMessages();

      const channel = supabase
        .channel('messages-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new as Message;
            if (msg.sender_id === user.id || msg.recipient_id === user.id) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              // Ensure we have the profile for the other party
              const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
              ensureProfile(otherId);
              scrollToBottom();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new as Message;
            if (msg.sender_id === user.id || msg.recipient_id === user.id) {
              setMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? msg : m))
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      const userIds = new Set<string>();
      (data || []).forEach((msg) => {
        userIds.add(msg.sender_id);
        userIds.add(msg.recipient_id);
      });

      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', Array.from(userIds));

        const profileMap = new Map<string, Profile>();
        (profilesData || []).forEach((p) => profileMap.set(p.id, p));
        setProfiles(profileMap);
      }
    } catch (error) {
      toast({
        title: "Error loading messages",
        description: "Failed to fetch your messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Group messages into conversations
  const conversations = useMemo(() => {
    if (!user) return [];

    const conversationMap = new Map<string, Conversation>();

    messages.forEach((msg) => {
      const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partner: profiles.get(partnerId) || { id: partnerId, first_name: null, last_name: null, avatar_url: null },
          lastMessage: msg,
          unreadCount: 0,
          messages: [],
        });
      }

      const conv = conversationMap.get(partnerId)!;
      conv.messages.push(msg);
      conv.lastMessage = msg;

      if (!msg.is_read && msg.recipient_id === user.id) {
        conv.unreadCount++;
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  }, [messages, profiles, user]);

  const selectedConv = conversations.find((c) => c.partnerId === selectedConversation);

  // Scroll to bottom when conversation changes or messages update
  useEffect(() => {
    if (selectedConv) {
      scrollToBottom();
    }
  }, [selectedConv?.messages.length, selectedConversation]);

  const markAsRead = async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds)
      .eq('recipient_id', user.id);

    setMessages((prev) =>
      prev.map((m) =>
        messageIds.includes(m.id) ? { ...m, is_read: true } : m
      )
    );
  };

  const handleSelectConversation = (partnerId: string) => {
    setSelectedConversation(partnerId);

    const conv = conversations.find((c) => c.partnerId === partnerId);
    if (conv) {
      const unreadIds = conv.messages
        .filter((m) => !m.is_read && m.recipient_id === user?.id)
        .map((m) => m.id);
      markAsRead(unreadIds);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          content: newMessage,
          subject: selectedConv?.messages[0]?.subject || null,
        });

      if (error) throw error;

      setNewMessage("");
      // Real-time subscription will append the message automatically
    } catch (error) {
      toast({
        title: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setUserSearch(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .neq('id', user?.id || '')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = (recipientId: string) => {
    setNewConvoOpen(false);
    setUserSearch("");
    setSearchResults([]);
    // If conversation exists, select it
    const existing = conversations.find((c) => c.partnerId === recipientId);
    if (existing) {
      handleSelectConversation(recipientId);
    } else {
      // Ensure profile exists
      ensureProfile(recipientId);
      setSelectedConversation(recipientId);
    }
  };

  if (loading) {
    return <MessagesSkeleton />;
  }

  return (
    <>
      <SEO
        title="Messages"
        description="Communicate with photographers and clients about your bookings."
      />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with photographers and clients
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Conversations List */}
          <Card className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
                <Dialog open={newConvoOpen} onOpenChange={setNewConvoOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or email..."
                          value={userSearch}
                          onChange={(e) => handleSearchUsers(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {searching && (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {searchResults.length > 0 && (
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {searchResults.map((profile) => (
                            <button
                              key={profile.id}
                              onClick={() => startConversation(profile.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                            >
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback>
                                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {profile.first_name || 'Unknown'} {profile.last_name || ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {userSearch.length >= 2 && !searching && searchResults.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground mb-3">No conversations yet</p>
                  <Button size="sm" variant="outline" onClick={() => setNewConvoOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Start a conversation
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.partnerId}
                        onClick={() => handleSelectConversation(conv.partnerId)}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                          selectedConversation === conv.partnerId ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.partner?.avatar_url || undefined} />
                            <AvatarFallback>
                              {conv.partner?.first_name?.[0]}
                              {conv.partner?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">
                                {conv.partner?.first_name || 'Unknown'} {conv.partner?.last_name || ''}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.lastMessage.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(conv.lastMessage.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className={`lg:col-span-2 flex flex-col ${!selectedConversation ? 'hidden lg:flex' : ''}`}>
            {selectedConv ? (
              <>
                <CardHeader className="pb-3 border-b flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                      <AvatarImage src={selectedConv.partner?.avatar_url || undefined} />
                      <AvatarFallback>
                        {selectedConv.partner?.first_name?.[0]}
                        {selectedConv.partner?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConv.partner?.first_name || 'Unknown'} {selectedConv.partner?.last_name || ''}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {selectedConv.messages.length} messages
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConv.messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isMe
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={1}
                      className="resize-none min-h-[40px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default Messages;
