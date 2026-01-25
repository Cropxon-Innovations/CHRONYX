import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Bell, Plus, Send, Trash2, Users, AlertCircle, 
  Info, CheckCircle, Megaphone, Clock
} from "lucide-react";
import { useAdminNotifications, useCreateNotification, useLogAdminActivity } from "@/hooks/useAdmin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const notificationTypeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  info: { icon: Info, color: "text-primary", bgColor: "bg-primary/10" },
  success: { icon: CheckCircle, color: "text-primary", bgColor: "bg-primary/10" },
  warning: { icon: AlertCircle, color: "text-primary", bgColor: "bg-primary/10" },
  feature: { icon: Megaphone, color: "text-primary", bgColor: "bg-primary/10" },
};

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useAdminNotifications();
  const createNotification = useCreateNotification();
  const logActivity = useLogAdminActivity();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    notification_type: "info",
    target_audience: "all",
    action_url: "",
    action_label: "",
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("system_notifications")
        .update({ is_active: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["system-notifications"] });
      toast.success("Notification archived");
    },
    onError: (error) => {
      console.error("Failed to delete:", error);
      toast.error("Failed to archive notification");
    },
  });

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please fill in title and message");
      return;
    }

    createNotification.mutate({
      title: formData.title,
      message: formData.message,
      notification_type: formData.notification_type,
      target_audience: formData.target_audience,
      action_url: formData.action_url || undefined,
      action_label: formData.action_label || undefined,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          title: "",
          message: "",
          notification_type: "info",
          target_audience: "all",
          action_url: "",
          action_label: "",
        });
        
        logActivity.mutate({
          action: `Sent notification: ${formData.title}`,
          target_type: "notification",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeNotifications = notifications?.filter(n => n.is_active)?.length || 0;
  const totalSent = notifications?.length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSent}</p>
                <p className="text-xs text-muted-foreground">Total Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeNotifications}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">All Users</p>
                <p className="text-xs text-muted-foreground">Target Audience</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Management */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                System Notifications
              </CardTitle>
              <CardDescription>
                Broadcast messages to all CHRONYX users
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Notification</DialogTitle>
                  <DialogDescription>
                    Send a notification to all users or a specific audience
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Notification title..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message *</Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Write your message..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formData.notification_type}
                        onValueChange={(value) => setFormData({ ...formData, notification_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="feature">Feature</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Audience</Label>
                      <Select
                        value={formData.target_audience}
                        onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="free">Free Users</SelectItem>
                          <SelectItem value="pro">Pro Users</SelectItem>
                          <SelectItem value="premium">Premium Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Action URL (optional)</Label>
                    <Input
                      value={formData.action_url}
                      onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                      placeholder="/app/feature"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Action Label (optional)</Label>
                    <Input
                      value={formData.action_label}
                      onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                      placeholder="Learn More"
                    />
                  </div>

                  {/* Preview */}
                  <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-2">Preview</p>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Info className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{formData.title || "Notification Title"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.message || "Your notification message will appear here..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreate} 
                    disabled={createNotification.isPending || !formData.title.trim() || !formData.message.trim()}
                  >
                    {createNotification.isPending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send to Users
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => {
                const config = notificationTypeConfig[notification.notification_type || "info"];
                const Icon = config?.icon || Info;
                
                return (
                  <div 
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border border-border/50 ${notification.is_active ? "bg-card" : "bg-muted/30 opacity-60"}`}
                  >
                    <div className={`p-2 rounded-lg ${config?.bgColor || "bg-primary/10"}`}>
                      <Icon className={`w-4 h-4 ${config?.color || "text-primary"}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.is_active && (
                          <Badge variant="outline" className="text-[10px]">Archived</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {notification.target_audience || "all"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {notification.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteNotification.mutate(notification.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No notifications sent yet</p>
                <p className="text-sm">Create your first notification to broadcast to users</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
