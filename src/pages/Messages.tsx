import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MessageWithSender {
  id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  booking_id?: string;
  sender_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  recipient_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithSender | null>(null);
  const [newMessage, setNewMessage] = useState({ subject: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const bookingId = searchParams.get('booking');

  useEffect(() => {
    if (user) {
      fetchMessages();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${user.id},recipient_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Message change received:', payload);
            fetchMessages(); // Refetch messages on any change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', message.sender_id)
            .single();

          const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', message.recipient_id)
            .single();

          return {
            ...message,
            sender_profile: senderProfile || { first_name: '', last_name: '', avatar_url: '' },
            recipient_profile: recipientProfile || { first_name: '', last_name: '', avatar_url: '' }
          };
        })
      );

      setMessages(messagesWithProfiles);
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

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSelectMessage = (message: MessageWithSender) => {
    setSelectedMessage(message);
    if (!message.is_read && message.recipient_id === user?.id) {
      markAsRead(message.id);
      setMessages(prev => 
        prev.map(m => 
          m.id === message.id ? { ...m, is_read: true } : m
        )
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim() || !selectedMessage) return;

    setSending(true);
    try {
      const recipientId = selectedMessage.sender_id === user?.id 
        ? selectedMessage.recipient_id 
        : selectedMessage.sender_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipientId,
          subject: newMessage.subject || `Re: ${selectedMessage.subject}`,
          content: newMessage.content,
          booking_id: selectedMessage.booking_id
        });

      if (error) throw error;

      setNewMessage({ subject: "", content: "" });
      fetchMessages();
      
      toast({
        title: "Message sent!",
        description: "Your message has been delivered",
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Could not send your message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with photographers and clients
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {messages.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((message) => {
                    const isFromMe = message.sender_id === user?.id;
                    const otherProfile = isFromMe ? message.recipient_profile : message.sender_profile;
                    
                    return (
                      <div
                        key={message.id}
                        onClick={() => handleSelectMessage(message)}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                          selectedMessage?.id === message.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={otherProfile?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {otherProfile?.first_name?.[0]}
                              {otherProfile?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">
                                {otherProfile?.first_name} {otherProfile?.last_name}
                              </p>
                              {!message.is_read && message.recipient_id === user?.id && (
                                <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1 truncate">
                              {message.subject}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {message.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(message.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Detail & Reply */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={
                      selectedMessage.sender_id === user?.id 
                        ? selectedMessage.recipient_profile?.avatar_url
                        : selectedMessage.sender_profile?.avatar_url
                    } />
                    <AvatarFallback>
                      {selectedMessage.sender_id === user?.id
                        ? `${selectedMessage.recipient_profile?.first_name?.[0]}${selectedMessage.recipient_profile?.last_name?.[0]}`
                        : `${selectedMessage.sender_profile?.first_name?.[0]}${selectedMessage.sender_profile?.last_name?.[0]}`
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedMessage.sender_id === user?.id ? 'To' : 'From'}{' '}
                      {selectedMessage.sender_id === user?.id
                        ? `${selectedMessage.recipient_profile?.first_name} ${selectedMessage.recipient_profile?.last_name}`
                        : `${selectedMessage.sender_profile?.first_name} ${selectedMessage.sender_profile?.last_name}`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedMessage.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                <Separator />

                {/* Reply Form */}
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <Label htmlFor="reply-content">Reply</Label>
                    <Textarea
                      id="reply-content"
                      placeholder="Type your reply..."
                      value={newMessage.content}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                      className="mt-2"
                      required
                    />
                  </div>
                  
                  <Button type="submit" disabled={sending || !newMessage.content.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? "Sending..." : "Send Reply"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a message from the list to view and reply
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;