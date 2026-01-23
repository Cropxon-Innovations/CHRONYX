import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  FileText, 
  Heart, 
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Sparkles,
  DollarSign,
  AlertCircle,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: 'alert' | 'reminder' | 'info' | 'success';
  category: 'finance' | 'insurance' | 'document' | 'study' | 'loan' | 'general';
  title: string;
  description: string;
  link?: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  icon: any;
  iconColor: string;
  read?: boolean;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    const allNotifications: Notification[] = [];
    const today = new Date();
    const thirtyDaysLater = addDays(today, 30);
    const sevenDaysLater = addDays(today, 7);
    
    try {
      // Fetch in parallel
      const [
        emiDue,
        insuranceExpiring,
        documentsExpiring,
        lowConfidenceTxns,
        pendingReviews,
      ] = await Promise.all([
        // EMI due this week
        supabase
          .from("emi_schedule")
          .select(`
            id, 
            emi_amount, 
            emi_date, 
            payment_status,
            loans!inner(id, bank_name, user_id)
          `)
          .eq("loans.user_id", user.id)
          .neq("payment_status", "Paid")
          .gte("emi_date", format(today, "yyyy-MM-dd"))
          .lte("emi_date", format(sevenDaysLater, "yyyy-MM-dd")),
        
        // Insurance expiring in 30 days (using renewal_date)
        supabase
          .from("insurances")
          .select("id, policy_name, renewal_date, policy_type")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("renewal_date", format(today, "yyyy-MM-dd"))
          .lte("renewal_date", format(thirtyDaysLater, "yyyy-MM-dd")),
        
        // Documents expiring in 30 days
        supabase
          .from("documents")
          .select("id, title, expiry_date")
          .eq("user_id", user.id)
          .not("expiry_date", "is", null)
          .gte("expiry_date", format(today, "yyyy-MM-dd"))
          .lte("expiry_date", format(thirtyDaysLater, "yyyy-MM-dd")),
        
        // Low confidence transactions needing review
        supabase
          .from("auto_imported_transactions")
          .select("id, merchant_name, amount")
          .eq("user_id", user.id)
          .eq("needs_review", true)
          .eq("is_processed", false)
          .limit(5),
        
        // Count of pending reviews
        supabase
          .from("auto_imported_transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("needs_review", true)
          .eq("is_processed", false),
      ]);

      // Process EMI notifications
      emiDue.data?.forEach(emi => {
        const daysUntil = differenceInDays(new Date(emi.emi_date), today);
        allNotifications.push({
          id: `emi-${emi.id}`,
          type: daysUntil <= 2 ? 'alert' : 'reminder',
          category: 'loan',
          title: `EMI Due${daysUntil === 0 ? ' Today' : daysUntil === 1 ? ' Tomorrow' : ` in ${daysUntil} days`}`,
          description: `₹${Number(emi.emi_amount).toLocaleString()} for ${(emi.loans as any)?.bank_name || 'Loan'}`,
          link: '/app/loans',
          timestamp: new Date(emi.emi_date),
          priority: daysUntil <= 2 ? 'high' : 'medium',
          icon: CreditCard,
          iconColor: daysUntil <= 2 ? 'text-destructive bg-destructive/10' : 'text-amber-500 bg-amber-500/10',
        });
      });

      // Process insurance notifications
      insuranceExpiring.data?.forEach(ins => {
        if (!ins.renewal_date) return;
        const daysUntil = differenceInDays(new Date(ins.renewal_date), today);
        allNotifications.push({
          id: `ins-${ins.id}`,
          type: daysUntil <= 7 ? 'alert' : 'reminder',
          category: 'insurance',
          title: `${ins.policy_type || 'Insurance'} Renewal Due`,
          description: `${ins.policy_name} renews in ${daysUntil} days`,
          link: '/app/insurance',
          timestamp: new Date(ins.renewal_date),
          priority: daysUntil <= 7 ? 'high' : 'medium',
          icon: Heart,
          iconColor: daysUntil <= 7 ? 'text-destructive bg-destructive/10' : 'text-rose-500 bg-rose-500/10',
        });
      });

      // Process document notifications
      documentsExpiring.data?.forEach(doc => {
        const daysUntil = differenceInDays(new Date(doc.expiry_date), today);
        allNotifications.push({
          id: `doc-${doc.id}`,
          type: daysUntil <= 7 ? 'alert' : 'reminder',
          category: 'document',
          title: 'Document Expiring',
          description: `${doc.title} expires in ${daysUntil} days`,
          link: '/app/documents',
          timestamp: new Date(doc.expiry_date),
          priority: daysUntil <= 7 ? 'high' : 'low',
          icon: FileText,
          iconColor: daysUntil <= 7 ? 'text-amber-500 bg-amber-500/10' : 'text-blue-500 bg-blue-500/10',
        });
      });

      // Process transaction review notifications
      const reviewCount = pendingReviews.count || 0;
      if (reviewCount > 0) {
        allNotifications.push({
          id: 'txn-review',
          type: 'info',
          category: 'finance',
          title: `${reviewCount} Transactions Need Review`,
          description: 'Low-confidence transactions from FinanceFlow',
          link: '/app/financeflow',
          timestamp: new Date(),
          priority: 'medium',
          icon: AlertCircle,
          iconColor: 'text-primary bg-primary/10',
        });
      }

      // Sort by priority then timestamp
      allNotifications.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));
  const highPriorityCount = visibleNotifications.filter(n => n.priority === 'high').length;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-colors",
      highPriorityCount > 0 && "border-destructive/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alerts & Reminders
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                {highPriorityCount} urgent
              </Badge>
            )}
          </CardTitle>
          {visibleNotifications.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {visibleNotifications.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visibleNotifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">All caught up!</p>
            <p className="text-xs mt-1">No pending alerts or reminders</p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <AnimatePresence mode="popLayout">
              {visibleNotifications.map((notification, index) => {
                const Icon = notification.icon;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
                      notification.priority === 'high' && "bg-destructive/5"
                    )}>
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        notification.iconColor
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium leading-tight">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => dismissNotification(notification.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] h-4 px-1.5",
                              notification.priority === 'high' && "border-destructive/50 text-destructive",
                              notification.priority === 'medium' && "border-amber-500/50 text-amber-500",
                              notification.priority === 'low' && "border-muted-foreground/50"
                            )}
                          >
                            {notification.priority}
                          </Badge>
                          {notification.link && (
                            <Link to={notification.link}>
                              <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] gap-1">
                                View
                                <ChevronRight className="w-2.5 h-2.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {index < visibleNotifications.length - 1 && (
                      <Separator className="my-1 bg-border/30" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
