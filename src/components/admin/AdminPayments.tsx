import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CreditCard, Search, TrendingUp, RefreshCcw, 
  User, FileText, Eye, CheckCircle, XCircle, Clock,
  IndianRupee, Receipt
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";

interface PaymentWithUser {
  id: string;
  invoice_number: string | null;
  amount: number;
  currency: string | null;
  plan: string | null;
  status: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string | null;
  user_id: string | null;
  billing_name: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_pincode: string | null;
  billing_gstin: string | null;
  user_email?: string;
  user_name?: string;
  user_avatar?: string;
}

const usePaymentRecordsWithUsers = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-payment-records-detailed"],
    queryFn: async () => {
      // Fetch payment records
      const { data: payments, error: paymentsError } = await supabase
        .from("payment_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch all profiles for mapping
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url");

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return payments?.map(payment => {
        const profile = profileMap.get(payment.user_id);
        return {
          ...payment,
          user_email: profile?.email,
          user_name: profile?.display_name,
          user_avatar: profile?.avatar_url,
        } as PaymentWithUser;
      }) || [];
    },
    enabled: isAdmin === true,
  });
};

const AdminPayments = () => {
  const { data: payments, isLoading, refetch } = usePaymentRecordsWithUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithUser | null>(null);

  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = 
      payment.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.razorpay_order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const totalRevenue = payments?.reduce((sum, p) => {
    if (p.status === "captured" || p.status === "completed") {
      return sum + (Number(p.amount) || 0);
    }
    return sum;
  }, 0) || 0;

  const completedPayments = payments?.filter(p => p.status === "captured" || p.status === "completed")?.length || 0;
  const pendingPayments = payments?.filter(p => p.status === "pending" || p.status === "created")?.length || 0;
  const refundedPayments = payments?.filter(p => p.status === "refunded")?.length || 0;

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "captured":
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "refunded":
        return <RefreshCcw className="w-3 h-3" />;
      case "failed":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "captured":
      case "completed":
        return "bg-green-500/10 text-green-600";
      case "refunded":
        return "bg-orange-500/10 text-orange-600";
      case "failed":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
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
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedPayments}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingPayments}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10">
                <RefreshCcw className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{refundedPayments}</p>
                <p className="text-xs text-muted-foreground">Refunded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(null)}
        >
          All ({payments?.length || 0})
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("completed")}
        >
          Completed ({completedPayments})
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("pending")}
        >
          Pending ({pendingPayments})
        </Button>
        <Button
          variant={statusFilter === "refunded" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("refunded")}
        >
          Refunded ({refundedPayments})
        </Button>
      </div>

      {/* Payments Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Records
              </CardTitle>
              <CardDescription>
                All payment transactions with user details
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow 
                      key={payment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={payment.user_avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {payment.user_name?.[0] || payment.user_email?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {payment.user_name || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {payment.user_email || "No email"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {payment.invoice_number || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.plan || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <IndianRupee className="w-3 h-3" />
                          {Number(payment.amount).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {payment.created_at ? format(new Date(payment.created_at), "MMM d, yyyy HH:mm") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(payment);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No payments match your search" : "No payments found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Payment Details
            </DialogTitle>
            <DialogDescription>
              Invoice: {selectedPayment?.invoice_number || "N/A"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedPayment.user_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedPayment.user_name?.[0] || selectedPayment.user_email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedPayment.user_name || "Unknown User"}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.user_email}</p>
                  <code className="text-xs text-muted-foreground">
                    ID: {selectedPayment.user_id?.slice(0, 8)}...
                  </code>
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="text-xl font-bold flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {Number(selectedPayment.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={`gap-1 ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Plan</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedPayment.plan}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="text-sm">
                    {selectedPayment.created_at 
                      ? format(new Date(selectedPayment.created_at), "PPpp") 
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Razorpay IDs */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Razorpay Order ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono block">
                    {selectedPayment.razorpay_order_id || "N/A"}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Razorpay Payment ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono block">
                    {selectedPayment.razorpay_payment_id || "N/A"}
                  </code>
                </div>
              </div>

              {/* Billing Address */}
              <div className="p-4 rounded-lg border border-border/50">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Billing Address
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{selectedPayment.billing_name || "N/A"}</p>
                  <p>{selectedPayment.billing_address}</p>
                  <p>
                    {selectedPayment.billing_city}, {selectedPayment.billing_state} - {selectedPayment.billing_pincode}
                  </p>
                  {selectedPayment.billing_gstin && (
                    <p className="font-mono">GSTIN: {selectedPayment.billing_gstin}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
