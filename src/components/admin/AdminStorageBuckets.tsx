import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  HardDrive, Search, Lock, Globe, Folder, 
  Image, FileText, Shield, Database
} from "lucide-react";
import { useAllStorageBuckets } from "@/hooks/useAdminData";

const bucketDescriptions: Record<string, { description: string; icon: any; usage: string }> = {
  "syllabus": { description: "Student syllabus files", icon: FileText, usage: "Study Module" },
  "insurance-documents": { description: "User insurance documents", icon: Shield, usage: "Insurance Module" },
  "loan-documents": { description: "Loan related documents", icon: FileText, usage: "Loans Module" },
  "memories": { description: "Personal memories & photos", icon: Image, usage: "Life Recording" },
  "documents": { description: "General user documents", icon: FileText, usage: "Document Vault" },
  "vyom": { description: "Vyom platform assets", icon: Folder, usage: "Platform" },
  "chronyx": { description: "CHRONYX platform assets", icon: Folder, usage: "Platform" },
  "book-assets": { description: "eAuthor book media", icon: Image, usage: "eAuthor Module" },
  "library": { description: "Digital library content", icon: FileText, usage: "Library Module" },
  "family-documents": { description: "Family shared documents", icon: FileText, usage: "Family Hub" },
  "avatars": { description: "User profile avatars", icon: Image, usage: "Profile System" },
};

const AdminStorageBuckets = () => {
  const buckets = useAllStorageBuckets();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBuckets = buckets.filter(bucket =>
    bucket.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publicBuckets = buckets.filter(b => b.isPublic).length;
  const privateBuckets = buckets.filter(b => !b.isPublic).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{buckets.length}</p>
                <p className="text-xs text-muted-foreground">Total Buckets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publicBuckets}</p>
                <p className="text-xs text-muted-foreground">Public Buckets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10">
                <Lock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{privateBuckets}</p>
                <p className="text-xs text-muted-foreground">Private Buckets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">All Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buckets Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Storage Buckets
              </CardTitle>
              <CardDescription>
                File storage containers for user data
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search buckets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Module Usage</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuckets.map((bucket) => {
                  const info = bucketDescriptions[bucket.name] || {
                    description: "Storage bucket",
                    icon: Folder,
                    usage: "General"
                  };
                  const IconComponent = info.icon;
                  
                  return (
                    <TableRow key={bucket.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-muted">
                            <IconComponent className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <code className="font-mono text-sm font-medium">{bucket.name}</code>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {info.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{info.usage}</Badge>
                      </TableCell>
                      <TableCell>
                        {bucket.isPublic ? (
                          <Badge className="bg-green-500/10 text-green-600 gap-1">
                            <Globe className="w-3 h-3" />
                            Public
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500/10 text-orange-600 gap-1">
                            <Lock className="w-3 h-3" />
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStorageBuckets;
