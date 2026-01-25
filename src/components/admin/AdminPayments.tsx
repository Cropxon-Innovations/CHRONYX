import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { CreditCard, Search, TrendingUp } from "lucide-react";
import { usePaymentRecords } from "@/hooks/useAdmin";
import { format } from "date-fns";

const AdminPayments = () => {
  const { data: payments, isLoading } = usePaymentRecords();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments?.filter(payment => 
    payment.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.razorpay_order_id?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalRevenue = payments?.reduce((sum, p) => {
    if (p.status === "captured" || p.status === "completed") {
      return sum + (Number(p.amount) || 0);
    }
    return sum;
  }, 0) || 0;

  const completedPayments = payments?.filter(p => p.status === "captured" || p.status === "completed")?.length || 0;

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{(totalRevenue / 100).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Payments</p>
                <p className="text-2xl font-bold">{completedPayments}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{payments?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
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
                All payment transactions
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Order ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.invoice_number || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.plan || "Unknown"}</Badge>
                      </TableCell>
                      <TableCell>
                        ₹{(Number(payment.amount) / 100).toLocaleString()} {payment.currency?.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payment.status === "captured" ? "default" : "secondary"}
                          className={payment.status === "captured" ? "bg-primary/10 text-primary" : ""}
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.created_at ? format(new Date(payment.created_at), "MMM d, yyyy HH:mm") : "N/A"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {payment.razorpay_order_id || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No payments match your search" : "No payments found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
