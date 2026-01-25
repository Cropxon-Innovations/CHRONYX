import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Users, Search, Shield, User, MoreHorizontal, Mail,
  Ban, UserCheck, Eye, Crown, AlertTriangle
} from "lucide-react";
import { useAdminUsers, useGrantAdminRole, useLogAdminActivity, useCreateNotification } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminUsers = () => {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const grantAdminRole = useGrantAdminRole();
  const logActivity = useLogAdminActivity();
  const createNotification = useCreateNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: "view" | "suspend" | "notify" | "upgrade" | null;
    user: any;
  }>({ type: null, user: null });

  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalUsers = users?.length || 0;
  const proUsers = users?.filter(u => u.subscription?.plan_type === "pro" && u.subscription?.status === "active")?.length || 0;
  const premiumUsers = users?.filter(u => u.subscription?.plan_type === "premium" && u.subscription?.status === "active")?.length || 0;
  const adminUsers = users?.filter(u => u.roles?.includes("admin"))?.length || 0;

  const handleGrantAdmin = (userId: string, email: string) => {
    grantAdminRole.mutate(userId, {
      onSuccess: () => {
        logActivity.mutate({
          action: `Granted admin role to ${email}`,
          target_type: "user",
          target_id: userId,
        });
      }
    });
  };

  const handleSendNotification = (userId: string, email: string) => {
    createNotification.mutate({
      title: "Message from Admin",
      message: `Hello! This is a personalized message for ${email?.split('@')[0] || 'you'}.`,
      notification_type: "info",
      target_audience: "specific",
    }, {
      onSuccess: () => {
        toast.success("Notification sent to user");
        setActionDialog({ type: null, user: null });
      }
    });
  };

  const handleViewDetails = (user: any) => {
    setActionDialog({ type: "view", user });
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
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{proUsers}</p>
                <p className="text-xs text-muted-foreground">Pro Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{premiumUsers}</p>
                <p className="text-xs text-muted-foreground">Premium Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminUsers}</p>
                <p className="text-xs text-muted-foreground">Admin Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage all registered users
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {user.display_name?.[0] || user.email?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {user.display_name || "No name"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        {user.subscription ? (
                          <Badge 
                            variant={user.subscription.status === "active" ? "default" : "secondary"}
                            className={user.subscription.status === "active" ? "bg-primary/10 text-primary" : ""}
                          >
                            {user.subscription.plan_type}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.roles?.includes("admin") ? (
                          <Badge className="bg-primary/10 text-primary">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <User className="w-3 h-3 mr-1" />
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendNotification(user.id, user.email)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Notification
                            </DropdownMenuItem>
                            {!user.roles?.includes("admin") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleGrantAdmin(user.id, user.email)}
                                  className="text-primary"
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">
                        {searchQuery ? "No users match your search" : "No users found"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={actionDialog.type === "view"} onOpenChange={() => setActionDialog({ type: null, user: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Viewing information for this user
            </DialogDescription>
          </DialogHeader>
          {actionDialog.user && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={actionDialog.user.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {actionDialog.user.display_name?.[0] || actionDialog.user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{actionDialog.user.display_name || "No name"}</p>
                  <p className="text-sm text-muted-foreground">{actionDialog.user.email}</p>
                </div>
              </div>
              
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs">{actionDialog.user.id.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{actionDialog.user.created_at ? format(new Date(actionDialog.user.created_at), "PPP") : "N/A"}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Subscription</span>
                  <Badge variant="outline">
                    {actionDialog.user.subscription?.plan_type || "Free"}
                  </Badge>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Role</span>
                  <Badge variant="outline">
                    {actionDialog.user.roles?.includes("admin") ? "Admin" : "User"}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Privacy Notice
                </p>
                <p className="text-xs text-muted-foreground">
                  As per CHRONYX privacy policy, admin cannot view personal finance data, 
                  documents, or other sensitive user information.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, user: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;