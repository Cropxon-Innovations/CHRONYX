import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Database, Table2, Server, HardDrive, Search,
  FileCode, Layers, RefreshCw, FolderOpen, Lock, Globe
} from "lucide-react";
import { useAllEdgeFunctions, useAllStorageBuckets, useInfrastructureStats } from "@/hooks/useAdminData";

const AdminDatabase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: infraStats, refetch, isRefetching } = useInfrastructureStats();
  const edgeFunctions = useAllEdgeFunctions();
  const storageBuckets = useAllStorageBuckets();

  const filteredFunctions = edgeFunctions.filter(fn =>
    fn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBuckets = storageBuckets.filter(bucket =>
    bucket.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Table2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{infraStats?.databaseTables || 179}</p>
                <p className="text-xs text-muted-foreground">Database Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <FileCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{infraStats?.edgeFunctions || 47}</p>
                <p className="text-xs text-muted-foreground">Edge Functions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{infraStats?.storageBuckets || 11}</p>
                <p className="text-xs text-muted-foreground">Storage Buckets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{edgeFunctions.length}/{edgeFunctions.length}</p>
                <p className="text-xs text-muted-foreground">Functions Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search functions or buckets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Edge Functions */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="w-4 h-4" />
                  Edge Functions ({edgeFunctions.length})
                </CardTitle>
                <CardDescription>All deployed serverless functions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredFunctions.map((fn) => (
                <div 
                  key={fn}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium font-mono">{fn}</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    active
                  </Badge>
                </div>
              ))}
              {filteredFunctions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No functions match your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Buckets */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="w-4 h-4" />
                  Storage Buckets ({storageBuckets.length})
                </CardTitle>
                <CardDescription>File storage configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredBuckets.map((bucket) => (
                <div 
                  key={bucket.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium font-mono">{bucket.name}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={bucket.isPublic ? "default" : "secondary"}
                    className={bucket.isPublic ? "bg-primary/10 text-primary" : ""}
                  >
                    <span className="flex items-center gap-1">
                      {bucket.isPublic ? (
                        <>
                          <Globe className="w-3 h-3" />
                          public
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          private
                        </>
                      )}
                    </span>
                  </Badge>
                </div>
              ))}
              {filteredBuckets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No buckets match your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDatabase;
