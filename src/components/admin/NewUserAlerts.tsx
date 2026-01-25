import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, UserPlus, Eye, Mail } from "lucide-react";
import { useNewUserNotifications } from "@/hooks/useAdminData";
import { format, formatDistanceToNow } from "date-fns";

interface NewUserAlertsProps {
  onViewUser: (userId: string, email: string) => void;
  onMessageUser: (userId: string, email: string) => void;
}

const NewUserAlerts = ({ onViewUser, onMessageUser }: NewUserAlertsProps) => {
  const { data: newUsers, isLoading } = useNewUserNotifications();

  if (isLoading) {
    return (
      <Card className="border-border/50 border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">
              Checking for new users...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!newUsers || newUsers.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 border-l-4 border-l-amber-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          New User Registrations
          <Badge className="bg-primary/10 text-primary ml-auto">
            {newUsers.length} new in 24h
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {newUsers.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <UserPlus className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {user.display_name || user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground">
                  Joined{" "}
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onViewUser(user.id, user.email)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMessageUser(user.id, user.email)}
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {newUsers.length > 5 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{newUsers.length - 5} more new users
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default NewUserAlerts;
