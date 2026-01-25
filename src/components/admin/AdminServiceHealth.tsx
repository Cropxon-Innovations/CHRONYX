import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, Server, Database, Cloud, Zap, 
  RefreshCw, CheckCircle2, AlertCircle, XCircle
} from "lucide-react";
import { useServiceHealth } from "@/hooks/useAdmin";
import { format } from "date-fns";

const statusIcons: Record<string, React.ReactNode> = {
  healthy: <CheckCircle2 className="w-5 h-5 text-primary" />,
  degraded: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  down: <XCircle className="w-5 h-5 text-destructive" />,
};

const statusColors: Record<string, string> = {
  healthy: "bg-primary/10 text-primary border-primary/20",
  degraded: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  down: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminServiceHealth = () => {
  const { data: services, isLoading, refetch } = useServiceHealth();

  const healthySevices = services?.filter(s => s.status === "healthy")?.length || 0;
  const degradedServices = services?.filter(s => s.status === "degraded")?.length || 0;
  const downServices = services?.filter(s => s.status === "down")?.length || 0;
  const totalServices = services?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Services</p>
                <p className="text-2xl font-bold">{totalServices}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Server className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold">{healthySevices}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Degraded</p>
                <p className="text-2xl font-bold">{degradedServices}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Down</p>
                <p className="text-2xl font-bold">{downServices}</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Service Health Monitor
              </CardTitle>
              <CardDescription>
                Real-time status of all platform services
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services && services.length > 0 ? (
            <div className="space-y-4">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${statusColors[service.status]}`}
                >
                  <div className="flex items-center gap-4">
                    {statusIcons[service.status]}
                    <div>
                      <h4 className="font-medium">{service.service_name}</h4>
                      {service.error_message && (
                        <p className="text-sm text-destructive">{service.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      {service.response_time_ms && (
                        <span className="text-sm font-mono">
                          {service.response_time_ms}ms
                        </span>
                      )}
                      <Badge 
                        variant="outline" 
                        className={statusColors[service.status]}
                      >
                        {service.status}
                      </Badge>
                    </div>
                    {service.last_check_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last check: {format(new Date(service.last_check_at), "HH:mm:ss")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No services configured for monitoring</p>
              <p className="text-sm">Service health data will appear here once configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Supabase PostgreSQL</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Cloud className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-sm text-muted-foreground">Supabase Storage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Edge Functions</p>
                <p className="text-sm text-muted-foreground">Deno Runtime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminServiceHealth;
