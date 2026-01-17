import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  RefreshCw,
  MoreVertical,
  ExternalLink,
  Unplug,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Key,
  Shield,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getPlatformIcon, getPlatformColor } from "./PlatformIcons";
import type { SocialIntegration, PlatformConfig } from "./SocialHubTypes";

interface IntegrationCardProps {
  integration: SocialIntegration;
  platformConfig?: PlatformConfig;
  onSync: (integration: SocialIntegration) => void;
  onDisconnect: (integration: SocialIntegration) => void;
  isSyncing?: boolean;
}

export const IntegrationCard = ({
  integration,
  platformConfig,
  onSync,
  onDisconnect,
  isSyncing = false,
}: IntegrationCardProps) => {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  
  const PlatformIcon = getPlatformIcon(integration.platform);
  const platformColor = getPlatformColor(integration.platform);
  
  const getStatusBadge = () => {
    switch (integration.status) {
      case "connected":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Token Expired
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <Unplug className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Platform Icon / Avatar */}
            <div className="relative">
              {integration.platform_avatar_url ? (
                <Avatar className="h-12 w-12 border-2" style={{ borderColor: platformColor }}>
                  <AvatarImage src={integration.platform_avatar_url} />
                  <AvatarFallback style={{ backgroundColor: platformColor, color: "white" }}>
                    <PlatformIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${platformColor}20` }}
                >
                  <PlatformIcon className="h-6 w-6" style={{ color: platformColor }} />
                </div>
              )}
              {integration.connection_type === "api_key" && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">
                  {platformConfig?.display_name || integration.platform}
                </h3>
                {getStatusBadge()}
              </div>
              
              {integration.platform_username && (
                <p className="text-sm text-muted-foreground truncate">
                  @{integration.platform_username}
                </p>
              )}
              
              {integration.platform_display_name && integration.platform_display_name !== integration.platform_username && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {integration.platform_display_name}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {integration.last_sync_at && (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Synced {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}
                  </span>
                )}
                {integration.scopes && integration.scopes.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {integration.scopes.length} permissions
                  </span>
                )}
              </div>
              
              {integration.error_message && (
                <p className="text-xs text-destructive mt-2 line-clamp-2">
                  {integration.error_message}
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSync(integration)}
                disabled={isSyncing || integration.status === "disconnected"}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  {platformConfig?.developer_portal_url && (
                    <DropdownMenuItem asChild>
                      <a 
                        href={platformConfig.developer_portal_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Developer Portal
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDisconnectDialog(true)}
                  >
                    <Unplug className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {platformConfig?.display_name || integration.platform}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke access to your {integration.platform} account. You'll need to reconnect to use publishing features again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDisconnect(integration)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
