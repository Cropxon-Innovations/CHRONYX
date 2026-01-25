import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Mail,
  CreditCard,
  FileText,
  Activity,
  Shield,
  Calendar,
  Clock,
  MapPin,
  Monitor,
  Send,
  Copy,
  CheckCircle,
  Smartphone,
  Globe,
  Laptop,
} from "lucide-react";
import { useUserDetails } from "@/hooks/useAdminData";
import { useLogAdminActivity } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface UserDetailModalProps {
  userId: string | null;
  userEmail: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailModal = ({
  userId,
  userEmail,
  open,
  onOpenChange,
}: UserDetailModalProps) => {
  const { user: adminUser } = useAuth();
  const { data: userDetails, isLoading } = useUserDetails(userId);
  const logActivity = useLogAdminActivity();
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const handleCopyId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("User ID copied to clipboard");
    }
  };

  const handleSendMessage = async () => {
    if (!messageSubject.trim() || !messageContent.trim()) {
      toast.error("Please enter both subject and message");
      return;
    }

    if (!userDetails?.profile?.email || !adminUser?.id) {
      toast.error("Unable to send message - missing user or admin info");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-message', {
        body: {
          recipientEmail: userDetails.profile.email,
          recipientName: userDetails.profile.display_name,
          subject: messageSubject,
          message: messageContent,
          adminId: adminUser.id,
        }
      });

      if (error) throw error;

      logActivity.mutate({
        action: `Sent email to user: ${userEmail}`,
        target_type: "user",
        target_id: userId || undefined,
        metadata: { subject: messageSubject },
      });

      toast.success("Email sent successfully to " + userDetails.profile.email);
      setMessageSubject("");
      setMessageContent("");
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send email: " + (error.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-primary" />;
      case 'tablet':
        return <Monitor className="w-4 h-4 text-primary" />;
      default:
        return <Laptop className="w-4 h-4 text-primary" />;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {userEmail}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : userDetails ? (
          <div className="space-y-4">
            {/* User Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <Avatar className="w-16 h-16">
                <AvatarImage src={userDetails.profile?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {userDetails.profile?.display_name?.[0] ||
                    userDetails.profile?.email?.[0] ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {userDetails.profile?.display_name || "No name set"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userDetails.profile?.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={
                      userDetails.subscription?.status === "active"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      userDetails.subscription?.status === "active"
                        ? "bg-primary/10 text-primary"
                        : ""
                    }
                  >
                    {userDetails.subscription?.plan_type || "Free"} Plan
                  </Badge>
                  {userDetails.roles?.includes("admin") && (
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyId}
                  className="gap-2"
                >
                  {copied ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied ? "Copied!" : "Copy ID"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {userId?.slice(0, 8)}...
                </p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="logins">Logins</TabsTrigger>
                <TabsTrigger value="message">Send Email</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Account Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">Joined</span>
                        <span>
                          {userDetails.profile?.created_at
                            ? format(
                                new Date(userDetails.profile.created_at),
                                "PPP"
                              )
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="font-mono text-xs">
                          {userId?.slice(0, 16)}...
                        </span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">2FA</span>
                        <Badge variant="outline">
                          {(userDetails.profile as any)?.two_factor_enabled
                            ? "Enabled"
                            : "Not Set"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Subscription
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">Plan</span>
                        <Badge variant="outline">
                          {userDetails.subscription?.plan_type || "Free"}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant={
                            userDetails.subscription?.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            userDetails.subscription?.status === "active"
                              ? "bg-green-500/10 text-green-600 border-green-500/30"
                              : ""
                          }
                        >
                          {userDetails.subscription?.status || "N/A"}
                        </Badge>
                      </div>
                      {userDetails.subscription?.expires_at && (
                        <div className="flex justify-between p-2 rounded bg-muted/30">
                          <span className="text-muted-foreground">
                            Expires
                          </span>
                          <span>
                            {format(
                              new Date(userDetails.subscription.expires_at),
                              "PP"
                            )}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                <ScrollArea className="h-[300px]">
                  {userDetails.payments.length > 0 ? (
                    <div className="space-y-2">
                      {userDetails.payments.map((payment: any) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <CreditCard className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {payment.invoice_number || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payment.plan} •{" "}
                                {format(new Date(payment.created_at), "PP")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              ₹{Number(payment.amount).toLocaleString()}
                            </p>
                            <Badge
                              variant={
                                payment.status === "completed" || payment.status === "captured"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                payment.status === "completed" || payment.status === "captured"
                                  ? "bg-green-500/10 text-green-600 border-green-500/30"
                                  : ""
                              }
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No payment records</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <ScrollArea className="h-[300px]">
                  {userDetails.activities.length > 0 ? (
                    <div className="space-y-2">
                      {userDetails.activities.map((activity: any) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Activity className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activity.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.module} •{" "}
                              {format(new Date(activity.created_at), "PPp")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No activity recorded</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="logins" className="mt-4">
                <ScrollArea className="h-[300px]">
                  {userDetails.loginHistory.length > 0 ? (
                    <div className="space-y-2">
                      {userDetails.loginHistory.map((login: any) => (
                        <div
                          key={login.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              {getDeviceIcon(login.device_type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {login.device_type || "Unknown Device"}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {login.browser || "Unknown"} • {login.os || "Unknown OS"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {login.city || "Unknown"},{" "}
                                  {login.country || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {login.ip_address || "Unknown IP"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {login.created_at ? format(new Date(login.created_at), "PPp") : "N/A"}
                            </p>
                            <Badge
                              variant={
                                login.status === "success" ? "default" : "destructive"
                              }
                              className={
                                login.status === "success"
                                  ? "bg-green-500/10 text-green-600 border-green-500/30"
                                  : ""
                              }
                            >
                              {login.status || "Unknown"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No login history</p>
                      <p className="text-xs mt-1">Login tracking is now enabled for new logins</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="message" className="mt-4">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email will be sent from <strong>admin@getchronyx.com</strong> to <strong>{userDetails.profile?.email}</strong>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Subject
                    </label>
                    <Input
                      placeholder="Message subject..."
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Message
                    </label>
                    <Textarea
                      placeholder="Write your message to this user..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending}
                    className="w-full gap-2"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {sending ? "Sending..." : `Send Email to ${userDetails.profile?.email?.split("@")[0]}`}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No user data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
