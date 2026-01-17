import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Key,
  Shield,
  ExternalLink,
  Check,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { getPlatformIcon, getPlatformColor } from "./PlatformIcons";
import type { PlatformConfig, SocialIntegration } from "./SocialHubTypes";

interface ConnectPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platforms: PlatformConfig[];
  existingIntegrations: SocialIntegration[];
  onConnectOAuth: (platform: PlatformConfig) => void;
  onConnectApiKey: (platform: string, apiKey: string, apiSecret?: string) => void;
  isConnecting?: boolean;
}

export const ConnectPlatformDialog = ({
  open,
  onOpenChange,
  platforms,
  existingIntegrations,
  onConnectOAuth,
  onConnectApiKey,
  isConnecting = false,
}: ConnectPlatformDialogProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [connectionTab, setConnectionTab] = useState<"oauth" | "api_key">("oauth");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const connectedPlatforms = existingIntegrations
    .filter((i) => i.status === "connected")
    .map((i) => i.platform);

  const handleConnect = () => {
    if (!selectedPlatform) return;

    if (connectionTab === "oauth") {
      onConnectOAuth(selectedPlatform);
    } else {
      onConnectApiKey(selectedPlatform.platform, apiKey, apiSecret || undefined);
    }
  };

  const resetForm = () => {
    setSelectedPlatform(null);
    setApiKey("");
    setApiSecret("");
    setShowApiKey(false);
    setShowApiSecret(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const activePlatforms = platforms.filter((p) => p.is_active);
  const oauthPlatforms = activePlatforms.filter((p) => p.supports_oauth);
  const apiKeyPlatforms = activePlatforms.filter((p) => p.supports_api_key);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Connect Social Platform</DialogTitle>
          <DialogDescription>
            Connect your social media accounts to publish and manage content
          </DialogDescription>
        </DialogHeader>

        {!selectedPlatform ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {/* OAuth Platforms */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  OAuth Connection (Recommended)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {oauthPlatforms.map((platform) => {
                    const Icon = getPlatformIcon(platform.icon);
                    const color = getPlatformColor(platform.platform);
                    const isConnected = connectedPlatforms.includes(platform.platform);

                    return (
                      <Button
                        key={platform.platform}
                        variant="outline"
                        className="h-auto py-4 px-4 justify-start relative"
                        onClick={() => {
                          setSelectedPlatform(platform);
                          setConnectionTab("oauth");
                        }}
                        disabled={isConnected}
                      >
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{platform.display_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {platform.supports_publish && (
                              <Badge variant="secondary" className="text-xs">Publish</Badge>
                            )}
                            {platform.supports_read && (
                              <Badge variant="secondary" className="text-xs">Read</Badge>
                            )}
                          </div>
                        </div>
                        {isConnected && (
                          <Badge className="absolute top-2 right-2 bg-green-500">
                            <Check className="h-3 w-3" />
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* API Key Platforms */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Key / Bot Token
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {apiKeyPlatforms.map((platform) => {
                    const Icon = getPlatformIcon(platform.icon);
                    const color = getPlatformColor(platform.platform);
                    const isConnected = connectedPlatforms.includes(platform.platform);

                    return (
                      <Button
                        key={platform.platform}
                        variant="outline"
                        className="h-auto py-4 px-4 justify-start relative"
                        onClick={() => {
                          setSelectedPlatform(platform);
                          setConnectionTab("api_key");
                        }}
                        disabled={isConnected}
                      >
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{platform.display_name}</p>
                          <p className="text-xs text-muted-foreground">Requires API key</p>
                        </div>
                        {isConnected && (
                          <Badge className="absolute top-2 right-2 bg-green-500">
                            <Check className="h-3 w-3" />
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-6">
            {/* Selected Platform Header */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              {(() => {
                const Icon = getPlatformIcon(selectedPlatform.icon);
                const color = getPlatformColor(selectedPlatform.platform);
                return (
                  <>
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedPlatform.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlatform.supports_publish ? "Read & Publish" : "Read Only"}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Connection Method Tabs */}
            <Tabs value={connectionTab} onValueChange={(v) => setConnectionTab(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger
                  value="oauth"
                  disabled={!selectedPlatform.supports_oauth}
                  className="flex-1"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  OAuth Login
                </TabsTrigger>
                <TabsTrigger
                  value="api_key"
                  disabled={!selectedPlatform.supports_api_key}
                  className="flex-1"
                >
                  <Key className="h-4 w-4 mr-2" />
                  API Key
                </TabsTrigger>
              </TabsList>

              <TabsContent value="oauth" className="mt-4 space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Securely connect with OAuth. You'll be redirected to {selectedPlatform.display_name} to authorize access.
                  </AlertDescription>
                </Alert>

                {selectedPlatform.oauth_scopes && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Permissions requested:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlatform.oauth_scopes.map((scope) => (
                        <Badge key={scope} variant="secondary">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect with {selectedPlatform.display_name}
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="api_key" className="mt-4 space-y-4">
                <Alert variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    API keys are stored encrypted. Never share your API keys publicly.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key">API Key / Access Token</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="api-key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-7 w-7"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="api-secret">API Secret (if required)</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="api-secret"
                        type={showApiSecret ? "text" : "password"}
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="Enter your API secret (optional)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-7 w-7"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                      >
                        {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {selectedPlatform.developer_portal_url && (
                    <Button variant="link" asChild className="p-0 h-auto">
                      <a
                        href={selectedPlatform.developer_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Get API keys from {selectedPlatform.display_name}
                      </a>
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !apiKey}
                  className="w-full"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Platform"
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            <Button
              variant="ghost"
              onClick={resetForm}
              className="w-full"
            >
              ← Back to Platforms
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
