import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, Search, Filter, User, Clock,
  FileText, CreditCard, BookOpen, Settings, Shield
} from "lucide-react";
import { useActivityLogs } from "@/hooks/useAdmin";
import { format, formatDistanceToNow } from "date-fns";

const moduleIcons: Record<string, any> = {
  finance: CreditCard,
  library: BookOpen,
  study: FileText,
  settings: Settings,
  auth: Shield,
  default: Activity,
};

const moduleColors: Record<string, string> = {
  finance: "text-green-500 bg-green-500/10",
  library: "text-blue-500 bg-blue-500/10",
  study: "text-purple-500 bg-purple-500/10",
  settings: "text-orange-500 bg-orange-500/10",
  auth: "text-red-500 bg-red-500/10",
  default: "text-primary bg-primary/10",
};

const AdminActivityLogs = () => {
  const { data: logs, isLoading } = useActivityLogs();
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  }) || [];

  const uniqueModules = [...new Set(logs?.map(l => l.module) || [])];

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = format(new Date(log.created_at), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, typeof filteredLogs>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <CreditCard className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs?.filter(l => l.module === "finance").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Finance Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs?.filter(l => l.module === "library").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Library Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs?.filter(l => l.module === "study").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Study Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {uniqueModules.map(module => (
              <SelectItem key={module} value={module}>
                {module.charAt(0).toUpperCase() + module.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Timeline */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Recent user activities across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-h-[600px] overflow-y-auto">
            {Object.entries(groupedLogs).length > 0 ? (
              Object.entries(groupedLogs).map(([date, dayLogs]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-card py-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(date), "EEEE, MMMM d, yyyy")}
                    </Badge>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-border/50">
                    {dayLogs.map((log) => {
                      const Icon = moduleIcons[log.module] || moduleIcons.default;
                      const colorClass = moduleColors[log.module] || moduleColors.default;
                      
                      return (
                        <div 
                          key={log.id}
                          className="relative flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {/* Timeline dot */}
                          <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full bg-border border-2 border-card" />
                          
                          <div className={`p-2 rounded-lg ${colorClass.split(' ')[1]}`}>
                            <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{log.action}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px]">
                                {log.module}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="font-mono truncate max-w-[80px]">
                              {log.user_id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No activity logs found</p>
                <p className="text-sm">Activity will appear here as users interact with the platform</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLogs;