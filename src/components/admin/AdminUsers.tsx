import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Users, Search, Shield, User, MoreHorizontal, Mail,
  Crown, Send, UserPlus, RefreshCw, Eye, MessageSquare,
  ShieldOff, UserX, UserCheck, Ban
} from "lucide-react";
import { 
  useAdminUsers, useGrantAdminRole, useRevokeAdminRole, 
  useSuspendUser, useLogAdminActivity, useCreateNotification, 
  useIsSuperAdmin 
} from "@/hooks/useAdmin";
import { format } from "date-fns";
import { toast } from "sonner";
import UserDetailModal from "./UserDetailModal";

const AdminUsers = () => {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const grantAdminRole = useGrantAdminRole();
  const revokeAdminRole = useRevokeAdminRole();
  const suspendUser = useSuspendUser();
  const logActivity = useLogAdminActivity();
  const createNotification = useCreateNotification();
  const isSuperAdmin = useIsSuperAdmin();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);
  const [broadcastDialog, setBroadcastDialog] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  
  // Confirmation dialogs
  const [userToSuspend, setUserToSuspend] = useState<{ id: string; email: string; isSuspended: boolean } | null>(null);
  const [userToRevokeAdmin, setUserToRevokeAdmin] = useState<{ id: string; email: string } | null>(null);

  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalUsers = users?.length || 0;
  const proUsers = users?.filter(u => u.subscription?.plan_type === "pro" && u.subscription?.status === "active")?.length || 0;
  const premiumUsers = users?.filter(u => u.subscription?.plan_type === "premium" && u.subscription?.status === "active")?.length || 0;
  const adminUsers = users?.filter(u => u.roles?.includes("admin"))?.length || 0;
  const suspendedUsers = users?.filter(u => (u as any).is_suspended)?.length || 0;

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

  const handleRevokeAdmin = () => {
    if (!userToRevokeAdmin) return;
    
    revokeAdminRole.mutate(userToRevokeAdmin.id, {
      onSuccess: () => {
        logActivity.mutate({
          action: `Revoked admin role from ${userToRevokeAdmin.email}`,
          target_type: "user",
          target_id: userToRevokeAdmin.id,
        });
        setUserToRevokeAdmin(null);
      }
    });
  };

  const handleSuspendUser = () => {
    if (!userToSuspend) return;
    
    const newStatus = !userToSuspend.isSuspended;
    suspendUser.mutate({ userId: userToSuspend.id, suspend: newStatus }, {
      onSuccess: () => {
        logActivity.mutate({
          action: `${newStatus ? "Suspended" : "Unsuspended"} user: ${userToSuspend.email}`,
          target_type: "user",
          target_id: userToSuspend.id,
        });
        setUserToSuspend(null);
      }
    });
  };

  const handleViewDetails = (userId: string, email: string) => {
    setSelectedUser({ id: userId, email });
  };

  const handleBroadcastToAll = () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast.error("Please enter both subject and message");
      return;
    }

    createNotification.mutate({
      title: broadcastSubject,
      message: broadcastMessage,
      notification_type: "info",
      target_audience: "all",
    }, {
      onSuccess: () => {
        logActivity.mutate({
          action: `Broadcast message to all users: ${broadcastSubject}`,
          target_type: "broadcast",
        });
        toast.success(`Message sent to all ${totalUsers} users`);
        setBroadcastDialog(false);
        setBroadcastSubject("");
        setBroadcastMessage("");
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
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
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
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10">
                <Ban className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suspendedUsers}</p>
                <p className="text-xs text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage all registered users
                {isSuperAdmin && <Badge className="ml-2 bg-amber-500/10 text-amber-500">Super Admin</Badge>}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={() => setBroadcastDialog(true)} className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Message All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isSuspended = (user as any).is_suspended;
                    return (
                      <TableRow 
                        key={user.id} 
                        className={`cursor-pointer hover:bg-muted/50 ${isSuspended ? 'opacity-60' : ''}`}
                        onClick={() => handleViewDetails(user.id, user.email)}
                      >
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
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {user.id.slice(0, 8)}...
                          </code>
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
                        <TableCell>
                          {isSuspended ? (
                            <Badge variant="destructive" className="gap-1">
                              <Ban className="w-3 h-3" />
                              Suspended
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(user.id, user.email)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Full Details
                              </DropdownMenuItem>
                              
                              {/* Admin role management */}
                              {!user.roles?.includes("admin") && (
                                <DropdownMenuItem 
                                  onClick={() => handleGrantAdmin(user.id, user.email)}
                                  className="text-primary"
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              
                              {/* Only Super Admin can revoke admin access */}
                              {user.roles?.includes("admin") && isSuperAdmin && (
                                <DropdownMenuItem 
                                  onClick={() => setUserToRevokeAdmin({ id: user.id, email: user.email })}
                                  className="text-destructive"
                                >
                                  <ShieldOff className="w-4 h-4 mr-2" />
                                  Revoke Admin
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              
                              {/* Suspend/Unsuspend user */}
                              <DropdownMenuItem 
                                onClick={() => setUserToSuspend({ 
                                  id: user.id, 
                                  email: user.email, 
                                  isSuspended: isSuspended 
                                })}
                                className={isSuspended ? "text-green-600" : "text-destructive"}
                              >
                                {isSuspended ? (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Unsuspend User
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-4 h-4 mr-2" />
                                    Suspend User
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUser?.id || null}
        userEmail={selectedUser?.email || null}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Message All Users
            </DialogTitle>
            <DialogDescription>
              Send a notification to all {totalUsers} registered users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                placeholder="Notification subject..."
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder="Write your message..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBroadcastToAll}
              disabled={createNotification.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Send to All Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Confirmation */}
      <AlertDialog open={!!userToSuspend} onOpenChange={(open) => !open && setUserToSuspend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToSuspend?.isSuspended ? "Unsuspend User?" : "Suspend User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToSuspend?.isSuspended 
                ? `This will restore access for ${userToSuspend?.email}. They will be able to log in and use the platform again.`
                : `This will prevent ${userToSuspend?.email} from accessing the platform. They won't be able to log in until unsuspended.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              className={userToSuspend?.isSuspended ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {userToSuspend?.isSuspended ? "Unsuspend" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Admin Confirmation */}
      <AlertDialog open={!!userToRevokeAdmin} onOpenChange={(open) => !open && setUserToRevokeAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Admin Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove admin privileges from {userToRevokeAdmin?.email}. They will no longer have access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAdmin}
              className="bg-destructive hover:bg-destructive/90"
            >
              Revoke Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
