import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  RefreshCw,
  Plug,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { IntegrationCard } from "./IntegrationCard";
import { ConnectPlatformDialog } from "./ConnectPlatformDialog";
import { getPlatformIcon, getPlatformColor } from "./PlatformIcons";
import type { SocialIntegration, PlatformConfig } from "./SocialHubTypes";

interface IntegrationsPanelProps {
  integrations: SocialIntegration[];
  platformConfigs: PlatformConfig[];
  onConnect: (platform: PlatformConfig, method: "oauth" | "api_key", credentials?: { apiKey: string; apiSecret?: string }) => void;
  onSync: (integration: SocialIntegration) => void;
  onDisconnect: (integration: SocialIntegration) => void;
  onSyncAll: () => void;
  isSyncing?: boolean;
  isDemoMode?: boolean;
}

export const IntegrationsPanel = ({
  integrations,
  platformConfigs,
  onConnect,
  onSync,
  onDisconnect,
  onSyncAll,
  isSyncing = false,
  isDemoMode = true,
}: IntegrationsPanelProps) => {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const connectedIntegrations = integrations.filter((i) => i.status === "connected");
  const expiredIntegrations = integrations.filter((i) => i.status === "expired");
  const errorIntegrations = integrations.filter((i) => i.status === "error");

  const handleConnectOAuth = (platform: PlatformConfig) => {
    onConnect(platform, "oauth");
    setConnectDialogOpen(false);
  };

  const handleConnectApiKey = (platform: string, apiKey: string, apiSecret?: string) => {
    const config = platformConfigs.find((c) => c.platform === platform);
    if (config) {
      onConnect(config, "api_key", { apiKey, apiSecret });
    }
    setConnectDialogOpen(false);
  };

  // Platforms not yet connected
  const availablePlatforms = platformConfigs.filter(
    (config) => !integrations.some((i) => i.platform === config.platform)
  );

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            <strong>Demo Mode:</strong> Showing sample data. Connect your platforms with API keys to enable real publishing.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Plug className="h-3 w-3" />
            {connectedIntegrations.length} Connected
          </Badge>
          {expiredIntegrations.length > 0 && (
            <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/30">
              <Clock className="h-3 w-3" />
              {expiredIntegrations.length} Expired
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncAll}
            disabled={isSyncing || connectedIntegrations.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            Sync All
          </Button>
          <Button onClick={() => setConnectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Platform
          </Button>
        </div>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 ? (
        <div className="space-y-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              platformConfig={platformConfigs.find((c) => c.platform === integration.platform)}
              onSync={onSync}
              onDisconnect={onDisconnect}
              isSyncing={isSyncing}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Plug className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No Platforms Connected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your social media accounts to start publishing
            </p>
            <Button onClick={() => setConnectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Platform
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Platforms Preview */}
      {availablePlatforms.length > 0 && integrations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              More Platforms Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.slice(0, 8).map((platform) => {
                const Icon = getPlatformIcon(platform.icon);
                const color = getPlatformColor(platform.platform);
                return (
                  <Button
                    key={platform.platform}
                    variant="outline"
                    size="sm"
                    className="gap-2 opacity-60 hover:opacity-100"
                    onClick={() => setConnectDialogOpen(true)}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                    {platform.display_name}
                  </Button>
                );
              })}
              {availablePlatforms.length > 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConnectDialogOpen(true)}
                >
                  +{availablePlatforms.length - 8} more
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connect Dialog */}
      <ConnectPlatformDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        platforms={platformConfigs}
        existingIntegrations={integrations}
        onConnectOAuth={handleConnectOAuth}
        onConnectApiKey={handleConnectApiKey}
      />
    </div>
  );
};
