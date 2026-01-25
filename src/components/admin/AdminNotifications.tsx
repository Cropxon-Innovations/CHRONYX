import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, Send, Info, AlertTriangle, Zap, Gift } from "lucide-react";
import { useAdminNotifications, useCreateNotification } from "@/hooks/useAdmin";
import { format } from "date-fns";

const notificationIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  update: <Zap className="w-4 h-4" />,
  promo: <Gift className="w-4 h-4" />,
};

const AdminNotifications = () => {
  const { data: notifications, isLoading } = useAdminNotifications();
  const createNotification = useCreateNotification();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    notification_type: "info",
    target_audience: "all",
    action_url: "",
    action_label: "",
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.message.trim()) return;
    
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

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                System Notifications
              </CardTitle>
              <CardDescription>
                Send notifications to all users or specific groups
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Notification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send System Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Notification title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Notification message"
                      rows={3}
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
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="promo">Promo</SelectItem>
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
                      placeholder="https://..."
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
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createNotification.isPending || !formData.title.trim() || !formData.message.trim()}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createNotification.isPending ? "Sending..." : "Send Notification"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className={`p-2 rounded-lg ${
                    notification.notification_type === "warning" ? "bg-destructive/10 text-destructive" :
                    notification.notification_type === "update" ? "bg-primary/10 text-primary" :
                    notification.notification_type === "promo" ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {notificationIcons[notification.notification_type || "info"]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {notification.target_audience}
                      </Badge>
                      {!notification.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {notification.created_at ? format(new Date(notification.created_at), "MMM d, yyyy HH:mm") : "N/A"}</span>
                      {notification.expires_at && (
                        <span>Expires: {format(new Date(notification.expires_at), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications sent yet</p>
                <p className="text-sm">Send your first notification to communicate with users</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
